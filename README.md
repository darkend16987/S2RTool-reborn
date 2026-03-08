# S2RTool - Sketch to Render

![Version](https://img.shields.io/badge/version-5.0.0-blue)
![AI](https://img.shields.io/badge/AI-Gemini%202.5%20%7C%203.0-purple)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)

**AI-Powered Architectural Visualization** — Chuyển đổi sketch kiến trúc thành render photorealistic với Google Gemini AI.

---

## Features

**6 Render Modes:**

| Mode | Description |
|------|-------------|
| **Building Render** | Render công trình đơn lẻ, đa góc nhìn, inpainting, reference images |
| **Interior Render** | Render nội thất chính xác vị trí furniture, chất liệu, ánh sáng |
| **Planning Render** | Render quy hoạch tổng thể, nhiều lô đất, góc nhìn aerial |
| **Planning Detail** | Render quy hoạch chi tiết từ sketch có sẵn công trình |
| **Object Swap** | Thay thế đồ vật trong ảnh — vẽ mask, upload reference, AI ghép |
| **Floor Plan Render** | Đổ màu & vật liệu lên mặt bằng 2D, giữ nguyên top-down view |

**Core Capabilities:**
- AI phân tích sketch tự động (Vietnamese-first)
- Bảo toàn structure 90-95%+ từ sketch gốc
- Anti-hallucination prompting
- Reference image system
- Inpainting support
- Render history & gallery
- OTA auto-update via Watchtower

---

## Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (v20.10+)
- [Gemini API Key](https://aistudio.google.com/app/apikey) (free tier)

### Installation

```bash
# Clone
git clone https://github.com/darkend16987/S2RTool-reborn.git
cd S2RTool-reborn

# Configure
cp .env.production.template .env
# Edit .env → set GEMINI_API_KEY=your_key_here

# Start (production — uses pre-built images + auto-update)
docker-compose -f docker-compose.production.yaml up -d

# Or use deploy script (interactive wizard)
chmod +x deploy.sh && ./deploy.sh
```

**Access:** [http://localhost:3001](http://localhost:3001)

### Windows Users

```
1. Install Docker Desktop
2. Double-click: install-windows.bat
3. Daily use: start.bat / stop.bat
```

See [WINDOWS-SETUP.md](WINDOWS-SETUP.md) for detailed guide.

### Verify

```bash
docker-compose -f docker-compose.production.yaml ps
curl http://localhost:5001/health
```

---

## Update

### Automatic (Watchtower)

If using `docker-compose.production.yaml`, Watchtower auto-updates every 5 minutes — no action needed.

### Manual

```bash
docker-compose -f docker-compose.production.yaml pull
docker-compose -f docker-compose.production.yaml up -d
```

### Windows

Double-click `update.bat`.

---

## Architecture

```
S2RTool/
├── frontend/                  # HTML/CSS/JS (Nginx)
│   ├── index.html            # Landing page with mode cards
│   ├── building-render.html  # Building render UI
│   ├── interior-render.html  # Interior render UI
│   ├── planning-render.html  # Planning render UI
│   ├── object-swap.html      # Object swap UI
│   ├── floorplan-render.html # Floor plan render UI
│   ├── settings.html         # Settings & API config
│   ├── version-check.js      # Update checker (GitHub Releases API)
│   └── style.css             # Design system
│
├── backend/                   # Python Flask API
│   ├── api/                  # REST endpoints
│   ├── core/                 # Business logic (Gemini, prompts, images)
│   ├── config.py             # Model & app configuration
│   └── app.py                # Entry point
│
├── landing-page/              # Firebase-hosted download page (auth-gated)
│
├── docker-compose.yaml              # Development (build from source)
├── docker-compose.production.yaml   # Production (Docker Hub images + Watchtower)
├── deploy.sh                        # Deployment wizard
└── .github/workflows/ci-cd.yml     # GitHub Actions CI/CD
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JS, Material Symbols |
| Backend | Python 3.11, Flask, Pillow, OpenCV |
| AI | Google Gemini 2.5 Pro/Flash, Gemini 3.0 Pro Image |
| Infra | Docker, Docker Compose, Nginx, Watchtower |
| CI/CD | GitHub Actions → Docker Hub → Watchtower OTA |

### CI/CD Flow

```
Push to main → GitHub Actions → Build Docker images → Push to Docker Hub
                                                           ↓
                              Client Watchtower polls every 5 min
                                                           ↓
                              Auto pull → restart containers → done
```

---

## Configuration

### Environment Variables

```bash
# Required
GEMINI_API_KEY=your_gemini_api_key_here

# Optional
BACKEND_PORT=5001
FRONTEND_PORT=3001
DOCKER_REGISTRY=docker.io
DOCKER_USERNAME=kael16987
VERSION=latest
WATCHTOWER_INTERVAL=300    # seconds between update checks
```

---

## Development

```bash
# Build from source (hot-reload enabled)
docker-compose up -d --build

# View logs
docker-compose logs -f backend

# Rebuild after changes
docker-compose up -d --build

# Shell access
docker-compose exec backend bash
```

See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed development guide.

---

## Documentation

| Document | Description |
|----------|-------------|
| [WINDOWS-SETUP.md](WINDOWS-SETUP.md) | Windows installation & daily usage |
| [DOCKER-INSTALLATION-GUIDE.md](DOCKER-INSTALLATION-GUIDE.md) | Docker Desktop setup |
| [DEVELOPMENT.md](DEVELOPMENT.md) | Development workflow & debugging |
| [HOW-IT-WORKS.md](HOW-IT-WORKS.md) | Technical architecture deep dive |

---

## Troubleshooting

**Backend won't start:** Check `GEMINI_API_KEY` in `.env`, run `docker-compose logs backend`.

**Port in use:** Change `FRONTEND_PORT` or `BACKEND_PORT` in `.env`.

**Can't connect to API:** Ensure backend is healthy: `curl http://localhost:5001/health`.

**Render timeout:** Gemini API can be slow during peak hours. App has 300s timeout per request.

---

## Security

- Never commit `.env` to git
- API keys are only stored in `.env` (already in `.gitignore`)
- Landing page access controlled via Firebase Auth + Gmail whitelist

---

Version 5.0.0 | Powered by Google Gemini AI
