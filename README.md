# Handwritten & Latin Font Synthesis Studio

An automated, containerized web application that provides two font customization workflows:

1. **Option 1: Handwritten Scanned Images Replacer**
   - Replaces English Unicode characters (A-Z, a-z) in an existing `.ttf`/`.otf` font file with scanned handwritten glyph images using Tesseract OCR, Potrace vectorization, and FontForge.
   - Includes full Human-in-the-Loop review grid with image thumbnails, OCR character editing, and duplicate letter validation.

2. **Option 2: Font-to-Font Latin Replacer**
   - Upload two fonts (**Primary Base Font A** + **Source Latin Font B**).
   - Automatically matches, extracts, and transfers all Latin glyphs (A-Z, a-z, 0-9, punctuation U+0020 through U+007E) from Font B into Font A.

3. **Custom Font Naming & SFNT Metadata Engine**:
   - Customize **Font Family Name**, **Subfamily / Style**, and **Full Font Name** for the output `.ttf` in both workflows for seamless installation on Windows, macOS, and Linux.

---

## 🚀 Quickstart: Run Locally with Docker

```bash
git clone <repository-url>
cd font-glyph-replacer
cp .env.example .env
docker-compose up -d --build
```

Access the application at **[http://localhost:8000](http://localhost:8000)**  
Default Credentials: `Username: admin`, `Password: password123`

---

## ☁️ Deploying to DigitalOcean

SSH into your DigitalOcean Droplet and run:

```bash
cd /opt/font-glyph-replacer
git pull origin main
docker compose down
docker compose up -d --build
```
