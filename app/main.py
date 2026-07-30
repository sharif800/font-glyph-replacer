import os
import shutil
import uuid
import logging
import traceback
from typing import List
from fastapi import FastAPI, Request, Form, UploadFile, File, HTTPException, Depends, status
from fastapi.responses import HTMLResponse, RedirectResponse, FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel

from app.config import UPLOAD_DIR, ADMIN_USERNAME, ADMIN_PASSWORD
from app.auth import authenticate_user, create_access_token, is_authenticated, COOKIE_NAME
from app.ocr_engine import extract_and_ocr_zip
from app.font_engine import process_and_build_font

# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("font_replacer")

app = FastAPI(
    title="Handwritten Font Replacer",
    description="Automated font glyph replacer using Tesseract OCR, Potrace, and FontForge.",
    version="1.0.0"
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    err_msg = f"Unhandled Exception: {exc}\n{traceback.format_exc()}"
    logger.error(err_msg)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"}
    )


# Static files and Templates setup
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "static")), name="static")
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))

# --- Pydantic Data Models ---
class GlyphMappingItem(BaseModel):
    image_path: str
    char: str

class GenerateFontRequest(BaseModel):
    upload_id: str
    mappings: List[GlyphMappingItem]

# --- Route Handlers ---

@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    if is_authenticated(request):
        return RedirectResponse(url="/", status_code=status.HTTP_303_SEE_OTHER)
    return templates.TemplateResponse("login.html", {"request": request, "error": None})

@app.post("/login", response_class=HTMLResponse)
async def login_submit(request: Request, username: str = Form(...), password: str = Form(...)):
    if authenticate_user(username, password):
        token = create_access_token({"sub": username})
        response = RedirectResponse(url="/", status_code=status.HTTP_303_SEE_OTHER)
        response.set_cookie(
            key=COOKIE_NAME,
            value=token,
            httponly=True,
            samesite="lax"
        )
        return response
    else:
        return templates.TemplateResponse("login.html", {
            "request": request,
            "error": "Invalid username or password credentials."
        })

@app.get("/logout")
async def logout():
    response = RedirectResponse(url="/login", status_code=status.HTTP_303_SEE_OTHER)
    response.delete_cookie(COOKIE_NAME)
    return response

@app.get("/", response_class=HTMLResponse)
async def dashboard_page(request: Request):
    if not is_authenticated(request):
        return RedirectResponse(url="/login", status_code=status.HTTP_303_SEE_OTHER)
    return templates.TemplateResponse("dashboard.html", {
        "request": request,
        "user": ADMIN_USERNAME
    })

@app.post("/api/upload")
async def handle_upload(
    request: Request,
    font_file: UploadFile = File(...),
    zip_file: UploadFile = File(...)
):
    if not is_authenticated(request):
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Validate file extensions
    font_ext = os.path.splitext(font_file.filename)[1].lower()
    zip_ext = os.path.splitext(zip_file.filename)[1].lower()

    if font_ext not in ['.ttf', '.otf']:
        raise HTTPException(status_code=400, detail="Base font file must be .ttf or .otf format")
    if zip_ext != '.zip':
        raise HTTPException(status_code=400, detail="Glyph images file must be a .zip archive")

    # Create unique upload session directory
    upload_id = str(uuid.uuid4())
    session_dir = os.path.join(UPLOAD_DIR, upload_id)
    os.makedirs(session_dir, exist_ok=True)

    # Save uploaded files
    saved_font_path = os.path.join(session_dir, f"base_font{font_ext}")
    saved_zip_path = os.path.join(session_dir, "glyphs.zip")

    with open(saved_font_path, "wb") as f:
        shutil.copyfileobj(font_file.file, f)
    with open(saved_zip_path, "wb") as f:
        shutil.copyfileobj(zip_file.file, f)

    # Extract and run OCR
    extracted_imgs_dir = os.path.join(session_dir, "extracted_images")
    glyphs = extract_and_ocr_zip(saved_zip_path, extracted_imgs_dir)

    return {
        "upload_id": upload_id,
        "font_filename": font_file.filename,
        "glyphs": glyphs
    }

@app.post("/api/generate-font")
async def handle_generate_font(request: Request, body: GenerateFontRequest):
    if not is_authenticated(request):
        raise HTTPException(status_code=401, detail="Unauthorized")

    session_dir = os.path.join(UPLOAD_DIR, body.upload_id)
    if not os.path.exists(session_dir):
        raise HTTPException(status_code=404, detail="Upload session expired or not found")

    # Locate base font file
    base_font_path = None
    for f in os.listdir(session_dir):
        if f.startswith("base_font"):
            base_font_path = os.path.join(session_dir, f)
            break

    if not base_font_path or not os.path.exists(base_font_path):
        raise HTTPException(status_code=400, detail="Base font file missing from session")

    # Convert pydantic mappings to list of dicts
    mappings = [{"image_path": m.image_path, "char": m.char} for m in body.mappings]

    output_dir = os.path.join(session_dir, "output")
    try:
        compiled_font_path = process_and_build_font(base_font_path, mappings, output_dir)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Font processing error: {str(e)}")

    if not os.path.exists(compiled_font_path):
        raise HTTPException(status_code=500, detail="Failed to compile output TTF font file")

    return {
        "status": "success",
        "download_url": f"/api/download-font/{body.upload_id}"
    }

@app.get("/api/download-font/{upload_id}")
async def download_font(upload_id: str, request: Request):
    if not is_authenticated(request):
        raise HTTPException(status_code=401, detail="Unauthorized")

    session_dir = os.path.join(UPLOAD_DIR, upload_id)
    font_path = os.path.join(session_dir, "output", "custom_handwritten_font.ttf")

    if not os.path.exists(font_path):
        raise HTTPException(status_code=404, detail="Requested font file not found")

    return FileResponse(
        path=font_path,
        filename="custom_handwritten_font.ttf",
        media_type="font/ttf"
    )
