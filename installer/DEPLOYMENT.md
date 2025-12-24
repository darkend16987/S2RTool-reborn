# S2RTool Standalone Installer - Deployment Guide

**Version:** 1.0
**Last Updated:** 2025-12-23
**Target Platform:** Windows 10/11 (64-bit)

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Build Process](#build-process)
4. [Installer Components](#installer-components)
5. [Testing](#testing)
6. [Distribution](#distribution)
7. [Troubleshooting](#troubleshooting)

---

## Overview

The S2RTool Standalone Installer is an all-in-one package that includes:
- Rancher Desktop (optional, for Docker runtime)
- S2RTool Docker images (backend + frontend)
- Configuration Wizard (Electron app)
- System Tray Application (Electron app)
- NSSM (Windows Service Manager)
- Helper scripts

**Estimated final installer size:** 800MB - 1.2GB (depending on components included)

---

## Prerequisites

### Development Machine Requirements

#### Required Software

1. **Windows 10/11** (64-bit)
   - Build 19041 or later for Windows 10
   - Any build for Windows 11

2. **Node.js 18.x or later**
   - Download: https://nodejs.org
   - Verify: `node --version` (should be v18.0.0 or higher)

3. **Inno Setup 6.x**
   - Download: https://jrsoftware.org/isdl.php
   - Install to default location: `C:\Program Files (x86)\Inno Setup 6`
   - Required for compiling the installer

4. **Docker Desktop or Rancher Desktop** (for exporting images)
   - Required to export S2RTool Docker images
   - Docker Desktop: https://www.docker.com/products/docker-desktop
   - Rancher Desktop: https://rancherdesktop.io

#### Recommended Tools

1. **Git** (for version control)
   - Download: https://git-scm.com/download/win

2. **Visual Studio Code** (for editing)
   - Download: https://code.visualstudio.com

3. **7-Zip** (for manual compression if needed)
   - Download: https://www.7-zip.org

### Disk Space Requirements

- **Source code:** ~50MB
- **Node modules:** ~500MB (config-wizard + tray-app)
- **Docker images:** ~450MB (backend) + ~6MB (frontend)
- **Rancher Desktop installer:** ~600MB (if included)
- **Build output:** ~800MB - 1.2GB

**Total:** ~2.5GB free space required

---

## Build Process

### Quick Start (Automated Build)

1. **Navigate to installer directory:**
   ```cmd
   cd path\to\S2RTool-reborn\installer
   ```

2. **Run build script:**
   ```cmd
   build-installer.bat
   ```

3. **Wait for completion:**
   - The script will automatically:
     - Install npm dependencies
     - Build Electron apps
     - Download NSSM
     - Export Docker images (if Docker is available)
     - Compile installer with Inno Setup

4. **Find output:**
   ```
   installer/Output/S2RTool-Installer-v4.0.exe
   ```

### Step-by-Step Manual Build

#### Step 1: Prepare S2RTool Docker Images

```cmd
cd S2RTool-reborn

REM Build images if not already built
docker-compose build

REM Export backend image
docker save s2rtool-backend:latest -o installer\images\s2rtool-backend-4.0.tar

REM Export frontend image
docker save s2rtool-frontend:latest -o installer\images\s2rtool-frontend-4.0.tar

REM Compress images (using PowerShell)
cd installer\images
powershell -Command "Compress-Archive -Path s2rtool-backend-4.0.tar -DestinationPath s2rtool-backend-4.0.tar.gz"
powershell -Command "Compress-Archive -Path s2rtool-frontend-4.0.tar -DestinationPath s2rtool-frontend-4.0.tar.gz"

REM Clean up uncompressed TAR files
del s2rtool-backend-4.0.tar
del s2rtool-frontend-4.0.tar
```

**Result:** Two compressed files (~200MB backend, ~3MB frontend)

#### Step 2: Download NSSM

**Option A: Automatic (via build script)**
- The build script automatically downloads NSSM

**Option B: Manual Download**
```cmd
cd installer

REM Create bin directory
mkdir bin

REM Download NSSM 2.24
REM Visit: https://nssm.cc/release/nssm-2.24.zip
REM Extract and copy: nssm-2.24\win64\nssm.exe to installer\bin\nssm.exe
```

#### Step 3: Download Rancher Desktop Installer (Optional but Recommended)

```cmd
cd installer\bin

REM Visit: https://github.com/rancher-sandbox/rancher-desktop/releases/latest
REM Download: Rancher Desktop Setup X.X.X.exe
REM Rename to: RancherDesktop-Setup.exe
REM Place in: installer\bin\RancherDesktop-Setup.exe
```

**Note:** Including Rancher Desktop makes this a truly standalone installer.
If not included, users will need to install Docker manually.

#### Step 4: Build Configuration Wizard

```cmd
cd installer\config-wizard

REM Install dependencies
npm install

REM Build Windows executable
npm run build:win
```

**Output:** `config-wizard/dist/S2RConfigWizard.exe` (~120MB)

#### Step 5: Build System Tray App

```cmd
cd installer\tray-app

REM Install dependencies
npm install

REM Build Windows executable
npm run build:win
```

**Output:** `tray-app/dist/S2RTray.exe` (~120MB)

#### Step 6: Edit Inno Setup Script (setup.iss)

Uncomment the following lines in `setup.iss` if you have the required files:

```pascal
; Uncomment if you have Rancher Desktop installer:
Source: "bin\RancherDesktop-Setup.exe"; DestDir: "{tmp}"; Flags: deleteafterinstall; Check: not IsRancherDesktopInstalled

; Uncomment if you have Docker images:
Source: "images\s2rtool-backend-4.0.tar.gz"; DestDir: "{app}\images"; Flags: ignoreversion
Source: "images\s2rtool-frontend-4.0.tar.gz"; DestDir: "{app}\images"; Flags: ignoreversion

; Uncomment if you have NSSM:
Source: "bin\nssm.exe"; DestDir: "{app}\bin"; Flags: ignoreversion

; Uncomment image loading in [Run] section:
Filename: "{app}\scripts\load-images.bat"; Parameters: """{app}"""; StatusMsg: "Loading S2RTool container images..."; Flags: runhidden waituntilterminated
```

#### Step 7: Compile Installer

```cmd
cd installer

REM Compile with Inno Setup
"C:\Program Files (x86)\Inno Setup 6\ISCC.exe" setup.iss
```

**Output:** `installer/Output/S2RTool-Installer-v4.0.exe`

---

## Installer Components

### File Structure

```
installer/
├── Output/
│   └── S2RTool-Installer-v4.0.exe    # Final installer (800MB-1.2GB)
│
├── bin/
│   ├── nssm.exe                       # Windows Service Manager (700KB)
│   └── RancherDesktop-Setup.exe       # Docker runtime (600MB) [OPTIONAL]
│
├── images/
│   ├── s2rtool-backend-4.0.tar.gz     # Backend Docker image (~200MB)
│   └── s2rtool-frontend-4.0.tar.gz    # Frontend Docker image (~3MB)
│
├── config-wizard/
│   ├── dist/
│   │   └── S2RConfigWizard.exe        # Configuration wizard (~120MB)
│   └── ...                            # Source files
│
├── tray-app/
│   ├── dist/
│   │   └── S2RTray.exe                # System tray app (~120MB)
│   └── ...                            # Source files
│
├── scripts/
│   ├── load-images.bat                # Docker image loader
│   ├── install-service.bat            # Service installer
│   ├── uninstall-service.bat          # Service uninstaller
│   └── health-check.bat               # Health checker
│
├── setup.iss                          # Inno Setup script
├── build-installer.bat                # Build automation
└── README.md                          # This file
```

### Component Breakdown

| Component | Size | Required | Purpose |
|-----------|------|----------|---------|
| Inno Setup Wrapper | ~2MB | ✓ Yes | Installer framework |
| NSSM | 700KB | ✓ Yes | Windows Service manager |
| Config Wizard | ~120MB | ✓ Yes | Initial setup UI |
| System Tray App | ~120MB | ✓ Yes | Service control |
| Helper Scripts | <1MB | ✓ Yes | Automation scripts |
| Backend Image | ~200MB | ⚠ Recommended | S2RTool backend |
| Frontend Image | ~3MB | ⚠ Recommended | S2RTool frontend |
| Rancher Desktop | ~600MB | ○ Optional | Docker runtime |
| **TOTAL (Full)** | **~1.2GB** | | All components |
| **TOTAL (Minimal)** | **~450MB** | | Without Docker images/Rancher |

---

## Testing

### Testing Checklist

Before distributing the installer, test in clean environments:

#### ✅ Windows 10 Testing

**Test Environment:**
- Windows 10 Build 19041 or later
- Fresh installation (or clean VM)
- No Docker installed
- No WSL2 installed

**Test Scenarios:**
1. ☐ Fresh install with WSL2 auto-install
2. ☐ Install with existing WSL2
3. ☐ Install with existing Rancher Desktop
4. ☐ Configuration wizard:
   - ☐ API key validation
   - ☐ Port configuration
   - ☐ Auto-start enable/disable
5. ☐ Service auto-start after reboot
6. ☐ System tray app functionality:
   - ☐ Start/Stop/Restart
   - ☐ Open application
   - ☐ View logs
   - ☐ Health check
7. ☐ Uninstallation cleanup

#### ✅ Windows 11 Testing

**Test Environment:**
- Windows 11 (any build)
- Fresh installation (or clean VM)

**Test Scenarios:**
- Same as Windows 10 testing above

#### Testing Tools

**Recommended VM Software:**
- VMware Workstation Player (Free)
- VirtualBox (Free)
- Hyper-V (Built into Windows Pro)
- Windows Sandbox (Quick testing)

**VM Configuration:**
- RAM: 8GB minimum
- Disk: 80GB
- CPU: 2 cores minimum

---

## Distribution

### Distribution Checklist

Before releasing to users:

1. ☐ **Verify build integrity:**
   ```cmd
   certutil -hashfile Output\S2RTool-Installer-v4.0.exe SHA256
   ```

2. ☐ **Test on clean VMs** (Windows 10 + 11)

3. ☐ **Create release notes:**
   - Version number
   - New features
   - Bug fixes
   - Known issues
   - System requirements

4. ☐ **Sign the installer** (optional but recommended):
   - Use code signing certificate
   - Prevents SmartScreen warnings

5. ☐ **Upload to distribution platform:**
   - GitHub Releases (recommended)
   - Direct download link
   - Cloud storage (Google Drive, Dropbox, etc.)

6. ☐ **Document SHA256 hash** for verification

### Code Signing (Recommended)

To avoid Windows SmartScreen warnings, sign the installer:

```cmd
REM Requires code signing certificate (.pfx file)
signtool sign /f certificate.pfx /p password /t http://timestamp.digicert.com Output\S2RTool-Installer-v4.0.exe
```

**Where to get certificate:**
- Sectigo (formerly Comodo)
- DigiCert
- GlobalSign
- Cost: ~$100-500/year

### GitHub Release Example

```markdown
## S2RTool v4.0 - Standalone Installer

### 🎉 New Features
- Complete standalone installer (no manual Docker installation required)
- Professional Configuration Wizard
- System Tray control application
- Windows Service integration with auto-start
- Live log viewer

### 📦 Download
- **Windows 10/11 (64-bit):** [S2RTool-Installer-v4.0.exe](link) (1.2GB)
- **SHA256:** `[hash value here]`

### ⚙️ System Requirements
- Windows 10 Build 19041+ or Windows 11
- 8GB RAM (4GB minimum)
- 5GB free disk space
- Internet connection (for Gemini API)

### 📖 Installation Guide
1. Download the installer
2. Run as Administrator
3. Follow the installation wizard
4. Configure your Gemini API key
5. Start using S2RTool!

### 🐛 Known Issues
- [List any known issues]

### 📝 Changelog
- [Full changelog]
```

---

## Troubleshooting

### Common Build Issues

#### Issue: "Inno Setup not found"

**Solution:**
```cmd
REM Install Inno Setup 6 to default location:
REM C:\Program Files (x86)\Inno Setup 6\

REM Or edit build-installer.bat and update path:
set "INNO_SETUP_PATH=C:\Path\To\ISCC.exe"
```

#### Issue: "npm install fails"

**Solution:**
```cmd
REM Clear npm cache
npm cache clean --force

REM Delete node_modules and package-lock.json
rd /s /q config-wizard\node_modules
rd /s /q tray-app\node_modules
del config-wizard\package-lock.json
del tray-app\package-lock.json

REM Reinstall
cd config-wizard
npm install

cd ..\tray-app
npm install
```

#### Issue: "Docker images not found"

**Solution:**
```cmd
REM Make sure Docker is running
docker ps

REM Build images first
cd S2RTool-reborn
docker-compose build

REM Then run build script again
cd installer
build-installer.bat
```

#### Issue: "Electron build fails"

**Solution:**
```cmd
REM Install Windows Build Tools
npm install --global windows-build-tools

REM Or install Visual Studio Build Tools 2019+
REM Download from: https://visualstudio.microsoft.com/downloads/
```

#### Issue: "Installer size too large"

**Solution:**
- Consider creating two versions:
  1. **Full installer** (~1.2GB) - includes everything
  2. **Minimal installer** (~450MB) - user downloads Docker separately

```pascal
; In setup.iss, comment out large components:
; Source: "bin\RancherDesktop-Setup.exe"; ... [COMMENTED]
; Source: "images\*.tar.gz"; ... [COMMENTED]
```

### Runtime Issues

For issues during installation, see:
- `installer/README.md` - Installation guide
- System tray app logs
- `C:\Program Files\S2RTool\logs\` - Service logs

---

## Advanced Topics

### Custom Branding

1. **Replace icons:**
   - `config-wizard/assets/icon.ico`
   - `config-wizard/assets/logo.png`
   - `tray-app/assets/tray-icon.ico`
   - `tray-app/assets/tray-icon-active.ico`

2. **Update setup.iss:**
   ```pascal
   #define MyAppName "YourBrandName"
   #define MyAppPublisher "Your Company"
   SetupIconFile=path\to\your\icon.ico
   ```

3. **Rebuild:**
   ```cmd
   build-installer.bat
   ```

### Automated Builds (CI/CD)

Example GitHub Actions workflow:

```yaml
name: Build Installer

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Build Installer
        run: |
          cd installer
          build-installer.bat

      - name: Upload Artifact
        uses: actions/upload-artifact@v3
        with:
          name: S2RTool-Installer
          path: installer/Output/*.exe
```

### Creating Update Packages

For future updates, consider:
- Delta updates (only changed files)
- Auto-update mechanism in tray app
- Version checking against GitHub Releases API

---

## Support & Contact

For build issues or questions:
- GitHub Issues: https://github.com/darkend16987/S2RTool-reborn/issues
- Documentation: See README.md files in each component folder

---

**Document Version:** 1.0
**Last Updated:** 2025-12-23
**Maintainer:** S2RTool Development Team
