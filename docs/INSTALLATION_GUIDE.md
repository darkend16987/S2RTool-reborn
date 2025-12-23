# S2RTool Installation Guide

**Version:** 4.0
**Platform:** Windows 10/11 (64-bit)
**Last Updated:** 2025-12-23

---

## 📋 Table of Contents

1. [System Requirements](#system-requirements)
2. [Before You Begin](#before-you-begin)
3. [Installation Steps](#installation-steps)
4. [First Launch](#first-launch)
5. [Using S2RTool](#using-s2rtool)
6. [Troubleshooting](#troubleshooting)
7. [Uninstallation](#uninstallation)

---

## 💻 System Requirements

### Minimum Requirements

- **Operating System:** Windows 10 Build 19041 or later, or Windows 11
- **Processor:** Intel Core i3 or AMD equivalent (2+ cores)
- **RAM:** 4GB (8GB recommended)
- **Disk Space:** 5GB free space
- **Internet:** Required for initial setup and usage

### Recommended Requirements

- **Operating System:** Windows 11
- **Processor:** Intel Core i5 or AMD Ryzen 5 (4+ cores)
- **RAM:** 8GB or more
- **Disk Space:** 10GB free space
- **Internet:** Broadband connection

### Additional Requirements

- **Administrator privileges** for installation
- **Gemini API Key** from Google AI Studio (free)
  - Get yours at: https://makersuite.google.com/app/apikey

---

## 📝 Before You Begin

### 1. Get Your Gemini API Key

S2RTool requires a Gemini API key to function.

**Steps to get API key:**

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key (starts with `AIzaSy...`)
5. Keep it safe for the installation process

**Note:** Gemini API has a free tier with generous usage limits.

### 2. Download the Installer

1. Go to the [S2RTool Releases](https://github.com/darkend16987/S2RTool-reborn/releases) page
2. Download the latest `S2RTool-Installer-vX.X.exe`
3. Save to your Downloads folder

**File size:** Approximately 800MB - 1.2GB

### 3. Verify Download (Optional but Recommended)

To ensure the installer hasn't been corrupted:

```powershell
# Open PowerShell and run:
Get-FileHash Downloads\S2RTool-Installer-v4.0.exe -Algorithm SHA256
```

Compare the hash with the one provided in the release notes.

---

## 🚀 Installation Steps

### Step 1: Run the Installer

1. **Locate the downloaded file:**
   - Usually in `C:\Users\YourName\Downloads\`

2. **Right-click** on `S2RTool-Installer-v4.0.exe`

3. **Select** "Run as administrator"
   - If prompted by User Account Control (UAC), click "Yes"

### Step 2: Follow the Installation Wizard

#### Welcome Screen

![Welcome Screen](images/install-welcome.png)

- Read the welcome message
- Click **Next** to continue

#### License Agreement

- Read the MIT License
- Check "I accept the agreement"
- Click **Next**

#### Installation Location

![Installation Location](images/install-location.png)

**Default location:** `C:\Program Files\S2RTool`

- You can change this by clicking **Browse**
- Recommended: Keep the default location
- Click **Next**

#### Installing Components

The installer will now:

1. ✅ Check system requirements
2. ✅ Install WSL2 (if not present)
   - **Note:** This may require a system reboot
   - If prompted to reboot, save your work and restart
   - Run the installer again after reboot
3. ✅ Install Rancher Desktop (Docker runtime)
   - This provides the container engine for S2RTool
   - Installation takes 2-3 minutes
4. ✅ Load S2RTool container images
   - Backend and frontend containers
   - Takes 1-2 minutes
5. ✅ Install system components
   - Configuration Wizard
   - System Tray Application
   - Helper scripts

**Total installation time:** 6-10 minutes (SSD + good internet)

---

## 🎯 First Launch

### Configuration Wizard

After installation completes, the **S2RTool Configuration Wizard** will launch automatically.

![Configuration Wizard](images/config-wizard.png)

#### 1. Enter Gemini API Key

**Required:**

- Paste your Gemini API key in the text field
- Click **Test API Key** to verify it works
- Wait for validation (takes 5-10 seconds)
- You should see: ✓ "API key is valid!"

**Troubleshooting:**
- If validation fails, check:
  - Key is copied correctly (no extra spaces)
  - Internet connection is working
  - Gemini API service is online

#### 2. Configure Ports (Optional)

**Default ports:**
- Frontend: `3001`
- Backend: `5001`

**When to change:**
- Only if another application is using these ports
- Ports must be between 1024-65535
- Frontend and backend ports must be different

#### 3. Startup Options

**Auto-start on Windows boot:**
- ✅ Checked (Recommended): S2RTool starts automatically when Windows boots
- ☐ Unchecked: You'll need to start S2RTool manually

**Create desktop shortcut:**
- ✅ Checked (Recommended): Quick access from desktop
- ☐ Unchecked: Access via Start Menu only

#### 4. Save Configuration

Click **Save & Continue**

The wizard will:
1. Save your configuration to `.env` file
2. Install Windows Service (if auto-start enabled)
3. Create desktop shortcut (if selected)

**Progress indicators** will show each step completing.

#### 5. Configuration Complete!

![Configuration Complete](images/config-complete.png)

- Click **Finish**
- S2RTool Tray Application will start automatically

---

## 🎨 Using S2RTool

### System Tray Icon

Look for the S2RTool icon in your system tray (bottom-right corner):

![System Tray](images/system-tray.png)

**Icon states:**
- **Gray icon:** Services stopped
- **Blue/Green icon:** Services running

### Opening S2RTool

**Method 1: Double-click desktop shortcut** (if created)

**Method 2: System Tray**
- Right-click the S2RTool icon
- Click **"Open S2RTool"**

**Method 3: Start Menu**
- Press Windows key
- Type "S2RTool"
- Click the result

**Method 4: Browser**
- Open any web browser
- Go to: `http://localhost:3001`

### System Tray Menu Options

Right-click the S2RTool tray icon to access:

```
S2RTool v4.0
Status: 🟢 Running
─────────────────────
🌐 Open S2RTool
─────────────────────
▶️ Start Services      (if stopped)
⏹️ Stop Services       (if running)
🔄 Restart Services
─────────────────────
📋 View Logs
📊 Service Status
🔍 Health Check
─────────────────────
⚙️ Settings
🔄 Check for Updates
📖 Documentation
─────────────────────
🚪 Exit
```

### Using the Application

Once S2RTool opens in your browser:

![S2RTool Interface](images/s2rtool-interface.png)

1. **Choose render mode:**
   - **Building Render:** Single structure visualization
   - **Planning Render:** Multi-lot site planning
   - **Interior Render:** Interior space visualization

2. **Upload your sketch:**
   - Click "Upload Sketch" or drag & drop
   - Supported formats: JPG, PNG
   - Max size: 10MB

3. **Describe your vision:**
   - Enter description in Vietnamese or English
   - Be specific about materials, style, colors
   - Example: "Nhà 2 tầng hiện đại, tường sơn trắng, mái ngói đỏ"

4. **Upload reference images (optional):**
   - Add reference photos for style guidance
   - Up to 5 images

5. **Generate:**
   - Click "Generate Render"
   - Processing takes 30-60 seconds
   - View and download results

### Managing Services

#### Starting Services

If services are stopped:
1. Right-click tray icon
2. Click **Start Services**
3. Wait 10-15 seconds for containers to start
4. Icon will change to indicate running state

#### Stopping Services

To stop S2RTool services:
1. Right-click tray icon
2. Click **Stop Services**
3. Confirm the action
4. Services will stop gracefully

#### Restarting Services

If experiencing issues:
1. Right-click tray icon
2. Click **Restart Services**
3. Wait for restart to complete

#### Viewing Logs

To troubleshoot issues:
1. Right-click tray icon
2. Click **View Logs**
3. A new window shows live container logs
4. Look for error messages in red

#### Health Check

To verify all components:
1. Right-click tray icon
2. Click **Health Check**
3. Review the health report
4. All checks should show ✓

---

## 🔧 Troubleshooting

### Common Issues

#### Issue 1: "Services won't start"

**Symptoms:**
- Tray icon stays gray
- "Start Services" fails
- Browser shows "Cannot connect"

**Solutions:**

1. **Check Docker is running:**
   ```
   Open PowerShell and run:
   docker ps
   ```
   - If error: Docker/Rancher Desktop not running
   - Solution: Start Rancher Desktop manually

2. **Run Health Check:**
   - System Tray → Health Check
   - Follow recommendations

3. **Check logs:**
   - System Tray → View Logs
   - Look for errors

4. **Restart Docker:**
   - Close Rancher Desktop
   - Reopen Rancher Desktop
   - Wait 1-2 minutes
   - Try starting S2RTool again

#### Issue 2: "API key not working"

**Symptoms:**
- Renders fail with API error
- "Invalid API key" messages

**Solutions:**

1. **Reconfigure API key:**
   - System Tray → Settings
   - Test API key again
   - Save

2. **Check API key is active:**
   - Visit https://makersuite.google.com/app/apikey
   - Verify key exists and is enabled

3. **Check internet connection:**
   - Gemini API requires internet
   - Test: Open google.com in browser

#### Issue 3: "Port already in use"

**Symptoms:**
- Services fail to start
- Error: "Port 3001 already in use"

**Solutions:**

1. **Find conflicting application:**
   ```powershell
   netstat -ano | findstr :3001
   ```

2. **Reconfigure ports:**
   - System Tray → Settings
   - Change frontend port (e.g., 3002)
   - Change backend port (e.g., 5002)
   - Save and restart

3. **Close conflicting application**

#### Issue 4: "Out of memory"

**Symptoms:**
- Slow performance
- Containers crash
- Renders fail

**Solutions:**

1. **Increase Docker memory:**
   - Open Rancher Desktop
   - Settings → Resources
   - Increase Memory to 4GB or more

2. **Close other applications**

3. **Check system RAM:**
   - Task Manager → Performance → Memory
   - Ensure at least 2GB available

#### Issue 5: "WSL2 installation failed"

**Symptoms:**
- Installer shows WSL2 error
- Installation cannot proceed

**Solutions:**

1. **Enable virtualization in BIOS:**
   - Restart computer
   - Enter BIOS (usually F2, Del, F10)
   - Enable "Virtualization Technology" or "VT-x"
   - Save and reboot

2. **Manual WSL2 installation:**
   ```powershell
   # Run PowerShell as Administrator:
   wsl --install

   # Restart computer
   # Run installer again
   ```

3. **Check Windows version:**
   - Press Win + R
   - Type: winver
   - Ensure Build 19041 or later

### Getting Help

If issues persist:

1. **Check documentation:**
   - System Tray → Documentation
   - Or visit: https://github.com/darkend16987/S2RTool-reborn

2. **View service status:**
   - System Tray → Service Status
   - Take screenshot of error

3. **Report issue:**
   - GitHub Issues: https://github.com/darkend16987/S2RTool-reborn/issues
   - Include:
     - Windows version
     - Error message/screenshot
     - Logs (from System Tray → View Logs)

---

## 🗑️ Uninstallation

### How to Uninstall

**Method 1: Start Menu**
1. Press Windows key
2. Type "Add or remove programs"
3. Find "S2RTool" in the list
4. Click **Uninstall**
5. Follow prompts

**Method 2: S2RTool Folder**
1. Open `C:\Program Files\S2RTool`
2. Run `unins000.exe`
3. Confirm uninstallation

### What Gets Removed

During uninstallation:
- ✅ S2RTool application files
- ✅ System Tray application
- ✅ Configuration Wizard
- ✅ Windows Service
- ✅ Desktop shortcuts
- ✅ Start Menu entries
- ✅ Registry entries

### What Gets Preserved

These items are NOT removed:
- ⚠️ Rancher Desktop (Docker runtime)
- ⚠️ Your reference images folder
- ⚠️ Configuration file (.env)

You can manually delete these if needed.

### Complete Cleanup

To fully remove everything:

1. **Uninstall S2RTool** (as above)

2. **Uninstall Rancher Desktop:**
   - Settings → Apps → Rancher Desktop → Uninstall

3. **Delete leftover files:**
   ```powershell
   # Open PowerShell as Administrator:
   Remove-Item "C:\Program Files\S2RTool" -Recurse -Force
   ```

4. **Remove Docker images:**
   ```powershell
   docker image rm s2rtool-backend:latest
   docker image rm s2rtool-frontend:latest
   ```

---

## 📚 Additional Resources

### Documentation

- **User Guide:** Full feature documentation
- **API Reference:** Gemini API integration details
- **Troubleshooting:** Extended troubleshooting guide

### Support

- **GitHub:** https://github.com/darkend16987/S2RTool-reborn
- **Issues:** Report bugs and request features
- **Discussions:** Community help and tips

### Updates

- **Check for updates:** System Tray → Check for Updates
- **Release notes:** See what's new in each version
- **Auto-update:** Coming in future release

---

## ✅ Quick Reference

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open S2RTool | Double-click desktop icon |
| System Tray Menu | Right-click tray icon |
| View Logs | Tray → Ctrl+L |
| Service Status | Tray → Ctrl+S |
| Settings | Tray → Ctrl+, |
| Exit | Tray → Ctrl+Q |

### Default Locations

| Item | Path |
|------|------|
| Installation | `C:\Program Files\S2RTool` |
| Configuration | `C:\Program Files\S2RTool\.env` |
| Logs | `C:\Program Files\S2RTool\logs` |
| References | `C:\Program Files\S2RTool\references` |

### Default Ports

| Service | Port |
|---------|------|
| Frontend | 3001 |
| Backend API | 5001 |

### URLs

| Purpose | URL |
|---------|-----|
| S2RTool App | http://localhost:3001 |
| API Health | http://localhost:5001/health |
| Get API Key | https://makersuite.google.com/app/apikey |

---

**Need help?** Visit our [GitHub repository](https://github.com/darkend16987/S2RTool-reborn) or check the [Troubleshooting Guide](#troubleshooting).

**Enjoy using S2RTool! 🎨**
