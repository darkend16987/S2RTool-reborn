# 🚀 S2RTool - Hướng Dẫn Deployment

**Phiên bản:** 4.0
**Cập nhật:** 2025

---

## 📋 Mục Lục

1. [⚡ Quick Start](#-quick-start)
2. [Tổng Quan](#-tổng-quan)
3. [Chuẩn Bị Trên Máy Gốc](#-chuẩn-bị-trên-máy-gốc-source-machine)
4. [Triển Khai Trên Máy Đích](#-triển-khai-trên-máy-đích-target-machine)
5. [Quản Lý & Vận Hành](#-quản-lý--vận-hành)
6. [Troubleshooting](#-troubleshooting)
7. [FAQ](#-faq)

---

## ⚡ Quick Start

**Chỉ cần 3 lệnh để deploy trên máy đích!**

### 📍 Tại Máy Gốc (Source Machine)

**Option 1: Deploy Qua Docker Registry** ⭐ (Khuyến nghị)

```bash
# 1. Login Docker Hub
docker login

# 2. Build & Push Images
./build-and-push.sh -u YOUR_DOCKERHUB_USERNAME -v 1.0.0

# 3. Tạo Deployment Package
./package.sh -v 1.0.0
```
**Output:** `dist/s2rtool-deploy-1.0.0.tar.gz` (~5-10 MB)

**Option 2: Offline Package** (Không cần Registry)

```bash
# Tạo full package với source code
./package.sh -v 1.0.0 --include-source
```
**Output:** `dist/s2rtool-deploy-1.0.0.tar.gz` (~50-100 MB)

### 📍 Tại Máy Đích (Target Machine)

```bash
# 1. Cài Docker (nếu chưa có)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# 2. Transfer và giải nén package
tar -xzf s2rtool-deploy-1.0.0.tar.gz
cd s2rtool-deploy-1.0.0

# 3. Deploy tự động
./deploy.sh
```

**Truy cập:**
- Frontend: http://localhost:3001
- Backend: http://localhost:5001

---

## 🎯 Tổng Quan

Có **2 phương pháp deployment** chính:

### Phương Pháp 1: Docker Registry (Khuyến Nghị)
- ✅ **Ưu điểm:** Nhanh, đơn giản, dễ update
- ✅ **Phù hợp:** Khi có kết nối internet trên máy đích
- 📦 **Package size:** ~5-10 MB (chỉ configs & scripts)

### Phương Pháp 2: Offline Package (Full Source)
- ✅ **Ưu điểm:** Không cần internet, có source code
- ✅ **Phù hợp:** Môi trường offline hoặc cần customize
- 📦 **Package size:** ~50-100 MB (full source code)

### Phương Pháp 3: Cloud OTA Update ⭐ (Mới - Khuyến nghị cao nhất)
- ✅ **Ưu điểm:** Tự động cập nhật, không cần thao tác thủ công
- ✅ **Phù hợp:** Khi có internet, muốn zero-touch deployment
- 🔄 **Cơ chế:** GitHub Actions tự build → Docker Hub → Watchtower auto-pull

---

## 🔄 Phương Pháp 3: Cloud OTA Update (Tự Động Cập Nhật)

### Tổng Quan Luồng OTA

```
Dev push code → GitHub Actions auto-build → Docker Hub → Watchtower auto-pull → App updated!
```

1. **Dev** push code lên nhánh `main` trên GitHub
2. **GitHub Actions** tự động kích hoạt, build Docker images
3. **Docker Hub** nhận images mới (`darkend16987/s2rtool-backend:latest`, `darkend16987/s2rtool-frontend:latest`)
4. **Watchtower** trên mỗi máy client kiểm tra mỗi 5 phút, tự pull image mới và restart containers

### Bước 1: Setup GitHub Secrets (Chỉ cần 1 lần)

Vào GitHub Repository → **Settings** → **Secrets and Variables** → **Actions** → **New repository secret**:

| Secret Name | Value | Lấy ở đâu |
|---|---|---|
| `DOCKERHUB_USERNAME` | `darkend16987` | Docker Hub username |
| `DOCKERHUB_TOKEN` | `dckr_pat_xxxxxx` | [Docker Hub → Settings → Security → New Access Token](https://hub.docker.com/settings/security) |

### Bước 2: Push Code (Trigger CI/CD)

```bash
# Push code mới lên main
git add .
git commit -m "feat: new feature"
git push origin main

# Hoặc tạo version tag
git tag v4.1.0
git push origin v4.1.0
```

GitHub Actions sẽ tự động:
- ✅ Build Docker images
- ✅ Push lên Docker Hub với tags: `latest`, `sha-abc1234`
- ✅ Nếu push tag `v4.1.0` → thêm tag `4.1.0` và `4.1`

Kiểm tra tại: `https://github.com/darkend16987/S2RTool-reborn/actions`

### Bước 3: Deploy Máy Client (Chỉ cần 1 lần)

**Cách nhanh nhất:**

```bash
# 1. Cài Docker (nếu chưa có)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER && newgrp docker

# 2. Tạo folder cho app
mkdir ~/s2rtool && cd ~/s2rtool

# 3. Tải file docker-compose.client.yaml và .env.template
# (copy từ repo hoặc download)

# 4. Tạo .env
cp .env.template .env
nano .env  # Thêm GEMINI_API_KEY

# 5. Chạy!
docker-compose -f docker-compose.client.yaml up -d
```

**Trên Windows:**
- Copy `docker-compose.client.yaml` (hoặc `docker-compose.production.yaml`) và `.env` vào folder
- Double-click `start.bat`

Sau khi deploy, **Watchtower sẽ tự động cập nhật app** mỗi khi dev push code mới!

### Quản Lý OTA

```bash
# Xem trạng thái auto-update
docker logs s2rtool-watchtower

# Cập nhật thủ công ngay (không đợi Watchtower)
docker-compose -f docker-compose.client.yaml pull
docker-compose -f docker-compose.client.yaml up -d

# Thay đổi tần suất kiểm tra (trong .env)
WATCHTOWER_INTERVAL=60  # Kiểm tra mỗi 1 phút

# Tắt auto-update (bỏ Watchtower)
docker stop s2rtool-watchtower
docker rm s2rtool-watchtower
```

---

## 🔧 Chuẩn Bị Trên Máy Gốc (Source Machine)

### Bước 1: Kiểm Tra Môi Trường

```bash
# Kiểm tra Docker
docker --version
# Cần: Docker Engine 20.10+

# Kiểm tra Docker Compose
docker-compose --version
# Hoặc: docker compose version
# Cần: Docker Compose 2.0+

# Kiểm tra Git (optional)
git --version
```

### Bước 2A: Build và Push Images (Phương Pháp 1)

**2A.1. Đăng nhập Docker Registry**

```bash
# Docker Hub (miễn phí)
docker login

# Hoặc GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Hoặc registry riêng
docker login your-registry.com
```

**2A.2. Build và Push Images**

```bash
# Cách 1: Sử dụng script tự động (Khuyến nghị)
chmod +x build-and-push.sh
./build-and-push.sh -u YOUR_DOCKERHUB_USERNAME -v 1.0.0

# Cách 2: Thủ công
docker build -t yourusername/s2rtool-backend:1.0.0 ./backend
docker build -t yourusername/s2rtool-frontend:1.0.0 ./frontend

docker push yourusername/s2rtool-backend:1.0.0
docker push yourusername/s2rtool-frontend:1.0.0
```

**2A.3. Tạo Deployment Package**

```bash
# Tạo minimal package (không có source code)
chmod +x package.sh
./package.sh -v 1.0.0

# Output: dist/s2rtool-deploy-1.0.0.tar.gz (~5-10 MB)
```

### Bước 2B: Tạo Offline Package (Phương Pháp 2)

```bash
# Tạo full package với source code
chmod +x package.sh
./package.sh -v 1.0.0 --include-source

# Output: dist/s2rtool-deploy-1.0.0.tar.gz (~50-100 MB)
```

### Bước 3: Verify Package

```bash
# Kiểm tra package đã tạo
ls -lh dist/

# Kiểm tra checksum
cat dist/s2rtool-deploy-1.0.0.tar.gz.sha256

# Test extract
tar -tzf dist/s2rtool-deploy-1.0.0.tar.gz | head -20
```

---

## 📦 Triển Khai Trên Máy Đích (Target Machine)

### Bước 1: Chuẩn Bị Máy Đích

**1.1. Cài đặt Docker (nếu chưa có)**

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version
docker compose version
```

**1.2. Chuyển Package Sang Máy Đích**

```bash
# Cách 1: SCP (qua SSH)
scp dist/s2rtool-deploy-1.0.0.tar.gz user@target-machine:/tmp/

# Cách 2: USB/Shared folder
# Copy file vào USB, sau đó mount trên máy đích

# Cách 3: Download từ server
wget https://your-server.com/s2rtool-deploy-1.0.0.tar.gz
# Hoặc
curl -LO https://your-server.com/s2rtool-deploy-1.0.0.tar.gz
```

### Bước 2: Giải Nén Package

```bash
# Giải nén
tar -xzf s2rtool-deploy-1.0.0.tar.gz
cd s2rtool-deploy-1.0.0

# Kiểm tra nội dung
ls -la
# Sẽ thấy:
# - deploy.sh
# - docker-compose.yaml
# - .env.template
# - README.DEPLOY.md
# - backend/ (nếu full package)
# - frontend/ (nếu full package)
```

### Bước 3: Chạy Deployment Script

**Phương Pháp Tự Động (Khuyến Nghị):**

```bash
# Cấp quyền thực thi
chmod +x deploy.sh

# Chạy deployment script
./deploy.sh

# Script sẽ tự động:
# ✓ Kiểm tra prerequisites (Docker, Docker Compose)
# ✓ Tạo .env file từ template
# ✓ Hỏi Gemini API key
# ✓ Cấu hình ports (nếu cần)
# ✓ Pull/build Docker images
# ✓ Start services
# ✓ Verify deployment
```

**Phương Pháp Thủ Công:**

```bash
# 1. Tạo .env file
cp .env.template .env

# 2. Chỉnh sửa .env
nano .env
# Thêm:
# GEMINI_API_KEY=your_api_key_here
# FRONTEND_PORT=3001
# BACKEND_PORT=5001

# 3. Deploy
docker-compose up -d

# 4. Kiểm tra
docker-compose ps
docker-compose logs -f
```

### Bước 4: Verify Deployment

```bash
# Kiểm tra containers đang chạy
docker-compose ps

# Kiểm tra health
curl http://localhost:5001/health
curl http://localhost:3001

# Xem logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Kiểm tra trong browser
# Truy cập: http://localhost:3001
# hoặc: http://your-server-ip:3001
```

---

## ⚙️ Quản Lý & Vận Hành

### Lệnh Thường Dùng

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs (real-time)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f backend

# Check status
docker-compose ps

# Check resource usage
docker stats

# Update to new version
docker-compose pull
docker-compose up -d
```

### Cấu Hình .env

```bash
# Chỉnh sửa .env
nano .env

# Sau khi thay đổi, restart services
docker-compose restart
```

**Các biến quan trọng:**

```bash
# REQUIRED
GEMINI_API_KEY=your_key_here

# OPTIONAL
FRONTEND_PORT=3001
BACKEND_PORT=5001
LOG_LEVEL=INFO
DEBUG=False

# For Docker Registry deployment
DOCKER_REGISTRY=docker.io
DOCKER_USERNAME=yourusername
VERSION=latest
```

### Backup & Restore

**Backup:**

```bash
# Backup reference images (user uploads)
docker run --rm \
  -v s2rtool-deploy-100_backend-references:/data \
  -v $(pwd)/backup:/backup \
  alpine tar -czf /backup/references-backup-$(date +%Y%m%d).tar.gz -C /data .

# Backup .env
cp .env .env.backup
```

**Restore:**

```bash
# Restore reference images
docker run --rm \
  -v s2rtool-deploy-100_backend-references:/data \
  -v $(pwd)/backup:/backup \
  alpine tar -xzf /backup/references-backup-20250127.tar.gz -C /data

# Restore .env
cp .env.backup .env
docker-compose restart
```

### Update Lên Version Mới

**Cách 1: Pull từ Registry (nếu dùng Phương Pháp 1)**

```bash
# Update .env với version mới
nano .env
# Sửa: VERSION=1.1.0

# Pull và restart
docker-compose pull
docker-compose up -d

# Verify
docker-compose ps
```

**Cách 2: Deploy Package Mới (nếu dùng Phương Pháp 2)**

```bash
# 1. Stop services cũ
docker-compose down

# 2. Backup .env và data
cp .env ../s2rtool.env.backup

# 3. Extract package mới
cd ..
tar -xzf s2rtool-deploy-1.1.0.tar.gz
cd s2rtool-deploy-1.1.0

# 4. Restore .env
cp ../s2rtool.env.backup .env

# 5. Deploy
./deploy.sh
```

---

## 🔧 Troubleshooting

### Lỗi: Port Already in Use

```bash
# Tìm process đang dùng port
sudo lsof -i :5001
sudo lsof -i :3001

# Giải pháp 1: Kill process
sudo kill -9 <PID>

# Giải pháp 2: Đổi port
nano .env
# Sửa: BACKEND_PORT=5002, FRONTEND_PORT=3002
docker-compose restart
```

### Lỗi: Permission Denied

```bash
# Thêm user vào docker group
sudo usermod -aG docker $USER
newgrp docker

# Hoặc chạy với sudo (không khuyến khích)
sudo docker-compose up -d
```

### Lỗi: Cannot Connect to Backend

```bash
# Kiểm tra backend logs
docker-compose logs backend

# Kiểm tra GEMINI_API_KEY
grep GEMINI_API_KEY .env

# Kiểm tra health endpoint
curl http://localhost:5001/health

# Restart backend
docker-compose restart backend
```

### Lỗi: Image Pull Failed

```bash
# Kiểm tra kết nối internet
ping google.com

# Kiểm tra registry credentials
docker login

# Build local nếu không pull được
docker-compose build
docker-compose up -d
```

### Lỗi: Out of Memory

```bash
# Kiểm tra memory usage
docker stats

# Giảm resource limits trong docker-compose.yaml
nano docker-compose.yaml
# Sửa: memory: 1G (thay vì 2G)

# Restart
docker-compose down
docker-compose up -d
```

### Container Keeps Restarting

```bash
# Xem logs để tìm nguyên nhân
docker-compose logs backend

# Thường gặp:
# 1. Missing GEMINI_API_KEY -> Thêm vào .env
# 2. Port conflict -> Đổi port
# 3. Dependency missing -> Rebuild: docker-compose build
```

---

## 📚 FAQ

### 1. Tôi cần Gemini API key ở đâu?

Truy cập: https://makersuite.google.com/app/apikey

**Lưu ý:** API key có giới hạn quota và billing.

### 2. Tôi có thể thay đổi port không?

Có, chỉnh sửa file `.env`:

```bash
FRONTEND_PORT=8080
BACKEND_PORT=8081
```

Sau đó restart: `docker-compose restart`

### 3. Làm sao để truy cập từ máy khác trong mạng?

```bash
# Mở firewall cho ports
sudo ufw allow 3001
sudo ufw allow 5001

# Truy cập từ máy khác
http://<server-ip>:3001
```

### 4. Tôi có thể chạy nhiều instance không?

Có, tạo folder riêng cho mỗi instance và đổi ports:

```bash
# Instance 1
cd ~/s2rtool-1
# .env: FRONTEND_PORT=3001, BACKEND_PORT=5001

# Instance 2
cd ~/s2rtool-2
# .env: FRONTEND_PORT=3002, BACKEND_PORT=5002
```

### 5. Làm sao để enable HTTPS?

Cần thêm reverse proxy (Nginx/Traefik) với SSL certificate:

```bash
# Ví dụ với Nginx + Let's Encrypt
sudo apt install nginx certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

Cấu hình Nginx proxy tới `localhost:3001`

### 6. Performance optimization?

**Tăng resource limits:**

```yaml
# docker-compose.yaml
deploy:
  resources:
    limits:
      cpus: '4.0'
      memory: 4G
```

**Enable caching (nếu có Redis):**
- Thêm Redis service
- Cache Gemini API responses

### 7. Làm sao để monitor logs?

```bash
# Real-time logs
docker-compose logs -f

# Export logs to file
docker-compose logs > logs-$(date +%Y%m%d).txt

# Log rotation (production)
# Thêm vào docker-compose.yaml:
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### 8. Security best practices?

```bash
# 1. Không commit .env vào git
echo ".env" >> .gitignore

# 2. Sử dụng Docker secrets (production)
# 3. Chạy containers với non-root user
# 4. Enable firewall
sudo ufw enable
sudo ufw allow 22  # SSH
sudo ufw allow 3001  # Frontend

# 5. Regular updates
docker-compose pull
docker-compose up -d
```

---

## 📞 Hỗ Trợ

**Documentation:**
- Main README: `README.md`
- Technical docs: `HOW-IT-WORKS.md`
- Docker guide: `DOCKER_README.md`

**Issues & Support:**
- GitHub Issues: `https://github.com/yourusername/S2RTool/issues`
- Email: `support@s2rtool.com`

**Community:**
- Discord: Coming soon
- Forum: Coming soon

---

## 📝 Changelog

### Version 4.0 (Current)
- ✨ Production deployment package
- ✨ Auto-deployment script
- ✨ Docker registry support
- ✨ Offline deployment support
- 🐛 Bug fixes and improvements

---

**🎉 Chúc bạn deployment thành công!**

Nếu gặp vấn đề, hãy kiểm tra [Troubleshooting](#-troubleshooting) hoặc mở issue trên GitHub.
