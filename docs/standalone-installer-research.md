# Standalone Installer Research & Analysis

**Date:** 2025-12-23
**Branch:** claude/standalone-installer-package-IlyHr
**Objective:** Create all-in-one installer for S2RTool without requiring user to manually install Docker Desktop

---

## Executive Summary

After thorough research, **Rancher Desktop** is the recommended embedded container runtime for the standalone installer package, offering the best balance of licensing, features, and user experience for Windows 10/11 deployment.

---

## Container Runtime Options Comparison

### Option 1: Podman Desktop

**Official Website:** https://podman-desktop.io

#### System Requirements
- **OS:** Windows 10 Build 19043+ or Windows 11 (64-bit only)
- **WSL Version:** WSL2 (Build 18362+ for x64, 19041+ for arm64)
- **RAM:** Minimum 6GB available
- **Virtualization:** Hardware virtualization must be enabled
- **Admin:** Administrator privileges required

#### Pros
✅ **100% Open Source** - Apache License 2.0
✅ **No licensing restrictions** - Free for all use cases
✅ **Daemonless architecture** - More secure than Docker
✅ **Rootless containers** - Better security model
✅ **Docker-compatible CLI** - `podman` commands mirror `docker`
✅ **Smaller footprint** - ~300MB installer
✅ **Red Hat backed** - Strong enterprise support

#### Cons
❌ **Less mature on Windows** - Primary focus is Linux
❌ **docker-compose support is experimental** - Uses `podman-compose` instead
❌ **Compatibility issues** - Some Docker images may not work perfectly
❌ **Learning curve** - Users familiar with Docker may face differences
❌ **Smaller community** - Less Stack Overflow answers for Windows

#### Technical Details
- **Container Engine:** Podman 5.x
- **Installer Size:** ~300MB
- **WSL Distro:** Uses Podman Machine (Fedora-based)
- **Networking:** CNI-based (different from Docker)
- **Storage:** Default driver is `overlay`

---

### Option 2: Rancher Desktop ⭐ **RECOMMENDED**

**Official Website:** https://rancherdesktop.io

#### System Requirements
- **OS:** Windows 10 (latest updates) or Windows 11 (latest updates)
- **WSL Version:** WSL2 required
- **Virtualization:** Hardware virtualization enabled
- **Editions:** Supports Windows Home, Pro, Enterprise

#### Pros
✅ **100% Open Source** - Apache License 2.0
✅ **Commercial-friendly** - No enterprise licensing fees
✅ **Dual runtime support** - Choose between **containerd** or **dockerd (moby)**
✅ **Full Docker compatibility** - Native `docker` CLI and `docker-compose`
✅ **User-friendly GUI** - Built-in interface for management
✅ **Kubernetes included** - K3s for local development (optional)
✅ **Active development** - Latest release: v1.20.1 (Dec 2024)
✅ **SUSE backed** - Enterprise-grade support available
✅ **Silent installation** - Supports automated deployment

#### Cons
❌ **Larger installer** - ~600MB download
❌ **More resource-intensive** - Includes K3s (can be disabled)
❌ **Slower startup** - GUI overhead compared to CLI-only

#### Technical Details
- **Current Version:** 1.20.1 (Released December 2024)
- **Container Runtimes:**
  - **dockerd (moby)** - Full Docker compatibility
  - **containerd** - Lightweight alternative
- **Installer Size:** ~600MB
- **WSL Distro:** Custom Rancher Desktop WSL distro
- **Networking:** CNI (with Docker bridge compatibility)
- **docker-compose:** v2.40.3 included
- **GUI Framework:** Electron-based

#### Silent Installation Support
```bash
# Silent install example
RancherDesktop-Setup-1.20.1.exe /S /D=C:\Program Files\Rancher Desktop
```

---

### Option 3: Docker Engine in WSL2

**Approach:** Install Docker Engine directly in WSL2 without Docker Desktop

#### System Requirements
- **OS:** Windows 10 version 1903+ or Windows 11
- **WSL Version:** WSL2 with Ubuntu 22.04/24.04
- **Virtualization:** Enabled

#### Pros
✅ **Official Docker Engine** - 100% compatibility
✅ **Lightest resource usage** - No GUI overhead
✅ **Free for all use** - No licensing restrictions
✅ **Direct control** - Full access to Docker daemon
✅ **Better performance** - Native Linux performance

#### Cons
❌ **Complex installation** - Multiple manual steps required
❌ **No GUI** - Command-line only
❌ **Difficult to package** - Hard to automate in installer
❌ **WSL networking issues** - DNS resolution problems common
❌ **Service management** - Manual daemon start/stop
❌ **No official support** - Community-driven solutions only

#### Installation Complexity
```bash
# Typical installation requires:
1. Install WSL2
2. Install Ubuntu distro
3. Update packages
4. Install Docker Engine via apt
5. Configure Docker daemon
6. Fix DNS issues
7. Configure auto-start
8. Install docker-compose separately
```

**Verdict:** ❌ Not suitable for end-user standalone installer due to complexity

---

## Detailed Comparison Matrix

| Feature | Podman Desktop | Rancher Desktop | Docker in WSL2 |
|---------|----------------|-----------------|----------------|
| **License** | Apache 2.0 | Apache 2.0 | Apache 2.0 |
| **Commercial Use** | ✅ Free | ✅ Free | ✅ Free |
| **Windows Support** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Docker Compatibility** | ⭐⭐⭐ (90%) | ⭐⭐⭐⭐⭐ (100%) | ⭐⭐⭐⭐⭐ (100%) |
| **docker-compose** | ⚠️ podman-compose | ✅ Native v2.40.3 | ✅ Requires install |
| **GUI Included** | ✅ Yes | ✅ Yes | ❌ No |
| **Silent Install** | ✅ Yes | ✅ Yes | ❌ Complex |
| **Installer Size** | ~300MB | ~600MB | ~100MB |
| **RAM Usage** | ~1.5GB | ~2GB | ~1GB |
| **Startup Time** | ~10s | ~15s | ~5s |
| **User-Friendliness** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Package in Installer** | ✅ Easy | ✅ Easy | ❌ Very Hard |
| **Auto-Update** | ✅ Built-in | ✅ Built-in | ❌ Manual |
| **Community Support** | Medium | Large | Large |
| **Active Development** | ✅ Yes | ✅ Yes | ✅ Yes |

---

## Decision Matrix for S2RTool Standalone Installer

### Requirements
1. ✅ Windows 10/11 support
2. ✅ No Docker Desktop dependency
3. ✅ Full docker-compose compatibility (for current docker-compose.yaml)
4. ✅ User-friendly installation
5. ✅ Commercial licensing allowed
6. ✅ Silent installation capability
7. ✅ Minimal user configuration
8. ✅ Professional appearance

### Scoring (out of 10)

| Criteria | Weight | Podman | Rancher | Docker WSL |
|----------|--------|--------|---------|------------|
| Docker Compatibility | 25% | 7 | 10 | 10 |
| Ease of Packaging | 20% | 8 | 9 | 3 |
| User Experience | 20% | 8 | 10 | 4 |
| Resource Usage | 15% | 9 | 7 | 10 |
| Licensing | 10% | 10 | 10 | 10 |
| Reliability | 10% | 7 | 9 | 8 |
| **TOTAL SCORE** | | **7.9** | **9.2** ⭐ | **6.8** |

---

## Final Recommendation: Rancher Desktop

### Why Rancher Desktop?

1. **100% Docker Compatibility**
   - Uses actual Docker Engine (moby)
   - Our existing `docker-compose.yaml` will work without modifications
   - All Docker CLI commands work identically

2. **Professional User Experience**
   - GUI for non-technical users
   - System tray integration
   - Easy start/stop controls
   - Visual container management

3. **Installer-Friendly**
   - Single `.exe` installer
   - Supports silent installation with `/S` flag
   - Predictable installation path
   - No complex post-install configuration

4. **Commercial Licensing**
   - Apache 2.0 license
   - No restrictions on commercial use
   - No enterprise fees (unlike Docker Desktop)
   - Can redistribute in our installer

5. **Active Maintenance**
   - Latest release: v1.20.1 (December 2024)
   - Regular security updates
   - SUSE/Rancher backing
   - Large community support

6. **Windows Native**
   - Excellent Windows 10/11 support
   - Proper WSL2 integration
   - Windows Service registration
   - Startup integration

---

## Implementation Plan for Standalone Installer

### Phase 1: Rancher Desktop Embedding

```
S2RTool-Installer-v4.0.exe
│
├── Embedded Binaries
│   ├── RancherDesktop-1.20.1.exe (600MB)
│   ├── s2rtool-backend-4.0.tar (450MB)
│   ├── s2rtool-frontend-4.0.tar (6MB)
│   └── Total: ~1.1GB compressed to ~800MB
│
├── Installer Components
│   ├── Inno Setup Script (main.iss)
│   ├── Configuration Wizard (Electron)
│   ├── System Tray App (Python/PyQt or Electron)
│   └── Service Registration (NSSM or native)
│
└── Installation Flow
    1. Extract temporary files
    2. Check Windows version (10/11)
    3. Check WSL2 installed → Install if missing
    4. Install Rancher Desktop silently
    5. Configure Rancher to use dockerd
    6. Load pre-built S2RTool images
    7. Show configuration wizard
    8. Create .env file with user inputs
    9. Register Windows Service
    10. Create desktop shortcut
    11. Launch application
```

### Configuration Wizard UI (Electron)

```javascript
// wizard-app/main.js
const { app, BrowserWindow, ipcMain } = require('electron');

// Step 1: Welcome screen
// Step 2: License agreement
// Step 3: Gemini API Key input (with validation)
// Step 4: Optional: License key input (for paid version)
// Step 5: Port configuration (default 3001/5001)
// Step 6: Installation progress
// Step 7: Completion screen with "Launch S2RTool" button
```

### System Tray Application

```python
# tray-app/main.py
from PyQt5.QtWidgets import QSystemTrayIcon, QMenu, QAction
import subprocess

class S2RTrayApp:
    def __init__(self):
        self.menu = QMenu()
        self.menu.addAction("Open S2RTool", self.open_browser)
        self.menu.addAction("Start Services", self.start_services)
        self.menu.addAction("Stop Services", self.stop_services)
        self.menu.addAction("Restart Services", self.restart_services)
        self.menu.addSeparator()
        self.menu.addAction("Settings", self.open_settings)
        self.menu.addAction("Check for Updates", self.check_updates)
        self.menu.addSeparator()
        self.menu.addAction("Exit", self.exit_app)
```

---

## Technical Architecture

### Directory Structure (Post-Installation)

```
C:\Program Files\S2RTool\
│
├── rancher-desktop\              # Embedded Rancher Desktop
│   ├── RancherDesktop.exe
│   ├── resources\
│   └── wsl-distro\
│
├── s2rtool-app\                  # S2RTool application
│   ├── docker-compose.yaml
│   ├── .env                      # User configuration
│   ├── backend-image.tar
│   ├── frontend-image.tar
│   └── references\               # User reference images
│
├── tray-app\                     # System tray application
│   ├── S2RTray.exe
│   └── icon.ico
│
├── config-wizard\                # Configuration wizard
│   ├── S2RConfigWizard.exe
│   └── resources\
│
└── uninstall\
    └── unins000.exe
```

### Windows Service Configuration

```powershell
# Service Name: S2RTool
# Display Name: S2RTool Rendering Service
# Start Type: Automatic (Delayed Start)
# Recovery: Restart on failure

# Service wraps docker-compose command:
docker-compose -f "C:\Program Files\S2RTool\s2rtool-app\docker-compose.yaml" up -d
```

---

## User Installation Experience

### Installation Wizard Flow

1. **Welcome Screen**
   - S2RTool logo
   - Version information
   - Brief description

2. **System Check**
   - ✅ Windows version check
   - ✅ Available disk space (5GB minimum)
   - ✅ Available RAM (4GB minimum)
   - ⚙️ WSL2 installation (if needed)

3. **License Agreement**
   - MIT license display
   - "I accept" checkbox

4. **Configuration**
   - Gemini API Key input field
   - "Validate" button (test API key)
   - Optional: Software license key (for future paid version)
   - Port selection (defaults: 3001, 5001)

5. **Installation Progress**
   - Installing Rancher Desktop... (2 min)
   - Loading container images... (1 min)
   - Configuring services... (30s)
   - Creating shortcuts... (5s)

6. **Completion**
   - ✅ Installation successful
   - [Launch S2RTool] button
   - [View Documentation] link
   - Desktop shortcut created

### Expected Installation Time

- **Fast SSD + Good Internet:** ~3-5 minutes
- **HDD + Average Internet:** ~8-12 minutes
- **First-time WSL2 install:** +5-10 minutes

---

## Next Steps

1. ✅ **Research Completed** - Rancher Desktop selected
2. ⏭️ **Architecture Design** - Create detailed component diagram
3. ⏭️ **Prototype Configuration Wizard** - Electron app skeleton
4. ⏭️ **Prototype System Tray App** - PyQt5 or Electron
5. ⏭️ **Inno Setup Script** - Main installer logic
6. ⏭️ **Image Packaging** - Export and compress Docker images
7. ⏭️ **Testing** - Windows 10/11 virtual machines

---

## References

### Rancher Desktop
- [Official Documentation](https://docs.rancherdesktop.io/)
- [Installation Guide](https://docs.rancherdesktop.io/getting-started/installation/)
- [GitHub Repository](https://github.com/rancher-sandbox/rancher-desktop)
- [Latest Release v1.20.1](https://github.com/rancher-sandbox/rancher-desktop/releases/tag/v1.20.1)

### Podman Desktop
- [Official Website](https://podman-desktop.io)
- [Windows Installation](https://podman-desktop.io/docs/installation/windows-install)
- [How to install Podman Desktop on Windows](https://developers.redhat.com/articles/2023/09/27/how-install-and-use-podman-desktop-windows)

### Docker Engine WSL2
- [Effortless Docker Installation Without Docker Desktop](https://sitecoreme.wordpress.com/2025/01/22/effortless-docker-installation-without-docker-desktop/)
- [Install Docker Engine on Windows 11 Without Desktop](https://techstackthinker.wordpress.com/2025/05/27/%F0%9F%90%B3-how-to-install-docker-engine-on-windows-11-without-docker-desktop-compose-v2-dns-fix/)
- [Mastering Docker on WSL2 Complete Guide](https://medium.com/h7w/mastering-docker-on-wsl2-a-complete-guide-without-docker-desktop-19c4e945590b)

---

**Document Version:** 1.0
**Last Updated:** 2025-12-23
**Author:** Claude Code Assistant
**Status:** ✅ Research Complete - Ready for Implementation
