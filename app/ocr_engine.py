import os
import re
import zipfile
import base64
from io import BytesIO
from PIL import Image, ImageOps, ImageEnhance
import pytesseract

def preprocess_image_for_ocr(img: Image.Image) -> Image.Image:
    """Preprocess image for better OCR accuracy on handwritten single glyphs."""
    # Convert to grayscale
    gray = img.convert('L')
    
    # Enhance contrast
    enhancer = ImageEnhance.Contrast(gray)
    gray = enhancer.enhance(2.0)
    
    # Binarize / thresholding
    threshold = 180
    binary = gray.point(lambda p: 255 if p > threshold else 0)
    
    # Invert if glyph is white on black background
    # We want black character on white background for Tesseract
    extrema = binary.getextrema()
    if extrema:
        # Check center region background color
        width, height = binary.size
        corner_pixel = binary.getpixel((0, 0))
        if corner_pixel == 0:  # Dark background
            binary = ImageOps.invert(binary)
            
    return binary

def guess_character_from_filename(filename: str) -> str:
    """Fallback guessing character from file basename e.g. letter_A.png -> A."""
    name = os.path.splitext(os.path.basename(filename))[0]
    # Check for patterns like 'char_A', 'A', 'letter_a'
    match = re.search(r'(?:char|letter|glyph)?[_\s-]*([A-Za-z0-9])', name, re.IGNORECASE)
    if match:
        return match.group(1)
    # Check first alphabetical char
    for ch in name:
        if ch.isalpha():
            return ch
    return "A"

def extract_and_ocr_zip(zip_path: str, extract_dir: str) -> list[dict]:
    """
    Extract zip file, scan images, perform Tesseract OCR, and return mapping items.
    Returns list of dicts: [
        {
            "id": "file_1",
            "filename": "img1.png",
            "image_b64": "data:image/png;base64,...",
            "image_path": "/path/to/extracted/img1.png",
            "guessed_char": "A",
            "confidence": 0.85
        }
    ]
    """
    os.makedirs(extract_dir, exist_ok=True)
    results = []
    
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(extract_dir)
        
    valid_exts = {'.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.webp'}
    image_files = []
    
    for root, _, files in os.walk(extract_dir):
        for f in files:
            ext = os.path.splitext(f)[1].lower()
            if ext in valid_exts and not f.startswith('.'):
                image_files.append(os.path.join(root, f))
                
    image_files.sort()
    
    # Custom Tesseract configuration for single character recognition
    tess_config = r'--psm 10 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
    
    for idx, img_path in enumerate(image_files):
        rel_filename = os.path.relpath(img_path, extract_dir)
        guessed_char = ""
        
        try:
            with Image.open(img_path) as img:
                img_copy = img.copy()
                processed_img = preprocess_image_for_ocr(img_copy)
                
                # Perform OCR
                txt = pytesseract.image_to_string(processed_img, config=tess_config).strip()
                
                # Filter for valid single character
                clean_chars = [c for c in txt if c.isalpha()]
                if clean_chars:
                    guessed_char = clean_chars[0]
                else:
                    guessed_char = guess_character_from_filename(rel_filename)
                    
                # Convert image to base64 thumbnail for fast frontend display
                buffered = BytesIO()
                # Ensure RBG / PNG saving
                img_display = img_copy.convert('RGBA')
                img_display.thumbnail((150, 150))
                img_display.save(buffered, format="PNG")
                img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')
                image_b64 = f"data:image/png;base64,{img_str}"
                
        except (pytesseract.TesseractNotFoundError, Exception) as e:
            # Fallback if tesseract not installed locally or image read error
            guessed_char = guess_character_from_filename(rel_filename)
            try:
                with Image.open(img_path) as img:
                    buffered = BytesIO()
                    img.convert('RGBA').thumbnail((150, 150))
                    img.save(buffered, format="PNG")
                    img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')
                    image_b64 = f"data:image/png;base64,{img_str}"
            except Exception:
                image_b64 = ""
                
        results.append({
            "id": f"glyph_{idx}",
            "filename": rel_filename,
            "image_b64": image_b64,
            "image_path": img_path,
            "guessed_char": guessed_char
        })
        
    return results
