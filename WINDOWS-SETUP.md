# S2RTool - Windows Setup Guide

Complete guide for installing and running S2RTool on Windows 10/11.

---

## 📋 Prerequisites

Before running S2RTool, you need to install:

### 1. **Docker Desktop** (REQUIRED)

Docker Desktop is **required** and must be installed **manually** before using the automated scripts.

#### Installation Steps:

1. **Download Docker Desktop**
   - Visit: https://www.docker.com/products/docker-desktop/
   - Click "Download for Windows"

2. **Run the installer**
   - Double-click the downloaded `Docker Desktop Installer.exe`
   - Follow the installation wizard
   - **Enable WSL 2** when prompted (recommended)
   - Accept the license agreement

3. **Restart your computer**
   - Docker Desktop requires a restart to complete installation

4. **Launch Docker Desktop**
   - Open Docker Desktop from Start Menu
   - On first launch:
     - You may see a "WSL 2 installation is incomplete" warning
     - If so, follow the link to install WSL 2 kernel update
   - You can **skip Docker Hub login** by clicking "Continue without signing in"

5. **Verify Docker is running**
   - Look for the Docker whale icon in system tray
   - Icon should be steady (not animating) when ready
   - Open PowerShell or CMD and run:
     ```
     docker --version
     docker info
     ```

#### Troubleshooting Docker Installation:

**Problem: "WSL 2 installation is incomplete"**
- Solution: Download and install WSL 2 kernel update from:
  https://aka.ms/wsl2kernel
- After installing, restart Docker Desktop

**Problem: "Hardware assisted virtualization and data execution protection must be enabled in the BIOS"**
- Solution: Enable virtualization in your BIOS settings
  - Restart computer
  - Enter BIOS (usually F2, F10, or Del key during boot)
  - Find "Virtualization Technology" or "Intel VT-x" or "AMD-V"
  - Enable it
  - Save and exit BIOS

**Problem: Docker Desktop starts but containers won't run**
- Solution: Make sure WSL 2 is set as default:
  ```
  wsl --set-default-version 2
  wsl --update
  ```

---

## 🚀 Quick Start

Once Docker Desktop is installed and running:

### Method 1: Automated Installation (Recommended)

1. **Double-click `install-windows.bat`**
   - This will:
     - ✅ Check Docker installation
     - ✅ Check and update WSL
     - ✅ Create `.env` file from template
     - ✅ Prompt you to add your Gemini API key
     - ✅ Build and start containers
     - ✅ Open browser to localhost:3001

2. **Configure your API key**
   - When prompted, edit the `.env` file
   - Get your Gemini API key from: https://makersuite.google.com/app/apikey
   - Replace `your_gemini_api_key_here` with your actual key
   - Save and close the file

3. **Wait for installation to complete**
   - First run may take 5-10 minutes (downloading images, building)
   - Browser will open automatically when ready

### Method 2: Manual Installation

If you prefer to install manually:

1. **Create .env file**
   ```cmd
   copy .env.production.template .env
   notepad .env
   ```
   - Add your `GEMINI_API_KEY`
   - Save and close

2. **Build and start**
   ```cmd
   docker-compose -f docker-compose.production.yaml up -d --build
   ```

3. **Open browser**
   - Navigate to: http://localhost:3001

---

## 🔧 Daily Usage

After initial installation, use these scripts:

### **start.bat** - Quick Launch 🚀
Double-click to:
- Start Docker Desktop (if not running)
- Start S2RTool containers
- Open browser to localhost:3001

**Use this every day to launch the app!**

### **stop.bat** - Stop Application 🛑
- Stops all S2RTool containers
- Use when you're done for the day

### **restart.bat** - Restart Application 🔄
- Restart containers (useful after config changes)

### **status.bat** - Check Status 📊
- Shows Docker status
- Shows container status
- Tests network connectivity

### **logs.bat** - View Logs 📝
- See real-time logs from containers
- Useful for debugging
- Press Ctrl+C to exit

### **update.bat** - Update Application ⬆️
- Pull latest images
- Rebuild containers
- Restart application

### **clean.bat** - Clean Up 🧹
- Remove containers and networks
- Optionally remove volumes (reference images)
- Use before reinstalling

---

## 📂 File Structure

```
S2RTool-reborn/
├── install-windows.bat          ← Initial installation
├── start.bat                    ← Daily launcher
├── stop.bat                     ← Stop containers
├── restart.bat                  ← Restart containers
├── status.bat                   ← Check status
├── logs.bat                     ← View logs
├── update.bat                   ← Update application
├── clean.bat                    ← Clean up
├── .env                         ← Your API key (create from template)
├── .env.production.template     ← Template file
├── docker-compose.yaml          ← Development config
├── docker-compose.production.yaml ← Production config
├── backend/                     ← Backend code
│   ├── Dockerfile
│   └── ...
└── frontend/                    ← Frontend code
    ├── Dockerfile
    └── ...
```

---

## ⚙️ Configuration

### Environment Variables (.env)

Edit `.env` file to configure:

```env
# REQUIRED - Get from https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_api_key_here

# OPTIONAL - Change ports if needed
FRONTEND_PORT=3001
BACKEND_PORT=5001

# OPTIONAL - Docker registry (for pre-built images)
DOCKER_REGISTRY=docker.io
DOCKER_USERNAME=yourusername
VERSION=latest
```

### Port Conflicts

If ports 3001 or 5001 are already in use:

1. Edit `.env` file
2. Change `FRONTEND_PORT` or `BACKEND_PORT`
3. Run `restart.bat`

---

## 🐛 Troubleshooting

### Application won't start

**Check Docker is running:**
```cmd
docker info
```
- If error: Start Docker Desktop manually

**Check container status:**
```cmd
docker-compose ps
```

**View error logs:**
```cmd
docker-compose logs backend
docker-compose logs frontend
```

### Common Issues

#### "port is already allocated"
- Another application is using port 3001 or 5001
- Solution: Change ports in `.env` file

#### "GEMINI_API_KEY not set"
- You forgot to configure API key
- Solution: Edit `.env` and add your key

#### "Cannot connect to Docker daemon"
- Docker Desktop is not running
- Solution: Start Docker Desktop and wait for it to be ready

#### Containers start but browser shows error
- Containers may still be initializing
- Solution: Wait 30 seconds and refresh browser
- Check logs with `logs.bat`

#### "WSL 2 installation is incomplete"
- WSL kernel needs updating
- Solution:
  ```cmd
  wsl --update
  ```
- Restart Docker Desktop

---

## 🔄 Updating S2RTool

To update to a newer version:

### Method 1: Using update.bat (Recommended)
```cmd
update.bat
```

### Method 2: Manual update
```cmd
docker-compose -f docker-compose.production.yaml pull
docker-compose -f docker-compose.production.yaml up -d --build
```

---

## 🗑️ Uninstalling

To completely remove S2RTool:

1. **Stop and remove containers:**
   ```cmd
   clean.bat
   ```
   - Choose "Yes" to remove volumes

2. **Remove files:**
   - Delete the `S2RTool-reborn` folder

3. **Optional - Uninstall Docker Desktop:**
   - Open Settings > Apps > Docker Desktop > Uninstall

---

## 💡 Tips & Best Practices

### Daily Workflow

1. **Morning:** Double-click `start.bat`
2. **Work:** Use the app at http://localhost:3001
3. **Evening:** Double-click `stop.bat`

### Performance Tips

- **First run is slow:** Docker downloads images (~500MB)
- **Keep Docker Desktop running:** Faster startup
- **Close unused containers:** Free up resources
- **Increase Docker memory:** Settings > Resources > Memory (4GB recommended)

### Backup Your Data

Reference images are stored in Docker volume `backend-references`:

**Backup:**
```cmd
docker run --rm -v s2rtool-reborn_backend-references:/data -v %cd%:/backup alpine tar czf /backup/references-backup.tar.gz -C /data .
```

**Restore:**
```cmd
docker run --rm -v s2rtool-reborn_backend-references:/data -v %cd%:/backup alpine tar xzf /backup/references-backup.tar.gz -C /data
```

---

## 📞 Getting Help

### Check logs first:
```cmd
logs.bat
```

### Check system status:
```cmd
status.bat
```

### Common log locations:
- Container logs: `docker-compose logs`
- Docker Desktop logs: `%APPDATA%\Docker\log\`

### Still need help?

1. Check the error message in logs
2. Search for the error on Google
3. Check Docker Desktop troubleshooting docs
4. Contact support with:
   - Error message
   - Output from `status.bat`
   - Your Windows version
   - Docker Desktop version

---

## 🎯 Next Steps

After successful installation:

1. **Read the User Guide** - Learn how to use S2RTool
2. **Try a test render** - Upload a sketch and generate a render
3. **Configure settings** - Adjust default parameters
4. **Explore features** - Building render, planning render, etc.

---

## 📝 Script Reference

| Script | Purpose | When to use |
|--------|---------|-------------|
| `install-windows.bat` | First-time setup | Once, at installation |
| `start.bat` | Launch application | Every day you use it |
| `stop.bat` | Stop application | End of day |
| `restart.bat` | Restart containers | After config changes |
| `status.bat` | Check if running | Troubleshooting |
| `logs.bat` | View logs | Debugging errors |
| `update.bat` | Update to new version | When update available |
| `clean.bat` | Remove containers | Before reinstall |

---

## ⚡ Advanced Usage

### Development Mode

To run in development mode (with hot-reload):

```cmd
docker-compose up -d
```

Changes to frontend files will be reflected immediately.

### Build from Source

To build images locally instead of pulling from registry:

```cmd
docker-compose -f docker-compose.production.yaml build --no-cache
docker-compose -f docker-compose.production.yaml up -d
```

### Custom Docker Registry

If using a private registry:

1. Edit `.env`:
   ```env
   DOCKER_REGISTRY=your-registry.com
   DOCKER_USERNAME=yourname
   ```

2. Login to registry:
   ```cmd
   docker login your-registry.com
   ```

3. Pull and run:
   ```cmd
   update.bat
   ```

---

**Last Updated:** December 2024
**S2RTool Version:** 1.0
**Tested on:** Windows 10 22H2, Windows 11 23H2
