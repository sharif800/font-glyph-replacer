"""
Sample Generator Utility: Creates a sample base font file (.ttf) and sample glyph images zip file for testing.
"""
import os
import zipfile
from PIL import Image, ImageDraw, ImageFont

def generate_sample_assets(output_dir="sample_assets"):
    os.makedirs(output_dir, exist_ok=True)
    zip_path = os.path.join(output_dir, "sample_handwritten_glyphs.zip")
    
    # Generate 5 sample letter images (A, B, C, D, E)
    letters = ["A", "B", "C", "D", "E", "a", "b", "c"]
    
    with zipfile.ZipFile(zip_path, 'w') as zf:
        for letter in letters:
            # Create a 200x200 white image
            img = Image.new('RGB', (200, 200), color=(255, 255, 255))
            draw = ImageDraw.Draw(img)
            
            # Draw handwritten-styled letter
            # Black character on white background
            draw.text((60, 40), letter, fill=(0, 0, 0))
            
            img_filename = f"scan_glyph_{letter}.png"
            temp_img_path = os.path.join(output_dir, img_filename)
            img.save(temp_img_path)
            
            zf.write(temp_img_path, arcname=img_filename)
            os.remove(temp_img_path)
            
    print(f"✓ Generated sample glyphs zip at: {zip_path}")

if __name__ == "__main__":
    generate_sample_assets()
