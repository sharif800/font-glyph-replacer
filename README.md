# Handwritten Font Replacer Web Application

An automated, containerized web application that replaces English Unicode characters (A-Z, a-z) in an existing `.ttf`/`.otf` font file with scanned handwritten glyph images using Tesseract OCR, Potrace vectorization, and FontForge typography standards.

---

## 🌟 Key Features

1. **Authentication System**: Secure JWT cookie-based session protection (`admin` / `password123` defaults configurable via `.env`).
2. **Dual Asset Upload**: Simple interface for base font (`.ttf`/`.otf`) and scanned handwritten glyphs (`.zip`).
3. **Automated OCR Engine**: Tesseract OCR configured with single-character recognition (`--psm 10`) to auto-detect and map scanned images to Unicode slots.
4. **Human-in-the-Loop Review Grid**: Interactive UI allowing users to visually inspect scanned letters, edit misidentified characters, and catch duplicate letter assignments before font compilation.
5. **Typography & FontForge Vectorization**:
   - Converts raster images into vector SVGs using `potrace`.
   - Clears target Unicode glyph slots in the base font.
   - Imports vector outlines into `fontforge`.
   - Auto-aligns glyphs to the baseline and sets standard left and right side bearings (50 units).
6. **Live Interactive Font Preview**: Test your custom font directly in the browser before downloading.
7. **Production Containerization**: Fully dockerized stack running Gunicorn with Uvicorn ASGI workers.

---

## 📁 Repository Folder Structure

```
font-glyph-replacer/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI Web Server & API Routes
│   ├── auth.py              # JWT Cookie Authentication
│   ├── config.py            # Environment Configuration
│   ├── ocr_engine.py        # Zip extraction & Tesseract OCR
│   ├── font_engine.py       # Potrace & FontForge processing
│   ├── static/
│   │   ├── style.css        # Glassmorphic Dark-Mode CSS
│   │   └── app.js           # Interactive UI & Font Preview JS
│   └── templates/
│       ├── login.html       # Login Screen Template
│       └── dashboard.html   # Main Dashboard & Review Grid
├── Dockerfile               # Production Docker Container Specification
├── docker-compose.yml       # One-command orchestration
├── requirements.txt         # Python Dependencies
├── .env.example             # Environment template
├── .env                     # Local environment file
├── .gitignore               # Git Ignore Specification
└── README.md                # Documentation & Deployment Guide
```

---

## 🚀 Quickstart: Run Locally on Localhost

### Option A: Using Docker Compose (Recommended)

Ensure Docker and Docker Compose are installed on your machine.

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd font-glyph-replacer
   ```

2. **Copy the environment configuration**:
   ```bash
   cp .env.example .env
   ```

3. **Start the application**:
   ```bash
   docker-compose up -d --build
   ```

4. **Access the Web Application**:
   Open your browser and navigate to:
   **[http://localhost:8000](http://localhost:8000)**

   **Default Login Credentials**:
   - **Username**: `admin`
   - **Password**: `password123`

---

### Option B: Local Python Development Setup (Without Docker)

*Note: Requires system installation of FontForge, Potrace, and Tesseract OCR binaries on your OS.*

1. **Install System Dependencies**:
   - **Ubuntu/Debian**:
     ```bash
     sudo apt-get update && sudo apt-get install -y fontforge python3-fontforge potrace tesseract-ocr
     ```
   - **macOS**:
     ```bash
     brew install fontforge potrace tesseract
     ```

2. **Create Python Virtual Environment & Install Dependencies**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Run Development Server**:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

---

## ☁️ Deployment Guide: DigitalOcean Droplet via Git & Docker

Follow these step-by-step instructions to deploy this application to a DigitalOcean Droplet.

### Step 1: Create a DigitalOcean Droplet

1. Log into your [DigitalOcean Console](https://cloud.digitalocean.com).
2. Click **Create** -> **Droplets**.
3. Choose **Ubuntu 22.04 LTS (x64)**.
4. Select a plan (Basic Plan: 1 GB RAM / 1 CPU $6/mo is sufficient).
5. Choose your datacenter region.
6. Add your **SSH Key** for authentication.
7. Click **Create Droplet** and note down the Droplet's **Public IP Address** (e.g. `198.51.100.45`).

---

### Step 2: Configure Droplet Server & Install Docker

SSH into your newly created droplet:
```bash
ssh root@YOUR_DROPLET_IP
```

Install Docker and Docker Compose on Ubuntu:
```bash
# Update package index and install prerequisites
sudo apt update && sudo apt install -y git curl ca-certificates gnupg lsb-release

# Add Docker’s official GPG key & repository
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine & Docker Compose Plugin
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

---

### Step 3: Clone Repository & Deploy Stack

1. Clone your project from Git:
   ```bash
   cd /opt
   git clone <your-git-repo-url> font-glyph-replacer
   cd font-glyph-replacer
   ```

2. Create production `.env` file:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` to set a custom secret key and secure password:*
   ```bash
   nano .env
   # Update SECRET_KEY, ADMIN_USERNAME, and ADMIN_PASSWORD
   ```

3. Build and launch containers in detached mode:
   ```bash
   docker compose up -d --build
   ```

4. Verify running container health:
   ```bash
   docker compose ps
   docker compose logs -f
   ```

5. Access your application via browser:
   `http://YOUR_DROPLET_IP:8000`

---

## 🔒 Security Best Practices for Production

- **Reverse Proxy (Nginx + SSL)**: For production HTTPS encryption, configure Nginx with Certbot (Let's Encrypt) in front of port 8000.
- **Firewall Setup (UFW)**:
  ```bash
  sudo ufw allow 22/tcp
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  sudo ufw allow 8000/tcp
  sudo ufw enable
  ```

---

## 🧪 License & Support

Built with FastAPI, FontForge Python API, Potrace, and Tesseract OCR.
