import os
import sys
import subprocess
import tempfile
import re
from PIL import Image, ImageOps

SHORT_LOWERCASE = set("acemnorsuvwxz")
ASCENDER_LOWERCASE = set("bdfhklti")
DESCENDER_LOWERCASE = set("gjpqy")

def sanitize_font_identifier(name: str) -> str:
    """Sanitizes font name for PostScript fontname identifier (alphanumeric and hyphens only)."""
    clean = re.sub(r'[^a-zA-Z0-9-]', '', name)
    return clean if clean else "CustomFont-Regular"

def apply_font_metadata(font, metadata: dict):
    """
    Applies custom Font Family, Style, Full Name, and SFNT metadata to a FontForge font object.
    """
    family_name = metadata.get("family_name", "").strip() or "Custom Handwritten Font"
    style_name = metadata.get("style_name", "").strip() or "Regular"
    full_name = metadata.get("full_name", "").strip() or f"{family_name} {style_name}"
    postscript_name = sanitize_font_identifier(f"{family_name}-{style_name}")

    font.fontname = postscript_name
    font.familyname = family_name
    font.fullname = full_name

    font.appendSFNTName('English (US)', 'Family', family_name)
    font.appendSFNTName('English (US)', 'SubFamily', style_name)
    font.appendSFNTName('English (US)', 'Fullname', full_name)
    font.appendSFNTName('English (US)', 'Preferred Family', family_name)
    font.appendSFNTName('English (US)', 'Preferred Subfamily', style_name)

def convert_image_to_svg(image_path: str, svg_output_path: str) -> bool:
    """
    Converts a PNG/JPG raster image to SVG vector format using Potrace.
    Preprocesses the image to a high-contrast 1-bit BMP/PBM first.
    """
    temp_dir = os.path.dirname(svg_output_path)
    bmp_path = os.path.join(temp_dir, f"temp_{os.path.basename(image_path)}.bmp")
    
    try:
        with Image.open(image_path) as img:
            gray = img.convert('L')
            threshold = 180
            binary = gray.point(lambda p: 255 if p > threshold else 0)
            
            corner_val = binary.getpixel((0, 0))
            if corner_val == 0:
                binary = ImageOps.invert(binary)
                
            bw = binary.convert('1')
            bw.save(bmp_path)
            
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

def generate_font_with_fontforge_python(base_font_path: str, char_svg_mappings: list[dict], metadata: dict, output_font_path: str):
    import fontforge

    font = fontforge.open(base_font_path)
    em_size = font.em if font.em > 0 else 1000

    # Collect existing mapped unicodes
    mapped_unicodes = {ord(item["char"][0]): item for item in char_svg_mappings if item.get("char")}

    # Expand mappings so missing case counterparts (e.g. 'u' -> 'U' or 'U' -> 'u') are automatically populated
    expanded_items = list(char_svg_mappings)
    for item in char_svg_mappings:
        char = item.get("char")
        if not char:
            continue
        c = char[0]
        alt_c = c.swapcase()
        if alt_c != c and ord(alt_c) not in mapped_unicodes:
            expanded_items.append({
                "char": alt_c,
                "svg_path": item["svg_path"]
            })
            mapped_unicodes[ord(alt_c)] = True

    for item in expanded_items:
        char = item["char"]
        svg_path = item["svg_path"]
        
        if not char or not os.path.exists(svg_path):
            continue
            
        c_char = char[0]
        unicode_val = ord(c_char)
        font.selection.select(unicode_val)
        
        glyph = font.createChar(unicode_val, f"uni{unicode_val:04X}")
        glyph.clear()
        glyph.importOutlines(svg_path)
        
        bbox = glyph.boundingBox()
        if bbox and (bbox[2] - bbox[0] > 0) and (bbox[3] - bbox[1] > 0):
            glyph_height = bbox[3] - bbox[1]
            
            c_lower = c_char.lower()
            is_lowercase = c_char.islower()
            
            if is_lowercase:
                if c_lower in SHORT_LOWERCASE:
                    target_height = em_size * 0.48
                    target_ymin = 0.0
                elif c_lower in DESCENDER_LOWERCASE:
                    target_height = em_size * 0.70
                    target_ymin = -em_size * 0.20
                elif c_lower in ASCENDER_LOWERCASE:
                    target_height = em_size * 0.70
                    target_ymin = 0.0
                else:
                    target_height = em_size * 0.52
                    target_ymin = 0.0
            else:  # Uppercase A-Z, Digits 0-9, Punctuation
                target_height = em_size * 0.70
                target_ymin = 0.0

            scale_factor = target_height / glyph_height if glyph_height > 0 else 1.0
            glyph.transform((scale_factor, 0, 0, scale_factor, 0, 0))
            
            bbox = glyph.boundingBox()
            current_ymin = bbox[1]
            y_shift = target_ymin - current_ymin
            glyph.transform((1, 0, 0, 1, 0, y_shift))
            
        glyph.left_side_bearing = 50
        glyph.right_side_bearing = 50

    apply_font_metadata(font, metadata)
    font.generate(output_font_path)
    font.close()

def generate_font_via_subprocess(base_font_path: str, char_svg_mappings: list[dict], metadata: dict, output_font_path: str):
    script_content = f"""
import fontforge, sys, json, re

SHORT_LOWERCASE = set("acemnorsuvwxz")
ASCENDER_LOWERCASE = set("bdfhklti")
DESCENDER_LOWERCASE = set("gjpqy")

base_font_path = sys.argv[1]
output_font_path = sys.argv[2]
mappings = json.loads(sys.argv[3])
metadata = json.loads(sys.argv[4])

font = fontforge.open(base_font_path)
em_size = font.em if font.em > 0 else 1000

mapped_unicodes = {{ord(item["char"][0]): item for item in mappings if item.get("char")}}

expanded_items = list(mappings)
for item in mappings:
    char = item.get("char")
    if not char:
        continue
    c = char[0]
    alt_c = c.swapcase()
    if alt_c != c and ord(alt_c) not in mapped_unicodes:
        expanded_items.append({{
            "char": alt_c,
            "svg_path": item["svg_path"]
        }})
        mapped_unicodes[ord(alt_c)] = True

for item in expanded_items:
    char = item["char"]
    svg_path = item["svg_path"]
    if not char:
        continue
    c_char = char[0]
    unicode_val = ord(c_char)
    font.selection.select(unicode_val)
    glyph = font.createChar(unicode_val, "uni%04X" % unicode_val)
    glyph.clear()
    glyph.importOutlines(svg_path)
    
    bbox = glyph.boundingBox()
    if bbox and (bbox[2] - bbox[0] > 0) and (bbox[3] - bbox[1] > 0):
        glyph_height = bbox[3] - bbox[1]
        
        c_lower = c_char.lower()
        is_lowercase = c_char.islower()
        
        if is_lowercase:
            if c_lower in SHORT_LOWERCASE:
                target_height = em_size * 0.48
                target_ymin = 0.0
            elif c_lower in DESCENDER_LOWERCASE:
                target_height = em_size * 0.70
                target_ymin = -em_size * 0.20
            elif c_lower in ASCENDER_LOWERCASE:
                target_height = em_size * 0.70
                target_ymin = 0.0
            else:
                target_height = em_size * 0.52
                target_ymin = 0.0
        else:
            target_height = em_size * 0.70
            target_ymin = 0.0

        scale_factor = target_height / glyph_height if glyph_height > 0 else 1.0
        glyph.transform((scale_factor, 0, 0, scale_factor, 0, 0))
        
        bbox = glyph.boundingBox()
        current_ymin = bbox[1]
        y_shift = target_ymin - current_ymin
        glyph.transform((1, 0, 0, 1, 0, y_shift))
        
    glyph.left_side_bearing = 50
    glyph.right_side_bearing = 50

family_name = metadata.get("family_name", "").strip() or "Custom Handwritten Font"
style_name = metadata.get("style_name", "").strip() or "Regular"
full_name = metadata.get("full_name", "").strip() or (family_name + " " + style_name)
postscript_name = re.sub(r'[^a-zA-Z0-9-]', '', family_name + "-" + style_name) or "CustomFont-Regular"

font.fontname = postscript_name
font.familyname = family_name
font.fullname = full_name

font.appendSFNTName('English (US)', 'Family', family_name)
font.appendSFNTName('English (US)', 'SubFamily', style_name)
font.appendSFNTName('English (US)', 'Fullname', full_name)

font.generate(output_font_path)
font.close()
"""
    with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False) as f:
        f.write(script_content)
        temp_script = f.name

    try:
        import json
        cmd = ["fontforge", "-script", temp_script, base_font_path, output_font_path, json.dumps(char_svg_mappings), json.dumps(metadata)]
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode != 0:
            raise RuntimeError(f"FontForge execution failed: {res.stderr}")
    finally:
        if os.path.exists(temp_script):
            os.remove(temp_script)

def process_and_build_font(base_font_path: str, mappings: list[dict], metadata: dict, output_dir: str) -> str:
    """
    Mode 1 Pipeline: Vectorizes handwritten images and imports them into base font.
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
    
    try:
        generate_font_with_fontforge_python(base_font_path, char_svg_mappings, metadata, output_font_path)
    except ImportError:
        generate_font_via_subprocess(base_font_path, char_svg_mappings, metadata, output_font_path)
        
    return output_font_path

def merge_latin_fonts_with_fontforge_python(base_font_a_path: str, source_font_b_path: str, metadata: dict, output_font_path: str):
    import fontforge

    font_a = fontforge.open(base_font_a_path)
    font_b = fontforge.open(source_font_b_path)

    latin_unicodes = range(0x0020, 0x007F)
    transferred_count = 0

    for ucode in latin_unicodes:
        if ucode in font_b:
            font_b.selection.select(ucode)
            font_b.copy()
            font_a.selection.select(ucode)
            font_a.paste()
            transferred_count += 1

    apply_font_metadata(font_a, metadata)
    font_a.generate(output_font_path)

    font_a.close()
    font_b.close()
    return transferred_count

def merge_latin_fonts_via_subprocess(base_font_a_path: str, source_font_b_path: str, metadata: dict, output_font_path: str):
    script_content = f"""
import fontforge, sys, json, re

font_a_path = sys.argv[1]
font_b_path = sys.argv[2]
output_path = sys.argv[3]
metadata = json.loads(sys.argv[4])

font_a = fontforge.open(font_a_path)
font_b = fontforge.open(font_b_path)

latin_unicodes = range(0x0020, 0x007F)

for ucode in latin_unicodes:
    if ucode in font_b:
        font_b.selection.select(ucode)
        font_b.copy()
        font_a.selection.select(ucode)
        font_a.paste()

family_name = metadata.get("family_name", "").strip() or "Merged Latin Font"
style_name = metadata.get("style_name", "").strip() or "Regular"
full_name = metadata.get("full_name", "").strip() or (family_name + " " + style_name)
postscript_name = re.sub(r'[^a-zA-Z0-9-]', '', family_name + "-" + style_name) or "MergedLatinFont-Regular"

font_a.fontname = postscript_name
font_a.familyname = family_name
font_a.fullname = full_name

font_a.appendSFNTName('English (US)', 'Family', family_name)
font_a.appendSFNTName('English (US)', 'SubFamily', style_name)
font_a.appendSFNTName('English (US)', 'Fullname', full_name)

font_a.generate(output_path)
font_a.close()
font_b.close()
"""
    with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False) as f:
        f.write(script_content)
        temp_script = f.name

    try:
        import json
        cmd = ["fontforge", "-script", temp_script, base_font_a_path, source_font_b_path, output_font_path, json.dumps(metadata)]
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode != 0:
            raise RuntimeError(f"FontForge font merge execution failed: {res.stderr}")
    finally:
        if os.path.exists(temp_script):
            os.remove(temp_script)

def merge_latin_fonts(base_font_a_path: str, source_font_b_path: str, metadata: dict, output_dir: str) -> str:
    os.makedirs(output_dir, exist_ok=True)
    output_font_path = os.path.join(output_dir, "merged_latin_font.ttf")

    try:
        merge_latin_fonts_with_fontforge_python(base_font_a_path, source_font_b_path, metadata, output_font_path)
    except ImportError:
        merge_latin_fonts_via_subprocess(base_font_a_path, source_font_b_path, metadata, output_font_path)

    return output_font_path
