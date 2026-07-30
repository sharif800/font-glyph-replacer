# Production Dockerfile for Handwritten Font Replacer
FROM python:3.10-slim-bullseye

# Prevent Python from writing .pyc files & enable unbuffered stdout
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive

# Set working directory inside container
WORKDIR /app

# Install system binaries: FontForge, Potrace, Tesseract OCR, Python-FontForge
RUN apt-get update && apt-get install -y --no-install-recommends \
    fontforge \
    python3-fontforge \
    potrace \
    tesseract-ocr \
    tesseract-ocr-eng \
    libsm6 \
    libxext6 \
    libgl1-mesa-glx \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Link system python3-fontforge module to venv if needed
# Copy python requirements file
COPY requirements.txt .

# Install python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY app/ /app/app/
COPY .env.example /app/.env

# Expose server port
EXPOSE 8000

# Run production ASGI server via Gunicorn with Uvicorn workers
CMD ["gunicorn", "-w", "2", "-k", "uvicorn.workers.UvicornWorker", "app.main:app", "-b", "0.0.0.0:8000"]
