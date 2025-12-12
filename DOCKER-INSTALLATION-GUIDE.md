# Docker Desktop Installation Guide for Windows

## 📥 Download and Install

### Step 1: Download Docker Desktop

1. Go to: **https://www.docker.com/products/docker-desktop/**
2. Click **"Download for Windows"**
3. Save the `Docker Desktop Installer.exe` file

### Step 2: Install Docker Desktop

1. **Run the installer**
   - Double-click `Docker Desktop Installer.exe`
   - Click "Yes" when Windows asks for administrator permission

2. **Installation options**
   - ✅ **Check** "Use WSL 2 instead of Hyper-V" (recommended)
   - ✅ **Check** "Add shortcut to desktop" (optional)
   - Click "OK"

3. **Wait for installation**
   - Installation takes 2-5 minutes
   - Do not close the window

4. **Restart your computer**
   - Click "Close and restart"
   - **IMPORTANT:** You must restart for Docker to work!

---

## 🚀 First Launch

### Step 3: Start Docker Desktop

1. **After restart, launch Docker Desktop**
   - Find "Docker Desktop" in Start Menu
   - Double-click to open

2. **Accept agreement**
   - Read and accept the Docker Subscription Service Agreement
   - Click "Accept"

3. **Skip login** (optional)
   - You'll see "Sign in to Docker"
   - Click **"Continue without signing in"** at the bottom
   - You do NOT need a Docker account to use S2RTool

4. **Wait for Docker to start**
   - You'll see "Docker Desktop is starting..."
   - Wait until you see "Docker Desktop is running"
   - This takes 30-60 seconds

5. **Complete tutorial** (optional)
   - You can skip the tutorial
   - Click "Skip tutorial"

---

## ✅ Verify Installation

### Step 4: Check Docker is working

1. **Open Command Prompt or PowerShell**
   - Press `Windows key + R`
   - Type `cmd` and press Enter

2. **Run these commands:**
   ```cmd
   docker --version
   ```
   - Should show: `Docker version 24.x.x` (or newer)

   ```cmd
   docker info
   ```
   - Should show Docker system information
   - If you see an error, Docker is not running

3. **Test Docker**
   ```cmd
   docker run hello-world
   ```
   - Should download and run a test container
   - Should show "Hello from Docker!"

---

## 🔧 Troubleshooting

### Problem: "WSL 2 installation is incomplete"

**Solution:**
1. Download WSL 2 kernel update: https://aka.ms/wsl2kernel
2. Run the downloaded file: `wsl_update_x64.msi`
3. Restart Docker Desktop

**Alternative - Update via Command Line:**
```cmd
wsl --update
```

---

### Problem: "Hardware assisted virtualization must be enabled"

**Solution:**
1. Restart your computer
2. Enter BIOS setup (press F2, F10, Del, or Esc during boot)
3. Find "Virtualization" or "VT-x" or "AMD-V" setting
4. Enable it
5. Save and exit BIOS
6. Windows will restart
7. Try starting Docker Desktop again

**How to check if virtualization is enabled (Windows 10/11):**
1. Open Task Manager (Ctrl+Shift+Esc)
2. Go to "Performance" tab
3. Click "CPU"
4. Look for "Virtualization: Enabled"

---

### Problem: Docker Desktop won't start

**Solution 1 - Restart Docker:**
1. Right-click Docker icon in system tray
2. Click "Quit Docker Desktop"
3. Wait 10 seconds
4. Start Docker Desktop again

**Solution 2 - Restart Windows:**
- Sometimes a fresh restart fixes it

**Solution 3 - Check Windows version:**
- Docker Desktop requires:
  - Windows 10 version 1903 or higher, or
  - Windows 11
- Check your version:
  - Press `Windows key + R`
  - Type `winver` and press Enter

---

### Problem: "Cannot connect to Docker daemon"

**Causes:**
- Docker Desktop is not running
- Docker is still starting up

**Solution:**
1. Look for Docker icon in system tray (bottom-right)
2. Icon should be steady (not animated)
3. If animated, wait for it to finish starting
4. If not there, start Docker Desktop from Start Menu

---

### Problem: Containers are slow

**Solution - Increase resources:**
1. Open Docker Desktop
2. Click Settings (gear icon)
3. Go to "Resources"
4. Increase:
   - **Memory:** 4GB or more (for S2RTool)
   - **CPUs:** 2 or more
5. Click "Apply & Restart"

---

## 📋 System Requirements

### Minimum Requirements:
- **OS:** Windows 10 64-bit version 1903 or higher, OR Windows 11
- **CPU:** 64-bit processor with virtualization support
- **RAM:** 4GB (8GB recommended)
- **Disk:** 10GB free space

### Required Windows Features:
- WSL 2 (Windows Subsystem for Linux)
- Virtualization enabled in BIOS

---

## 🎯 Next Steps

Once Docker Desktop is installed and running:

1. **Return to S2RTool folder**
2. **Run `install-windows.bat`**
3. **Follow the on-screen instructions**

The installer will handle everything else automatically!

---

## 📚 Additional Resources

- **Docker Desktop docs:** https://docs.docker.com/desktop/windows/install/
- **WSL 2 docs:** https://docs.microsoft.com/en-us/windows/wsl/install
- **Docker troubleshooting:** https://docs.docker.com/desktop/troubleshoot/overview/

---

## ⚡ Quick Command Reference

```cmd
# Check Docker version
docker --version

# Check Docker is running
docker info

# Test Docker
docker run hello-world

# Update WSL
wsl --update

# Check WSL version
wsl --status

# List running containers
docker ps

# Stop all containers
docker stop $(docker ps -q)

# Remove all containers
docker rm $(docker ps -aq)
```

---

**Ready?** Close this guide and run `install-windows.bat` to install S2RTool!
