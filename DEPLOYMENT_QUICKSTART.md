# 🚀 S2RTool Deployment - Quick Start Guide

**Tóm tắt:** Hướng dẫn nhanh để package và deploy S2RTool

---

## 📍 Tại Máy Gốc (Source Machine)

### Option 1: Deploy Qua Docker Registry (Khuyến Nghị) ⭐

**Bước 1: Login Docker Hub**
```bash
docker login
```

**Bước 2: Build & Push Images**
```bash
./build-and-push.sh -u YOUR_DOCKERHUB_USERNAME -v 1.0.0
```

**Bước 3: Tạo Deployment Package**
```bash
./package.sh -v 1.0.0
```

**Output:** `dist/s2rtool-deploy-1.0.0.tar.gz` (~5-10 MB)

---

### Option 2: Offline Package (Không Cần Registry)

**Bước 1: Tạo Full Package**
```bash
./package.sh -v 1.0.0 --include-source
```

**Output:** `dist/s2rtool-deploy-1.0.0.tar.gz` (~50-100 MB)

---

## 📍 Tại Máy Đích (Target Machine)

### Bước 1: Cài Docker (nếu chưa có)
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

### Bước 2: Chuyển Package
```bash
# Từ máy gốc
scp dist/s2rtool-deploy-1.0.0.tar.gz user@target:/tmp/

# Hoặc dùng USB, wget, etc.
```

### Bước 3: Deploy Tự Động
```bash
# Giải nén
tar -xzf s2rtool-deploy-1.0.0.tar.gz
cd s2rtool-deploy-1.0.0

# Chạy deployment (1 lệnh)
./deploy.sh
```

**Script sẽ tự động:**
- ✅ Kiểm tra Docker
- ✅ Tạo .env và hỏi API key
- ✅ Pull/build images
- ✅ Start services
- ✅ Verify deployment

### Bước 4: Truy Cập
```
Frontend: http://localhost:3001
Backend:  http://localhost:5001
```

---

## 🎯 Tóm Tắt Workflow

```
[MÁY GỐC]                          [MÁY ĐÍCH]
    │                                   │
    ├─ build-and-push.sh               │
    │  (build & push images)           │
    │                                   │
    ├─ package.sh                      │
    │  (tạo deployment package)        │
    │                                   │
    └─> dist/*.tar.gz ────────────────>├─ Giải nén package
                                        │
                                        ├─ ./deploy.sh
                                        │
                                        └─ ✅ DONE!
```

---

## 📚 Chi Tiết Đầy Đủ

Xem file **[README.DEPLOY.md](README.DEPLOY.md)** để biết:
- Troubleshooting
- Advanced configuration
- Update & maintenance
- FAQ

---

## 🆘 Lệnh Hữu Ích

```bash
# Xem logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop/Start
docker-compose down
docker-compose up -d

# Check status
docker-compose ps

# Update version mới
docker-compose pull && docker-compose up -d
```

---

## 🔑 Yêu Cầu

- **Máy Gốc:** Docker + Docker Hub account
- **Máy Đích:** Docker Engine 20.10+ + Docker Compose 2.0+
- **API Key:** Gemini API key (https://makersuite.google.com/app/apikey)

---

**✨ Chỉ cần 3 lệnh tại máy đích:**

```bash
tar -xzf s2rtool-deploy-1.0.0.tar.gz
cd s2rtool-deploy-1.0.0
./deploy.sh
```

**🎉 Xong!**
