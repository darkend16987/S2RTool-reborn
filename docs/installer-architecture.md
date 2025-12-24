# S2RTool Standalone Installer - Architecture Design

**Version:** 1.0
**Date:** 2025-12-23
**Target Platform:** Windows 10/11 (64-bit)
**Container Runtime:** Rancher Desktop 1.20.1

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    S2RTool Installer Package                    │
│                        (~800MB compressed)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────┐    │
│  │              Inno Setup Installer                      │    │
│  │  (Main orchestrator - handles entire installation)    │    │
│  └───────────────────────────────────────────────────────┘    │
│                          │                                      │
│                          ▼                                      │
│  ┌───────────────────────────────────────────────────────┐    │
│  │         Component 1: Rancher Desktop (600MB)          │    │
│  │  - Silent install with /S flag                        │    │
│  │  - Configure to use dockerd (not containerd)          │    │
│  │  - Disable Kubernetes (K3s not needed)                │    │
│  └───────────────────────────────────────────────────────┘    │
│                          │                                      │
│                          ▼                                      │
│  ┌───────────────────────────────────────────────────────┐    │
│  │      Component 2: Docker Images (~456MB)              │    │
│  │  - s2rtool-backend:4.0.tar (450MB)                    │    │
│  │  - s2rtool-frontend:4.0.tar (6MB)                     │    │
│  │  Load with: docker load -i <file>                     │    │
│  └───────────────────────────────────────────────────────┘    │
│                          │                                      │
│                          ▼                                      │
│  ┌───────────────────────────────────────────────────────┐    │
│  │    Component 3: Configuration Wizard (Electron)       │    │
│  │  - Collect Gemini API Key                             │    │
│  │  - Validate API key with test request                 │    │
│  │  - Configure ports (3001, 5001)                       │    │
│  │  - Generate .env file                                 │    │
│  └───────────────────────────────────────────────────────┘    │
│                          │                                      │
│                          ▼                                      │
│  ┌───────────────────────────────────────────────────────┐    │
│  │      Component 4: System Tray App (Electron)          │    │
│  │  - Start/Stop/Restart services                        │    │
│  │  - Open browser to localhost:3001                     │    │
│  │  - View logs                                           │    │
│  │  - Check for updates                                   │    │
│  └───────────────────────────────────────────────────────┘    │
│                          │                                      │
│                          ▼                                      │
│  ┌───────────────────────────────────────────────────────┐    │
│  │     Component 5: Windows Service (NSSM wrapper)       │    │
│  │  - Auto-start docker-compose on boot                  │    │
│  │  - Restart on failure                                  │    │
│  │  - Clean shutdown on stop                              │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Installation Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  User double-clicks S2RTool-Installer-v4.0.exe             │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Pre-Installation Checks                           │
├─────────────────────────────────────────────────────────────┤
│  ✓ Check Windows version (10 Build 19041+ or 11)           │
│  ✓ Check available disk space (5GB minimum)                │
│  ✓ Check RAM (4GB minimum)                                 │
│  ✓ Check if Rancher Desktop already installed              │
│  ✓ Check if WSL2 is installed                              │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
         ┌────────┴────────┐
         │  WSL2 Installed? │
         └────────┬────────┘
                  │
        ┌─────────┴─────────┐
        NO                  YES
        │                   │
        ▼                   ▼
┌──────────────────┐  ┌──────────────────┐
│ Install WSL2     │  │ Skip WSL2 Install│
│ (wsl --install)  │  │                  │
│ REQUIRES REBOOT  │  │                  │
└──────┬───────────┘  └──────┬───────────┘
       │                     │
       └──────────┬──────────┘
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Show Welcome Screen                               │
├─────────────────────────────────────────────────────────────┤
│  - S2RTool logo and version                                │
│  - Brief description                                        │
│  - [Next] button                                            │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: License Agreement                                 │
├─────────────────────────────────────────────────────────────┤
│  - Display MIT License                                      │
│  - [ ] I accept the terms                                   │
│  - [Next] enabled only when checked                         │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: Installation Path Selection                       │
├─────────────────────────────────────────────────────────────┤
│  Default: C:\Program Files\S2RTool                          │
│  [Browse...] to change                                      │
│  Disk space required: 3.5GB                                 │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 5: Install Rancher Desktop (Silent)                  │
├─────────────────────────────────────────────────────────────┤
│  Progress bar: [████████░░░░░░░░░░] 40%                     │
│  Status: Installing Rancher Desktop...                      │
│                                                             │
│  Command executed:                                          │
│  > RancherDesktop-1.20.1.exe /S                             │
│      /D=C:\Program Files\Rancher Desktop                    │
│                                                             │
│  Post-install config:                                       │
│  > rdctl set --container-engine dockerd                     │
│  > rdctl set --kubernetes-enabled=false                     │
│                                                             │
│  Duration: ~2-3 minutes                                     │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 6: Load Docker Images                                │
├─────────────────────────────────────────────────────────────┤
│  Progress bar: [████████████████░░] 80%                     │
│  Status: Loading S2RTool container images...                │
│                                                             │
│  Commands executed:                                         │
│  > docker load -i s2rtool-backend-4.0.tar                   │
│  > docker load -i s2rtool-frontend-4.0.tar                  │
│  > docker tag s2rtool-backend:4.0 s2rtool-backend:latest    │
│  > docker tag s2rtool-frontend:4.0 s2rtool-frontend:latest  │
│                                                             │
│  Duration: ~1-2 minutes                                     │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 7: Install System Components                         │
├─────────────────────────────────────────────────────────────┤
│  - Copy docker-compose.yaml to install directory            │
│  - Copy frontend/backend files                              │
│  - Install system tray app (S2RTray.exe)                    │
│  - Install configuration wizard (S2RConfigWizard.exe)       │
│  - Create directories (references/, logs/)                  │
│                                                             │
│  Duration: ~30 seconds                                      │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 8: Launch Configuration Wizard                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │  S2RTool Configuration Wizard                       │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │                                                     │   │
│  │  Gemini API Key (Required):                        │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │ AIzaSy...                                    │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │  [Test Connection] button                          │   │
│  │  Status: ✓ API key is valid                        │   │
│  │                                                     │   │
│  │  Frontend Port:  [3001]  (default)                 │   │
│  │  Backend Port:   [5001]  (default)                 │   │
│  │                                                     │   │
│  │  [ ] Start S2RTool automatically on Windows start  │   │
│  │  [✓] Create desktop shortcut                       │   │
│  │                                                     │   │
│  │              [Cancel]  [Save & Continue]           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  On [Save & Continue]:                                      │
│  - Create .env file with GEMINI_API_KEY                     │
│  - Save port configuration                                  │
│  - If auto-start checked: Register Windows Service          │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 9: Register Windows Service (if enabled)             │
├─────────────────────────────────────────────────────────────┤
│  Using NSSM (Non-Sucking Service Manager):                 │
│                                                             │
│  > nssm install S2RTool "docker-compose.exe"                │
│      -f "C:\...\docker-compose.yaml" up                     │
│  > nssm set S2RTool AppDirectory "C:\...\S2RTool"           │
│  > nssm set S2RTool Start SERVICE_AUTO_START                │
│  > nssm set S2RTool AppStopMethodConsole 10000              │
│  > nssm set S2RTool AppExit Default Restart                 │
│                                                             │
│  Start service:                                             │
│  > net start S2RTool                                        │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 10: Create Shortcuts and Tray App                    │
├─────────────────────────────────────────────────────────────┤
│  - Create desktop shortcut: "S2RTool.lnk"                   │
│    → Opens http://localhost:3001 in default browser         │
│                                                             │
│  - Create Start Menu entry:                                 │
│    → Programs\S2RTool\S2RTool                               │
│    → Programs\S2RTool\Configuration                         │
│    → Programs\S2RTool\Uninstall                             │
│                                                             │
│  - Add S2RTray to Windows startup:                          │
│    → HKCU\Software\Microsoft\Windows\CurrentVersion\Run    │
│    → "S2RTool" = "C:\...\S2RTray.exe --minimized"           │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 11: Wait for Services to Start                       │
├─────────────────────────────────────────────────────────────┤
│  Checking service health...                                │
│                                                             │
│  Loop (max 60 seconds):                                     │
│  1. Check if containers are running:                        │
│     docker ps --filter name=s2rtool-backend                 │
│     docker ps --filter name=s2rtool-frontend                │
│                                                             │
│  2. Test backend health:                                    │
│     HTTP GET http://localhost:5001/health                   │
│     Expected: {"status": "healthy"}                         │
│                                                             │
│  3. Test frontend:                                          │
│     HTTP GET http://localhost:3001                          │
│     Expected: 200 OK                                        │
│                                                             │
│  Status: ✓ Services are running                            │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 12: Installation Complete!                           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │            ✓ Installation Successful!              │   │
│  │                                                     │   │
│  │  S2RTool has been installed successfully.           │   │
│  │                                                     │   │
│  │  You can now:                                       │   │
│  │  • Click "Launch S2RTool" to start rendering        │   │
│  │  • Use the system tray icon to control services     │   │
│  │  • Access via: http://localhost:3001                │   │
│  │                                                     │   │
│  │  Installation details:                              │   │
│  │  Location: C:\Program Files\S2RTool                 │   │
│  │  Version: 4.0                                       │   │
│  │  Auto-start: Enabled                                │   │
│  │                                                     │   │
│  │  [✓] Launch S2RTool now                            │   │
│  │  [✓] Show Quick Start Guide                        │   │
│  │                                                     │   │
│  │                          [Finish]                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  On [Finish]:                                               │
│  - If "Launch S2RTool" checked:                             │
│    → Open http://localhost:3001 in default browser          │
│  - If "Show Quick Start Guide" checked:                     │
│    → Open docs/quick-start.html                             │
│  - Start system tray app (minimized)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Specifications

### 1. Inno Setup Installer Script

**File:** `installer/setup.iss`

**Key Features:**
- Modern flat UI with custom images
- Progress tracking across all steps
- Error handling and rollback
- Uninstaller generation
- Registry cleanup on uninstall

**Code Structure:**
```pascal
[Setup]
AppName=S2RTool
AppVersion=4.0
DefaultDirName={pf}\S2RTool
DefaultGroupName=S2RTool
OutputBaseFilename=S2RTool-Installer-v4.0
Compression=lzma2/ultra64
SolidCompression=yes
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64
PrivilegesRequired=admin
MinVersion=10.0.19041

[Files]
; Rancher Desktop installer
Source: "bin\RancherDesktop-1.20.1.exe"; DestDir: "{tmp}"; Flags: deleteafterinstall

; Docker images (compressed)
Source: "images\s2rtool-backend-4.0.tar.gz"; DestDir: "{app}\images"; Flags: ignoreversion
Source: "images\s2rtool-frontend-4.0.tar.gz"; DestDir: "{app}\images"; Flags: ignoreversion

; Application files
Source: "docker-compose.yaml"; DestDir: "{app}"; Flags: ignoreversion
Source: ".env.template"; DestDir: "{app}"; Flags: ignoreversion

; Configuration wizard
Source: "config-wizard\*"; DestDir: "{app}\config-wizard"; Flags: ignoreversion recursesubdirs

; System tray app
Source: "tray-app\*"; DestDir: "{app}\tray-app"; Flags: ignoreversion recursesubdirs

; NSSM for service management
Source: "bin\nssm.exe"; DestDir: "{app}\bin"; Flags: ignoreversion

; Scripts
Source: "scripts\*"; DestDir: "{app}\scripts"; Flags: ignoreversion

[Run]
; Step 1: Install Rancher Desktop
Filename: "{tmp}\RancherDesktop-1.20.1.exe"; Parameters: "/S"; StatusMsg: "Installing Rancher Desktop..."; Flags: waituntilterminated

; Step 2: Configure Rancher Desktop
Filename: "{cmd}"; Parameters: "/c ""rdctl set --container-engine dockerd"""; StatusMsg: "Configuring container runtime..."; Flags: waituntilterminated

; Step 3: Load Docker images
Filename: "{app}\scripts\load-images.bat"; StatusMsg: "Loading container images..."; Flags: waituntilterminated

; Step 4: Launch configuration wizard
Filename: "{app}\config-wizard\S2RConfigWizard.exe"; StatusMsg: "Launching configuration wizard..."; Flags: waituntilterminated

; Step 5: Install Windows Service (if enabled in wizard)
Filename: "{app}\scripts\install-service.bat"; StatusMsg: "Registering Windows Service..."; Flags: waituntilterminated

[Code]
// Custom Pascal script for advanced logic
function CheckWSL2Installed: Boolean;
var
  ResultCode: Integer;
begin
  Result := Exec('wsl.exe', '--status', '', SW_HIDE, ewWaitUntilTerminated, ResultCode) and (ResultCode = 0);
end;

procedure InstallWSL2;
var
  ResultCode: Integer;
begin
  if not CheckWSL2Installed then begin
    if MsgBox('WSL2 is not installed. S2RTool requires WSL2. Install now?' + #13#10 + #13#10 + 'Note: This will require a system reboot.', mbConfirmation, MB_YESNO) = IDYES then begin
      Exec('wsl.exe', '--install --no-distribution', '', SW_SHOW, ewWaitUntilTerminated, ResultCode);
      MsgBox('WSL2 installation started. Please reboot your computer and run this installer again.', mbInformation, MB_OK);
      Abort;
    end else begin
      MsgBox('S2RTool requires WSL2 to run. Installation cannot continue.', mbError, MB_OK);
      Abort;
    end;
  end;
end;

function InitializeSetup(): Boolean;
begin
  // Check minimum Windows version
  if not IsWindows10OrLater then begin
    MsgBox('S2RTool requires Windows 10 Build 19041 or later.', mbError, MB_OK);
    Result := False;
    Exit;
  end;

  // Check disk space
  if GetSpaceOnDisk(ExpandConstant('{pf}'), False) < 5368709120 then begin // 5GB
    MsgBox('Insufficient disk space. At least 5GB required.', mbError, MB_OK);
    Result := False;
    Exit;
  end;

  // Check RAM
  if GetTotalPhysicalMemory < 4294967296 then begin // 4GB
    MsgBox('Insufficient RAM. At least 4GB required.', mbError, MB_OK);
    Result := False;
    Exit;
  end;

  // Install WSL2 if needed
  InstallWSL2;

  Result := True;
end;
```

---

### 2. Configuration Wizard (Electron)

**Directory:** `config-wizard/`

**Technology Stack:**
- Electron 28.x
- HTML/CSS/JavaScript
- No frameworks (lightweight)

**File Structure:**
```
config-wizard/
├── package.json
├── main.js                 # Electron main process
├── preload.js              # IPC bridge
├── index.html              # Main UI
├── renderer.js             # UI logic
├── styles.css              # Styling
├── api-validator.js        # Gemini API key validation
└── config-writer.js        # .env file generation
```

**main.js:**
```javascript
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 700,
    resizable: false,
    frame: true,
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');
  mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow);

// IPC Handlers
ipcMain.handle('validate-api-key', async (event, apiKey) => {
  const validator = require('./api-validator');
  return await validator.testGeminiApiKey(apiKey);
});

ipcMain.handle('save-config', async (event, config) => {
  const writer = require('./config-writer');
  const installPath = process.argv[2] || 'C:\\Program Files\\S2RTool';
  return await writer.createEnvFile(installPath, config);
});

ipcMain.handle('install-service', async (event, autoStart) => {
  if (autoStart) {
    const { exec } = require('child_process');
    const installPath = process.argv[2] || 'C:\\Program Files\\S2RTool';

    return new Promise((resolve, reject) => {
      exec(`"${installPath}\\scripts\\install-service.bat"`, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve({ success: true, output: stdout });
        }
      });
    });
  }
  return { success: true, skipped: true };
});
```

**index.html:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>S2RTool Configuration</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <header>
      <img src="logo.png" alt="S2RTool Logo" class="logo">
      <h1>S2RTool Configuration</h1>
      <p>Please provide your Gemini API key to get started</p>
    </header>

    <main>
      <div class="form-group">
        <label for="apiKey">Gemini API Key <span class="required">*</span></label>
        <input
          type="text"
          id="apiKey"
          placeholder="AIzaSy..."
          required
          autocomplete="off"
        >
        <button id="testBtn" class="btn-secondary">Test Connection</button>
        <div id="apiStatus" class="status-message"></div>
      </div>

      <div class="form-group">
        <label for="frontendPort">Frontend Port</label>
        <input
          type="number"
          id="frontendPort"
          value="3001"
          min="1024"
          max="65535"
        >
        <small>Default: 3001</small>
      </div>

      <div class="form-group">
        <label for="backendPort">Backend Port</label>
        <input
          type="number"
          id="backendPort"
          value="5001"
          min="1024"
          max="65535"
        >
        <small>Default: 5001</small>
      </div>

      <div class="form-group checkbox-group">
        <label>
          <input type="checkbox" id="autoStart" checked>
          Start S2RTool automatically on Windows startup
        </label>
      </div>

      <div class="form-group checkbox-group">
        <label>
          <input type="checkbox" id="desktopShortcut" checked>
          Create desktop shortcut
        </label>
      </div>
    </main>

    <footer>
      <button id="cancelBtn" class="btn-secondary">Cancel</button>
      <button id="saveBtn" class="btn-primary" disabled>Save & Continue</button>
    </footer>

    <div id="loadingOverlay" class="overlay hidden">
      <div class="spinner"></div>
      <p>Saving configuration...</p>
    </div>
  </div>

  <script src="renderer.js"></script>
</body>
</html>
```

**renderer.js:**
```javascript
// Access IPC through preload script
const { validateApiKey, saveConfig, installService } = window.electron;

let apiKeyValid = false;

// Test API key
document.getElementById('testBtn').addEventListener('click', async () => {
  const apiKey = document.getElementById('apiKey').value.trim();
  const statusEl = document.getElementById('apiStatus');
  const saveBtn = document.getElementById('saveBtn');

  if (!apiKey) {
    statusEl.textContent = '⚠ Please enter an API key';
    statusEl.className = 'status-message error';
    return;
  }

  statusEl.textContent = '⏳ Testing API key...';
  statusEl.className = 'status-message info';

  try {
    const result = await validateApiKey(apiKey);

    if (result.valid) {
      statusEl.textContent = '✓ API key is valid!';
      statusEl.className = 'status-message success';
      apiKeyValid = true;
      saveBtn.disabled = false;
    } else {
      statusEl.textContent = `✗ Invalid API key: ${result.error}`;
      statusEl.className = 'status-message error';
      apiKeyValid = false;
      saveBtn.disabled = true;
    }
  } catch (error) {
    statusEl.textContent = `✗ Error: ${error.message}`;
    statusEl.className = 'status-message error';
    apiKeyValid = false;
    saveBtn.disabled = true;
  }
});

// Save configuration
document.getElementById('saveBtn').addEventListener('click', async () => {
  if (!apiKeyValid) {
    alert('Please validate your API key first');
    return;
  }

  const overlay = document.getElementById('loadingOverlay');
  overlay.classList.remove('hidden');

  const config = {
    apiKey: document.getElementById('apiKey').value.trim(),
    frontendPort: document.getElementById('frontendPort').value,
    backendPort: document.getElementById('backendPort').value,
    autoStart: document.getElementById('autoStart').checked,
    desktopShortcut: document.getElementById('desktopShortcut').checked
  };

  try {
    // Save .env file
    await saveConfig(config);

    // Install Windows Service if enabled
    if (config.autoStart) {
      await installService(true);
    }

    // Success - close window
    setTimeout(() => {
      window.close();
    }, 1000);

  } catch (error) {
    overlay.classList.add('hidden');
    alert(`Error saving configuration: ${error.message}`);
  }
});

// Cancel button
document.getElementById('cancelBtn').addEventListener('click', () => {
  if (confirm('Are you sure you want to cancel the configuration?')) {
    window.close();
  }
});
```

**api-validator.js:**
```javascript
const https = require('https');

async function testGeminiApiKey(apiKey) {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      contents: [{
        parts: [{ text: 'Hello' }]
      }]
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      },
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({ valid: true });
        } else {
          try {
            const error = JSON.parse(responseData);
            resolve({
              valid: false,
              error: error.error?.message || 'Invalid API key'
            });
          } catch (e) {
            resolve({ valid: false, error: 'Invalid response from API' });
          }
        }
      });
    });

    req.on('error', (error) => {
      resolve({ valid: false, error: error.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ valid: false, error: 'Request timeout' });
    });

    req.write(data);
    req.end();
  });
}

module.exports = { testGeminiApiKey };
```

**config-writer.js:**
```javascript
const fs = require('fs');
const path = require('path');

function createEnvFile(installPath, config) {
  const envContent = `# S2RTool Configuration
# Generated on ${new Date().toISOString()}

# Gemini API Key (Required)
GEMINI_API_KEY=${config.apiKey}

# Port Configuration
FRONTEND_PORT=${config.frontendPort}
BACKEND_PORT=${config.backendPort}

# Environment
DEBUG=False
LOG_LEVEL=INFO

# Docker Configuration
DOCKER_REGISTRY=docker.io
DOCKER_USERNAME=
`;

  const envPath = path.join(installPath, '.env');

  try {
    fs.writeFileSync(envPath, envContent, 'utf8');
    return { success: true, path: envPath };
  } catch (error) {
    throw new Error(`Failed to write .env file: ${error.message}`);
  }
}

module.exports = { createEnvFile };
```

---

### 3. System Tray Application (Electron)

**Directory:** `tray-app/`

**Features:**
- System tray icon with context menu
- Start/Stop/Restart services
- Open application in browser
- View logs
- Check for updates
- Auto-start with Windows

**File Structure:**
```
tray-app/
├── package.json
├── main.js                 # Electron main process
├── tray-icon.ico           # System tray icon
├── tray-icon-active.ico    # Active state icon
├── menu.js                 # Context menu
└── docker-manager.js       # Docker compose commands
```

**main.js:**
```javascript
const { app, Tray, Menu, shell, dialog, BrowserWindow } = require('electron');
const path = require('path');
const DockerManager = require('./docker-manager');

let tray = null;
let dockerManager = null;
let logsWindow = null;

const INSTALL_PATH = process.argv[2] || 'C:\\Program Files\\S2RTool';

app.whenReady().then(() => {
  dockerManager = new DockerManager(INSTALL_PATH);
  createTray();

  // Check service status every 5 seconds
  setInterval(updateTrayIcon, 5000);
});

function createTray() {
  const iconPath = path.join(__dirname, 'tray-icon.ico');
  tray = new Tray(iconPath);

  updateTrayMenu();

  tray.setToolTip('S2RTool');

  // Double-click to open application
  tray.on('double-click', () => {
    openApplication();
  });
}

function updateTrayMenu() {
  const isRunning = dockerManager.isRunning();

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'S2RTool v4.0',
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Open S2RTool',
      click: openApplication,
      enabled: isRunning
    },
    { type: 'separator' },
    {
      label: 'Start Services',
      click: () => dockerManager.start(),
      enabled: !isRunning
    },
    {
      label: 'Stop Services',
      click: () => dockerManager.stop(),
      enabled: isRunning
    },
    {
      label: 'Restart Services',
      click: () => dockerManager.restart(),
      enabled: isRunning
    },
    { type: 'separator' },
    {
      label: 'View Logs',
      click: showLogs
    },
    {
      label: 'Service Status',
      click: showStatus
    },
    { type: 'separator' },
    {
      label: 'Settings',
      click: openSettings
    },
    {
      label: 'Check for Updates',
      click: checkForUpdates
    },
    { type: 'separator' },
    {
      label: 'Exit',
      click: () => {
        if (isRunning) {
          const choice = dialog.showMessageBoxSync({
            type: 'question',
            buttons: ['Stop & Exit', 'Cancel'],
            title: 'Exit S2RTool',
            message: 'S2RTool services are running. Stop them before exiting?'
          });

          if (choice === 0) {
            dockerManager.stop();
            app.quit();
          }
        } else {
          app.quit();
        }
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
}

function updateTrayIcon() {
  const isRunning = dockerManager.isRunning();
  const iconPath = isRunning
    ? path.join(__dirname, 'tray-icon-active.ico')
    : path.join(__dirname, 'tray-icon.ico');

  tray.setImage(iconPath);
  updateTrayMenu();
}

function openApplication() {
  const fs = require('fs');
  const envPath = path.join(INSTALL_PATH, '.env');

  let port = 3001; // default

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/FRONTEND_PORT=(\d+)/);
    if (match) {
      port = match[1];
    }
  }

  shell.openExternal(`http://localhost:${port}`);
}

function showLogs() {
  if (logsWindow) {
    logsWindow.focus();
    return;
  }

  logsWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    title: 'S2RTool Logs',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Create logs viewer HTML
  const logsHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: 'Consolas', monospace;
          background: #1e1e1e;
          color: #d4d4d4;
          margin: 0;
          padding: 10px;
        }
        pre {
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        .error { color: #f48771; }
        .warning { color: #dcdcaa; }
        .info { color: #4ec9b0; }
      </style>
    </head>
    <body>
      <h2>S2RTool Service Logs</h2>
      <pre id="logs">Loading logs...</pre>
      <script>
        const { spawn } = require('child_process');
        const logsEl = document.getElementById('logs');

        const dockerCompose = spawn('docker-compose', [
          '-f', '${INSTALL_PATH.replace(/\\/g, '\\\\')}\\\\docker-compose.yaml',
          'logs', '-f', '--tail=100'
        ]);

        dockerCompose.stdout.on('data', (data) => {
          logsEl.textContent += data.toString();
          logsEl.scrollTop = logsEl.scrollHeight;
        });

        dockerCompose.stderr.on('data', (data) => {
          logsEl.innerHTML += '<span class="error">' + data.toString() + '</span>';
          logsEl.scrollTop = logsEl.scrollHeight;
        });
      </script>
    </body>
    </html>
  `;

  logsWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(logsHTML));

  logsWindow.on('closed', () => {
    logsWindow = null;
  });
}

function showStatus() {
  const status = dockerManager.getStatus();

  dialog.showMessageBox({
    type: 'info',
    title: 'Service Status',
    message: 'S2RTool Service Status',
    detail: status
  });
}

function openSettings() {
  const { exec } = require('child_process');
  const configWizardPath = path.join(INSTALL_PATH, 'config-wizard', 'S2RConfigWizard.exe');
  exec(`"${configWizardPath}"`);
}

async function checkForUpdates() {
  // TODO: Implement update checking
  dialog.showMessageBox({
    type: 'info',
    title: 'Check for Updates',
    message: 'You are using the latest version (v4.0)',
    detail: 'Update checking will be implemented in a future release.'
  });
}

app.on('window-all-closed', (e) => {
  // Prevent app from quitting when all windows are closed
  e.preventDefault();
});
```

**docker-manager.js:**
```javascript
const { exec, execSync } = require('child_process');
const path = require('path');

class DockerManager {
  constructor(installPath) {
    this.installPath = installPath;
    this.composePath = path.join(installPath, 'docker-compose.yaml');
  }

  isRunning() {
    try {
      const output = execSync(`docker-compose -f "${this.composePath}" ps -q`, {
        encoding: 'utf8',
        windowsHide: true
      });
      return output.trim().length > 0;
    } catch (error) {
      return false;
    }
  }

  start() {
    exec(`docker-compose -f "${this.composePath}" up -d`, (error, stdout, stderr) => {
      if (error) {
        console.error('Error starting services:', error);
      } else {
        console.log('Services started successfully');
      }
    });
  }

  stop() {
    exec(`docker-compose -f "${this.composePath}" down`, (error, stdout, stderr) => {
      if (error) {
        console.error('Error stopping services:', error);
      } else {
        console.log('Services stopped successfully');
      }
    });
  }

  restart() {
    exec(`docker-compose -f "${this.composePath}" restart`, (error, stdout, stderr) => {
      if (error) {
        console.error('Error restarting services:', error);
      } else {
        console.log('Services restarted successfully');
      }
    });
  }

  getStatus() {
    try {
      const output = execSync(`docker-compose -f "${this.composePath}" ps`, {
        encoding: 'utf8',
        windowsHide: true
      });
      return output;
    } catch (error) {
      return 'Error getting status: ' + error.message;
    }
  }
}

module.exports = DockerManager;
```

---

### 4. Windows Service Scripts

**File:** `scripts/install-service.bat`

```batch
@echo off
setlocal enabledelayedexpansion

echo ============================================
echo  S2RTool Windows Service Installation
echo ============================================
echo.

REM Get installation directory from argument or use default
set "INSTALL_DIR=%~1"
if "%INSTALL_DIR%"=="" set "INSTALL_DIR=C:\Program Files\S2RTool"

echo Install Directory: %INSTALL_DIR%
echo.

REM Find docker-compose executable
where docker-compose >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: docker-compose not found in PATH
    exit /b 1
)

for /f "delims=" %%i in ('where docker-compose') do set "DOCKER_COMPOSE_PATH=%%i"
echo Docker Compose: %DOCKER_COMPOSE_PATH%
echo.

REM Install NSSM service
echo Installing Windows Service...
"%INSTALL_DIR%\bin\nssm.exe" install S2RTool "%DOCKER_COMPOSE_PATH%" -f "%INSTALL_DIR%\docker-compose.yaml" up

REM Configure service
echo Configuring service parameters...
"%INSTALL_DIR%\bin\nssm.exe" set S2RTool AppDirectory "%INSTALL_DIR%"
"%INSTALL_DIR%\bin\nssm.exe" set S2RTool DisplayName "S2RTool Rendering Service"
"%INSTALL_DIR%\bin\nssm.exe" set S2RTool Description "S2RTool AI-powered architectural rendering service"
"%INSTALL_DIR%\bin\nssm.exe" set S2RTool Start SERVICE_AUTO_START
"%INSTALL_DIR%\bin\nssm.exe" set S2RTool AppStopMethodConsole 10000
"%INSTALL_DIR%\bin\nssm.exe" set S2RTool AppExit Default Restart
"%INSTALL_DIR%\bin\nssm.exe" set S2RTool AppRestartDelay 5000
"%INSTALL_DIR%\bin\nssm.exe" set S2RTool AppStdout "%INSTALL_DIR%\logs\service-stdout.log"
"%INSTALL_DIR%\bin\nssm.exe" set S2RTool AppStderr "%INSTALL_DIR%\logs\service-stderr.log"

REM Start service
echo Starting service...
net start S2RTool

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo  Service installed and started successfully
    echo ============================================
) else (
    echo.
    echo ERROR: Failed to start service
    exit /b 1
)

endlocal
```

**File:** `scripts/uninstall-service.bat`

```batch
@echo off
echo Stopping S2RTool service...
net stop S2RTool

echo Uninstalling service...
"%INSTALL_DIR%\bin\nssm.exe" remove S2RTool confirm

echo Service uninstalled successfully
```

**File:** `scripts/load-images.bat`

```batch
@echo off
setlocal enabledelayedexpansion

set "INSTALL_DIR=%~1"
if "%INSTALL_DIR%"=="" set "INSTALL_DIR=C:\Program Files\S2RTool"

echo ============================================
echo  Loading S2RTool Docker Images
echo ============================================
echo.

cd /d "%INSTALL_DIR%\images"

echo Decompressing backend image...
7z x -y s2rtool-backend-4.0.tar.gz
if %ERRORLEVEL% NEQ 0 exit /b 1

echo Loading backend image into Docker...
docker load -i s2rtool-backend-4.0.tar
if %ERRORLEVEL% NEQ 0 exit /b 1

echo.
echo Decompressing frontend image...
7z x -y s2rtool-frontend-4.0.tar.gz
if %ERRORLEVEL% NEQ 0 exit /b 1

echo Loading frontend image into Docker...
docker load -i s2rtool-frontend-4.0.tar
if %ERRORLEVEL% NEQ 0 exit /b 1

echo.
echo Tagging images as latest...
docker tag s2rtool-backend:4.0 s2rtool-backend:latest
docker tag s2rtool-frontend:4.0 s2rtool-frontend:latest

echo.
echo Cleaning up temporary files...
del /q s2rtool-backend-4.0.tar
del /q s2rtool-frontend-4.0.tar

echo.
echo ============================================
echo  Images loaded successfully
echo ============================================

endlocal
```

---

## Estimated Package Sizes

| Component | Uncompressed | Compressed (LZMA2 Ultra) |
|-----------|--------------|--------------------------|
| Rancher Desktop Installer | 600 MB | 400 MB |
| S2RTool Backend Image | 450 MB | 200 MB |
| S2RTool Frontend Image | 6 MB | 3 MB |
| Configuration Wizard | 120 MB | 50 MB |
| System Tray App | 120 MB | 50 MB |
| Scripts & NSSM | 5 MB | 2 MB |
| **TOTAL** | **~1.3 GB** | **~800 MB** |

---

## Installation Time Estimates

| Step | Duration | Notes |
|------|----------|-------|
| Extraction | 1-2 min | Depends on disk speed |
| Rancher Desktop install | 2-3 min | Silent installation |
| Docker image loading | 1-2 min | Decompression + docker load |
| Configuration wizard | 1-2 min | User input required |
| Service registration | 10-15 sec | NSSM installation |
| Service startup | 30-45 sec | Docker containers starting |
| **TOTAL** | **6-10 minutes** | SSD + good internet |

---

## Next Implementation Steps

1. ✅ **Architecture design completed**
2. ⏭️ **Create project structure** - Set up directories
3. ⏭️ **Develop Configuration Wizard** - Electron app
4. ⏭️ **Develop System Tray App** - Electron app
5. ⏭️ **Write Inno Setup script** - Main installer
6. ⏭️ **Export Docker images** - Prepare for packaging
7. ⏭️ **Test on clean Windows 10/11** - Virtual machines
8. ⏭️ **Create documentation** - User guide

---

**Document Status:** ✅ Complete - Ready for Implementation
**Last Updated:** 2025-12-23
