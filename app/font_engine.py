import os
import sys
import subprocess
import tempfile
from PIL import Image, ImageOps, ImageFilter

def convert_image_to_svg(image_path: str, svg_output_path: str) -> bool:
    """
    Converts a PNG/JPG raster image to SVG vector format using Potrace.
    Preprocesses the image to a high-contrast 1-bit BMP/PBM first.
    """
    temp_dir = os.path.dirname(svg_output_path)
    bmp_path = os.path.join(temp_dir, f"temp_{os.path.basename(image_path)}.bmp")
    
    try:
        with Image.open(image_path) as img:
            # Convert to grayscale
            gray = img.convert('L')
            # Thresholding to binary (black glyph on white background)
            threshold = 180
            binary = gray.point(lambda p: 255 if p > threshold else 0)
            
            # Ensure background is white and foreground is black for Potrace
            # Invert if center/corners are mostly dark
            corner_val = binary.getpixel((0, 0))
            if corner_val == 0:
                binary = ImageOps.invert(binary)
                
            # Convert to 1-bit image mode '1'
            bw = binary.convert('1')
            bw.save(bmp_path)
            
        # Run Potrace command to generate SVG
        # -s for SVG output, -k for black/white cutoff
        cmd = ["potrace", "-s", "-o", svg_output_path, bmp_path]
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode == 0 and os.path.exists(svg_output_path):
            return True
        else:
            print(f"Potrace error: {res.stderr}")
            return False
            
    except Exception as e:
        print(f"Error in SVG conversion for {image_path}: {e}")
        return False
    finally:
        if os.path.exists(bmp_path):
            os.remove(bmp_path)

def generate_font_with_fontforge_python(base_font_path: str, char_svg_mappings: list[dict], output_font_path: str):
    """
    Executes FontForge python logic directly if fontforge package is installed in environment.
    """
    import fontforge

    font = fontforge.open(base_font_path)
    # Ensure standard em size
    em_size = font.em
    if em_size == 0:
        em_size = 1000

    for item in char_svg_mappings:
        char = item["char"]
        svg_path = item["svg_path"]
        
        if not char or not os.path.exists(svg_path):
            continue
            
        unicode_val = ord(char)
        font.selection.select(unicode_val)
        
        # Create or select character glyph
        glyph = font.createChar(unicode_val, f"uni{unicode_val:04X}")
        glyph.clear()
        
        # Import vector outlines
        glyph.importOutlines(svg_path)
        
        # Auto-fit & Baseline alignment
        # Bounding box format: (xmin, ymin, xmax, ymax)
        bbox = glyph.boundingBox()
        if bbox and (bbox[2] - bbox[0] > 0) and (bbox[3] - bbox[1] > 0):
            glyph_height = bbox[3] - bbox[1]
            target_height = em_size * 0.75  # 75% of em height for capital/lowercase ascenders
            scale_factor = target_height / glyph_height if glyph_height > 0 else 1.0
            
            # Scale glyph
            glyph.transform((scale_factor, 0, 0, scale_factor, 0, 0))
            
            # Recompute bbox after scale
            bbox = glyph.boundingBox()
            
            # Translate to align bottom near baseline (y = 0)
            ymin = bbox[1]
            glyph.transform((1, 0, 0, 1, 0, -ymin))
            
        # Apply typography standards: Side bearings
        glyph.left_side_bearing = 50
        glyph.right_side_bearing = 50
        
    # Generate TTF font file
    font.generate(output_font_path)
    font.close()

def generate_font_via_subprocess(base_font_path: str, char_svg_mappings: list[dict], output_font_path: str):
    """
    Fallback method executing fontforge CLI with an inline Python script if python-fontforge is external.
    """
    script_content = f"""
import fontforge, sys, json

base_font_path = sys.argv[1]
output_font_path = sys.argv[2]
mappings = json.loads(sys.argv[3])

font = fontforge.open(base_font_path)
em_size = font.em if font.em > 0 else 1000

for item in mappings:
    char = item["char"]
    svg_path = item["svg_path"]
    if not char:
        continue
    unicode_val = ord(char)
    font.selection.select(unicode_val)
    glyph = font.createChar(unicode_val, "uni%04X" % unicode_val)
    glyph.clear()
    glyph.importOutlines(svg_path)
    
    bbox = glyph.boundingBox()
    if bbox and (bbox[2] - bbox[0] > 0) and (bbox[3] - bbox[1] > 0):
        glyph_height = bbox[3] - bbox[1]
        target_height = em_size * 0.75
        scale_factor = target_height / glyph_height if glyph_height > 0 else 1.0
        glyph.transform((scale_factor, 0, 0, scale_factor, 0, 0))
        
        bbox = glyph.boundingBox()
        ymin = bbox[1]
        glyph.transform((1, 0, 0, 1, 0, -ymin))
        
    glyph.left_side_bearing = 50
    glyph.right_side_bearing = 50

font.generate(output_font_path)
font.close()
"""
    with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False) as f:
        f.write(script_content)
        temp_script = f.name

    try:
        import json
        cmd = ["fontforge", "-script", temp_script, base_font_path, output_font_path, json.dumps(char_svg_mappings)]
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode != 0:
            raise RuntimeError(f"FontForge execution failed: {res.stderr}")
    finally:
        if os.path.exists(temp_script):
            os.remove(temp_script)

def process_and_build_font(base_font_path: str, mappings: list[dict], output_dir: str) -> str:
    """
    Main pipeline function:
    1. Vectorizes glyph images to SVG using Potrace
    2. Modifies base font with FontForge
    3. Returns path to compiled output TTF font file.
    """
    os.makedirs(output_dir, exist_ok=True)
    svg_dir = os.path.join(output_dir, "svgs")
    os.makedirs(svg_dir, exist_ok=True)
    
    char_svg_mappings = []
    
    for idx, item in enumerate(mappings):
        img_path = item.get("image_path")
        char = item.get("char", "").strip()
        
        if not char or not img_path or not os.path.exists(img_path):
            continue
            
        svg_filename = f"glyph_{idx}_{ord(char[0])}.svg"
        svg_path = os.path.join(svg_dir, svg_filename)
        
        success = convert_image_to_svg(img_path, svg_path)
        if success:
            char_svg_mappings.append({
                "char": char[0],
                "svg_path": svg_path
            })
            
    output_font_path = os.path.join(output_dir, "custom_handwritten_font.ttf")
    
    # Try direct Python FontForge module import
    try:
        generate_font_with_fontforge_python(base_font_path, char_svg_mappings, output_font_path)
    except ImportError:
        # Fallback to FontForge binary CLI script invocation
        generate_font_via_subprocess(base_font_path, char_svg_mappings, output_font_path)
        
    return output_font_path
