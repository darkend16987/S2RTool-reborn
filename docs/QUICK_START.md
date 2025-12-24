# S2RTool Quick Start Guide

**Get started with S2RTool in 5 minutes! 🚀**

---

## Step 1: Get Gemini API Key (2 minutes)

1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key (starts with `AIzaSy...`)

---

## Step 2: Download & Install (3 minutes)

1. **Download installer:**
   - Visit: https://github.com/darkend16987/S2RTool-reborn/releases
   - Download: `S2RTool-Installer-v4.0.exe`

2. **Run installer:**
   - Right-click → "Run as administrator"
   - Click "Yes" on UAC prompt
   - Follow the wizard (click Next → Next → Next)

3. **Wait for installation:**
   - WSL2 installation (if needed)
   - Docker runtime installation
   - Container images loading
   - **Time:** 6-10 minutes total

---

## Step 3: Configure (1 minute)

The **Configuration Wizard** opens automatically:

1. **Paste your Gemini API key**
2. **Click "Test API Key"** → Wait for ✓
3. **Leave ports as default** (3001, 5001)
4. **Check both boxes:**
   - ✅ Auto-start on Windows boot
   - ✅ Create desktop shortcut
5. **Click "Save & Continue"**

Done! Configuration saved.

---

## Step 4: Start Using S2RTool

### Open S2RTool:

**Method 1:** Double-click desktop icon (if created)

**Method 2:** Go to http://localhost:3001 in any browser

**Method 3:** Right-click tray icon (bottom-right) → "Open S2RTool"

---

## First Render

1. **Choose mode:** Building Render

2. **Upload sketch:**
   - Click "Upload Sketch"
   - Select your architectural sketch (JPG/PNG)

3. **Describe your vision:**
   ```
   Nhà 2 tầng hiện đại, mặt tiền kính, tường sơn trắng,
   vườn xanh phía trước
   ```

4. **Click "Generate Render"**

5. **Wait ~30-60 seconds**

6. **Download your result!**

---

## System Tray Control

![Tray Icon](images/tray-icon-small.png) Look for S2RTool icon in system tray (bottom-right)

### Quick Actions:

- **Double-click:** Open S2RTool
- **Right-click → Start/Stop/Restart:** Control services
- **Right-click → View Logs:** Troubleshoot issues
- **Right-click → Settings:** Change configuration

---

## Common Issues

### Services won't start?

**Solution:**
1. Right-click tray icon
2. Click "Health Check"
3. Follow recommendations

**Or:**
- Open Rancher Desktop manually
- Wait 1-2 minutes
- Right-click tray icon → Start Services

### API key not working?

1. Tray icon → Settings
2. Test API key again
3. If still failing: Get a new key from Google AI Studio

### Can't access http://localhost:3001?

1. Check services are running (tray icon should be blue/green)
2. Try: http://127.0.0.1:3001
3. Check logs: Tray → View Logs

---

## Tips & Tricks

### Better Results

- ✅ Use clear, detailed sketches
- ✅ Add specific descriptions (materials, colors, style)
- ✅ Upload reference images
- ❌ Avoid blurry or unclear sketches

### Performance

- Keep other apps closed for faster renders
- Ensure stable internet connection
- 8GB+ RAM recommended for best performance

### Reference Images

Build your library:
1. Download architectural photos you like
2. Tray icon → Open installation folder
3. Place images in `references/` folder
4. Use them in renders for style consistency

---

## Need Help?

**Documentation:**
- Full guide: `C:\Program Files\S2RTool\INSTALLATION_GUIDE.md`
- Or: https://github.com/darkend16987/S2RTool-reborn

**Troubleshooting:**
- Tray icon → View Logs (check for errors)
- Tray icon → Health Check (diagnose issues)

**Support:**
- GitHub Issues: https://github.com/darkend16987/S2RTool-reborn/issues

---

## Default Settings

| Setting | Value |
|---------|-------|
| Frontend URL | http://localhost:3001 |
| Backend API | http://localhost:5001 |
| Installation | C:\Program Files\S2RTool |
| Auto-start | Enabled |

---

## Uninstall

Windows Settings → Apps → S2RTool → Uninstall

Or: Run `C:\Program Files\S2RTool\unins000.exe`

---

**That's it! You're ready to create amazing architectural renders! 🎨**

**Happy rendering!**
