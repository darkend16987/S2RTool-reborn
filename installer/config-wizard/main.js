const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

let mainWindow;

// Get installation path from command line argument
// Usage: S2RConfigWizard.exe "C:\Program Files\S2RTool"
const installPath = process.argv[2] || (process.platform === 'win32' ? 'C:\\Program Files\\S2RTool' : '/opt/S2RTool');

console.log('Configuration Wizard started');
console.log('Installation path:', installPath);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 650,
    height: 750,
    resizable: false,
    minimizable: true,
    maximizable: false,
    frame: true,
    title: 'S2RTool Configuration Wizard',
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    backgroundColor: '#ffffff',
    show: false  // Don't show until ready
  });

  mainWindow.loadFile('index.html');

  // Hide menu bar
  mainWindow.setMenuBarVisibility(false);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Development: Open DevTools
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App ready
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  app.quit();
});

// ============================================
// IPC Handlers
// ============================================

/**
 * Get installation path
 */
ipcMain.handle('get-install-path', async () => {
  return installPath;
});

/**
 * Validate Gemini API Key
 */
ipcMain.handle('validate-api-key', async (event, apiKey) => {
  console.log('Validating API key...');
  const validator = require('./api-validator');

  try {
    const result = await validator.testGeminiApiKey(apiKey);
    console.log('Validation result:', result);
    return result;
  } catch (error) {
    console.error('Validation error:', error);
    return {
      valid: false,
      error: error.message || 'Unexpected error during validation'
    };
  }
});

/**
 * Check if .env file already exists
 */
ipcMain.handle('check-existing-config', async () => {
  const fs = require('fs');
  const envPath = path.join(installPath, '.env');

  console.log('Checking for existing config:', envPath);

  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      const config = {};

      // Parse .env file
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, value] = trimmed.split('=');
          if (key && value) {
            config[key.trim()] = value.trim();
          }
        }
      }

      console.log('Existing config found:', Object.keys(config));

      return {
        exists: true,
        config: {
          frontendPort: config.FRONTEND_PORT || '3001',
          backendPort: config.BACKEND_PORT || '5001',
          apiKeySet: !!config.GEMINI_API_KEY && config.GEMINI_API_KEY !== 'your_gemini_api_key_here'
        }
      };
    } catch (error) {
      console.error('Error reading existing config:', error);
      return { exists: false };
    }
  }

  return { exists: false };
});

/**
 * Save configuration
 */
ipcMain.handle('save-config', async (event, config) => {
  console.log('Saving configuration...');
  const writer = require('./config-writer');

  try {
    const result = await writer.createEnvFile(installPath, config);
    console.log('Configuration saved:', result);
    return result;
  } catch (error) {
    console.error('Error saving configuration:', error);
    throw error;
  }
});

/**
 * Install Windows Service
 */
ipcMain.handle('install-service', async (event, autoStart) => {
  if (!autoStart) {
    console.log('Auto-start not requested, skipping service installation');
    return { success: true, skipped: true };
  }

  console.log('Installing Windows Service...');
  const { spawn } = require('child_process');
  const serviceScriptPath = path.join(installPath, 'scripts', 'install-service.bat');

  return new Promise((resolve, reject) => {
    const process = spawn(serviceScriptPath, [installPath], {
      cwd: installPath,
      shell: true,
      windowsHide: false  // Show console for debugging
    });

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log('Service install output:', data.toString());
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error('Service install error:', data.toString());
    });

    process.on('close', (code) => {
      if (code === 0) {
        console.log('Service installed successfully');
        resolve({ success: true, output: stdout });
      } else {
        console.error('Service installation failed with code:', code);
        reject(new Error(`Service installation failed: ${stderr || stdout}`));
      }
    });

    process.on('error', (error) => {
      console.error('Failed to start service installation:', error);
      reject(error);
    });
  });
});

/**
 * Create desktop shortcut
 */
ipcMain.handle('create-shortcut', async (event, config) => {
  if (!config.desktopShortcut) {
    console.log('Desktop shortcut not requested');
    return { success: true, skipped: true };
  }

  console.log('Creating desktop shortcut...');

  try {
    // Use PowerShell to create shortcut
    const { execSync } = require('child_process');
    const desktopPath = path.join(require('os').homedir(), 'Desktop');
    const shortcutPath = path.join(desktopPath, 'S2RTool.lnk');
    const targetUrl = `http://localhost:${config.frontendPort}`;

    // PowerShell script to create URL shortcut
    const psScript = `
      $WshShell = New-Object -ComObject WScript.Shell
      $Shortcut = $WshShell.CreateShortcut("${shortcutPath}")
      $Shortcut.TargetPath = "${targetUrl}"
      $Shortcut.Save()
    `;

    execSync(`powershell -Command "${psScript.replace(/"/g, '\\"')}"`, {
      windowsHide: true
    });

    console.log('Desktop shortcut created:', shortcutPath);
    return { success: true, path: shortcutPath };

  } catch (error) {
    console.error('Error creating desktop shortcut:', error);
    // Non-critical error, don't fail the whole process
    return { success: false, error: error.message };
  }
});

/**
 * Show error dialog
 */
ipcMain.handle('show-error', async (event, title, message) => {
  dialog.showErrorBox(title, message);
});

/**
 * Show success dialog
 */
ipcMain.handle('show-success', async (event, title, message) => {
  dialog.showMessageBoxSync(mainWindow, {
    type: 'info',
    title: title,
    message: message,
    buttons: ['OK']
  });
});

/**
 * Close window
 */
ipcMain.handle('close-window', async () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
});
