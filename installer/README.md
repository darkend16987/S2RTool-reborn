# S2RTool Standalone Installer

This directory contains all components for building the standalone Windows installer package.

## Directory Structure

```
installer/
├── bin/                        # Binary dependencies
│   ├── nssm.exe               # Windows Service manager
│   └── 7z.exe                 # 7-Zip for decompression (if needed)
│
├── images/                     # Docker images (compressed)
│   ├── s2rtool-backend-4.0.tar.gz
│   └── s2rtool-frontend-4.0.tar.gz
│
├── scripts/                    # Installation scripts
│   ├── load-images.bat        # Load Docker images
│   ├── install-service.bat    # Install Windows Service
│   ├── uninstall-service.bat  # Uninstall Windows Service
│   └── health-check.bat       # Check service health
│
├── config-wizard/              # Configuration Wizard (Electron app)
│   ├── package.json
│   ├── main.js
│   ├── preload.js
│   ├── index.html
│   ├── renderer.js
│   ├── styles.css
│   ├── api-validator.js
│   └── config-writer.js
│
├── tray-app/                   # System Tray App (Electron app)
│   ├── package.json
│   ├── main.js
│   ├── menu.js
│   ├── docker-manager.js
│   ├── tray-icon.ico
│   └── tray-icon-active.ico
│
├── assets/                     # Installer assets
│   ├── logo.png
│   ├── icon.ico
│   ├── banner.bmp             # Inno Setup banner
│   └── wizard-image.bmp       # Inno Setup wizard image
│
├── setup.iss                   # Inno Setup script (main installer)
├── build-installer.bat         # Build script for Windows
├── build-installer.sh          # Build script for Linux/WSL
└── README.md                   # This file
```

## Build Requirements

### Prerequisites

1. **Inno Setup 6.x**
   - Download: https://jrsoftware.org/isdl.php
   - Install to default location: `C:\Program Files (x86)\Inno Setup 6`

2. **Node.js 18.x or later**
   - Download: https://nodejs.org
   - Required for building Electron apps

3. **Docker Desktop or Rancher Desktop**
   - Required to export Docker images

4. **7-Zip**
   - Download: https://www.7-zip.org
   - Required for compressing images

### Build Steps

#### 1. Export Docker Images

```bash
# Build current S2RTool images
cd ..
docker-compose build

# Export images
docker save s2rtool-backend:latest -o installer/images/s2rtool-backend-4.0.tar
docker save s2rtool-frontend:latest -o installer/images/s2rtool-frontend-4.0.tar

# Compress images
cd installer/images
7z a -mx=9 s2rtool-backend-4.0.tar.gz s2rtool-backend-4.0.tar
7z a -mx=9 s2rtool-frontend-4.0.tar.gz s2rtool-frontend-4.0.tar
rm s2rtool-backend-4.0.tar s2rtool-frontend-4.0.tar
```

#### 2. Download NSSM

```bash
# Download NSSM 2.24
cd installer/bin
curl -L https://nssm.cc/release/nssm-2.24.zip -o nssm.zip
7z x nssm.zip
cp nssm-2.24/win64/nssm.exe .
rm -rf nssm-2.24 nssm.zip
```

#### 3. Build Configuration Wizard

```bash
cd installer/config-wizard
npm install
npm run build

# This creates a standalone executable
# Output: dist/S2RConfigWizard.exe
```

#### 4. Build System Tray App

```bash
cd installer/tray-app
npm install
npm run build

# Output: dist/S2RTray.exe
```

#### 5. Compile Installer

```bash
cd installer

# Using Inno Setup Compiler
"C:\Program Files (x86)\Inno Setup 6\ISCC.exe" setup.iss

# Output: Output/S2RTool-Installer-v4.0.exe
```

Or simply run:

```bash
# Windows
build-installer.bat

# Linux/WSL
./build-installer.sh
```

## Installation Process

When a user runs the installer, the following happens:

1. **Pre-flight checks**
   - Windows version (10 Build 19041+ or 11)
   - Disk space (5GB minimum)
   - RAM (4GB minimum)
   - WSL2 installation status

2. **Install Rancher Desktop** (silent, ~2-3 min)
   - Downloads from embedded installer
   - Configures to use dockerd runtime
   - Disables Kubernetes (not needed)

3. **Load Docker images** (~1-2 min)
   - Decompresses tar.gz files
   - Loads into Docker
   - Tags as latest

4. **Configuration wizard** (user input required)
   - Gemini API key validation
   - Port configuration
   - Auto-start preference

5. **Windows Service registration** (optional, ~10 sec)
   - Uses NSSM to create service
   - Auto-start on boot
   - Restart on failure

6. **Create shortcuts**
   - Desktop shortcut
   - Start Menu entries
   - System tray app in startup

7. **Launch application**
   - Opens http://localhost:3001 in browser

## Testing

### Test in Clean VM

1. Create Windows 10/11 VM (VMware/VirtualBox/Hyper-V)
2. Ensure internet connection
3. Run installer
4. Verify all steps complete successfully
5. Test application functionality

### Test Scenarios

- [ ] Fresh install on Windows 10 (no WSL2)
- [ ] Fresh install on Windows 11
- [ ] Install with existing WSL2
- [ ] Install with existing Rancher Desktop
- [ ] Upgrade from previous version
- [ ] Uninstall and cleanup verification
- [ ] Service auto-start after reboot
- [ ] System tray app functionality
- [ ] Configuration wizard validation

## Troubleshooting

### Common Issues

**Issue:** WSL2 installation requires reboot
**Solution:** Installer will prompt user to reboot and run again

**Issue:** Docker images fail to load
**Solution:** Check Docker service is running: `docker ps`

**Issue:** Service fails to start
**Solution:** Check logs in `C:\Program Files\S2RTool\logs\`

**Issue:** Port already in use
**Solution:** Reconfigure ports in Configuration Wizard

## Development Notes

### Electron App Development

To test Electron apps without building:

```bash
# Config Wizard
cd config-wizard
npm install
npm start

# Tray App
cd tray-app
npm install
npm start
```

### Inno Setup Testing

Compile without compression for faster testing:

```pascal
; In setup.iss, temporarily change:
Compression=lzma2/ultra64
; to:
Compression=none
```

### Debugging

Enable debug logging in Inno Setup:

```pascal
; Add to [Setup] section:
SetupLogging=yes
; Log saved to: %TEMP%\Setup Log YYYY-MM-DD #NNN.txt
```

## License

This installer is part of S2RTool and is licensed under the MIT License.

Third-party components:
- **Rancher Desktop:** Apache License 2.0
- **NSSM:** Public Domain
- **Electron:** MIT License
- **Inno Setup:** Free for commercial use

---

**Version:** 1.0
**Last Updated:** 2025-12-23
**Maintainer:** S2RTool Development Team
