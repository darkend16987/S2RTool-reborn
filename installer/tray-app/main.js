/**
 * S2RTool System Tray Application
 * Provides quick access to S2RTool controls from Windows system tray
 */

const { app, Tray, Menu, shell, dialog, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const DockerManager = require('./docker-manager');

// ============================================
// Configuration
// ============================================

// Get installation path from command line or use default
const INSTALL_PATH = process.argv[2] || (process.platform === 'win32' ? 'C:\\Program Files\\S2RTool' : '/opt/S2RTool');
const ENV_PATH = path.join(INSTALL_PATH, '.env');

let tray = null;
let dockerManager = null;
let logsWindow = null;

// Default ports (will be loaded from .env if available)
let frontendPort = 3001;
let backendPort = 5001;

// ============================================
// Application Lifecycle
// ============================================

app.whenReady().then(() => {
  console.log('S2RTool Tray App starting...');
  console.log('Installation path:', INSTALL_PATH);

  // Load configuration
  loadConfiguration();

  // Initialize Docker manager
  dockerManager = new DockerManager(INSTALL_PATH);

  // Create system tray
  createTray();

  // Check service status periodically
  setInterval(updateTrayIcon, 5000);

  // Initial status update
  updateTrayIcon();

  console.log('S2RTool Tray App started successfully');
});

// Don't quit when all windows are closed (stay in tray)
app.on('window-all-closed', (e) => {
  e.preventDefault();
});

// Clean up on quit
app.on('before-quit', () => {
  if (tray) {
    tray.destroy();
  }
});

// ============================================
// Configuration Loading
// ============================================

function loadConfiguration() {
  try {
    if (fs.existsSync(ENV_PATH)) {
      const envContent = fs.readFileSync(ENV_PATH, 'utf8');
      const lines = envContent.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, value] = trimmed.split('=');
          if (key && value) {
            if (key.trim() === 'FRONTEND_PORT') {
              frontendPort = parseInt(value.trim(), 10) || 3001;
            }
            if (key.trim() === 'BACKEND_PORT') {
              backendPort = parseInt(value.trim(), 10) || 5001;
            }
          }
        }
      }

      console.log('Configuration loaded:', { frontendPort, backendPort });
    } else {
      console.warn('.env file not found, using default ports');
    }
  } catch (error) {
    console.error('Error loading configuration:', error);
  }
}

// ============================================
// System Tray
// ============================================

function createTray() {
  const iconPath = getIconPath('inactive');
  tray = new Tray(iconPath);

  tray.setToolTip('S2RTool');

  // Double-click to open application
  tray.on('double-click', () => {
    openApplication();
  });

  // Build context menu
  updateTrayMenu();

  console.log('System tray created');
}

function getIconPath(state) {
  // For now, use same icon (in production, you'd have different icons)
  const iconName = state === 'active' ? 'tray-icon-active.ico' : 'tray-icon.ico';
  const iconPath = path.join(__dirname, 'assets', iconName);

  // Fallback to basic icon if custom icons don't exist
  if (!fs.existsSync(iconPath)) {
    // Create a simple icon path for development
    return path.join(__dirname, 'assets', 'tray-icon.ico');
  }

  return iconPath;
}

function updateTrayIcon() {
  if (!dockerManager || !tray) return;

  const isRunning = dockerManager.isRunning();
  const iconPath = getIconPath(isRunning ? 'active' : 'inactive');

  try {
    tray.setImage(iconPath);
    tray.setToolTip(isRunning ? 'S2RTool - Running' : 'S2RTool - Stopped');
  } catch (error) {
    // Ignore icon errors in development
  }

  updateTrayMenu();
}

function updateTrayMenu() {
  const isRunning = dockerManager ? dockerManager.isRunning() : false;
  const serviceStatus = dockerManager ? dockerManager.getServiceStatus() : 'Unknown';

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'S2RTool v4.0',
      enabled: false,
      icon: createMenuIcon('info')
    },
    {
      label: `Status: ${isRunning ? '🟢 Running' : '🔴 Stopped'}`,
      enabled: false
    },
    { type: 'separator' },
    {
      label: '🌐 Open S2RTool',
      click: openApplication,
      enabled: isRunning,
      accelerator: 'Ctrl+O'
    },
    { type: 'separator' },
    {
      label: '▶️ Start Services',
      click: startServices,
      enabled: !isRunning
    },
    {
      label: '⏹️ Stop Services',
      click: stopServices,
      enabled: isRunning
    },
    {
      label: '🔄 Restart Services',
      click: restartServices,
      enabled: isRunning
    },
    { type: 'separator' },
    {
      label: '📋 View Logs',
      click: showLogs,
      accelerator: 'Ctrl+L'
    },
    {
      label: '📊 Service Status',
      click: showStatus,
      accelerator: 'Ctrl+S'
    },
    {
      label: '🔍 Health Check',
      click: runHealthCheck
    },
    { type: 'separator' },
    {
      label: '⚙️ Settings',
      click: openSettings,
      accelerator: 'Ctrl+,'
    },
    {
      label: '🔄 Check for Updates',
      click: checkForUpdates
    },
    {
      label: '📖 Documentation',
      click: openDocumentation
    },
    { type: 'separator' },
    {
      label: '🚪 Exit',
      click: handleExit,
      accelerator: 'Ctrl+Q'
    }
  ]);

  tray.setContextMenu(contextMenu);
}

function createMenuIcon(type) {
  // Placeholder for menu icons
  // In production, you'd return NativeImage for each icon type
  return null;
}

// ============================================
// Menu Actions
// ============================================

function openApplication() {
  const url = `http://localhost:${frontendPort}`;
  console.log('Opening S2RTool at:', url);

  shell.openExternal(url).catch((error) => {
    dialog.showErrorBox(
      'Cannot Open Application',
      `Failed to open S2RTool in browser.\n\nURL: ${url}\n\nError: ${error.message}\n\nPlease open the URL manually in your browser.`
    );
  });
}

function startServices() {
  console.log('Starting services...');

  dockerManager.start((error) => {
    if (error) {
      dialog.showErrorBox(
        'Failed to Start Services',
        `Error: ${error}\n\nPlease check:\n1. Docker is running\n2. Check logs for details\n3. Try restarting Docker`
      );
    } else {
      setTimeout(() => {
        if (dockerManager.isRunning()) {
          dialog.showMessageBox({
            type: 'info',
            title: 'Services Started',
            message: 'S2RTool services started successfully',
            detail: `You can now access S2RTool at:\nhttp://localhost:${frontendPort}`,
            buttons: ['Open S2RTool', 'OK']
          }).then((result) => {
            if (result.response === 0) {
              openApplication();
            }
          });
        }
      }, 3000); // Wait 3s for containers to be ready
    }
  });
}

function stopServices() {
  const choice = dialog.showMessageBoxSync({
    type: 'question',
    title: 'Stop Services',
    message: 'Are you sure you want to stop S2RTool services?',
    detail: 'This will stop all running containers.',
    buttons: ['Stop Services', 'Cancel'],
    defaultId: 1,
    cancelId: 1
  });

  if (choice === 0) {
    console.log('Stopping services...');

    dockerManager.stop((error) => {
      if (error) {
        dialog.showErrorBox('Failed to Stop Services', `Error: ${error}`);
      } else {
        dialog.showMessageBox({
          type: 'info',
          title: 'Services Stopped',
          message: 'S2RTool services stopped successfully'
        });
      }
    });
  }
}

function restartServices() {
  console.log('Restarting services...');

  dockerManager.restart((error) => {
    if (error) {
      dialog.showErrorBox('Failed to Restart Services', `Error: ${error}`);
    } else {
      setTimeout(() => {
        dialog.showMessageBox({
          type: 'info',
          title: 'Services Restarted',
          message: 'S2RTool services restarted successfully',
          detail: `Services should be available in a few seconds.`
        });
      }, 2000);
    }
  });
}

function showLogs() {
  if (logsWindow && !logsWindow.isDestroyed()) {
    logsWindow.focus();
    return;
  }

  logsWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    title: 'S2RTool Logs',
    icon: getIconPath('inactive'),
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
      <meta charset="UTF-8">
      <title>S2RTool Logs</title>
      <style>
        body {
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          background: #1e1e1e;
          color: #d4d4d4;
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
        .header {
          background: #2d2d30;
          padding: 10px 15px;
          border-bottom: 1px solid #3e3e42;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .header h2 {
          margin: 0;
          font-size: 14px;
          font-weight: normal;
        }
        .header button {
          background: #0e639c;
          color: white;
          border: none;
          padding: 5px 15px;
          cursor: pointer;
          border-radius: 3px;
          font-size: 12px;
        }
        .header button:hover {
          background: #1177bb;
        }
        .logs-container {
          height: calc(100vh - 50px);
          overflow-y: auto;
          padding: 15px;
        }
        pre {
          white-space: pre-wrap;
          word-wrap: break-word;
          margin: 0;
          font-size: 12px;
          line-height: 1.5;
        }
        .error { color: #f48771; }
        .warning { color: #dcdcaa; }
        .info { color: #4ec9b0; }
        .success { color: #608b4e; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>📋 S2RTool Service Logs</h2>
        <button onclick="clearLogs()">Clear</button>
      </div>
      <div class="logs-container">
        <pre id="logs">Loading logs...</pre>
      </div>
      <script>
        const { spawn } = require('child_process');
        const logsEl = document.getElementById('logs');
        let logsContent = '';

        const dockerCompose = spawn('docker-compose', [
          '-f', '${INSTALL_PATH.replace(/\\/g, '\\\\')}\\\\docker-compose.yaml',
          'logs', '-f', '--tail=200'
        ]);

        dockerCompose.stdout.on('data', (data) => {
          const text = data.toString();
          logsContent += text;
          logsEl.textContent = logsContent;
          logsEl.parentElement.scrollTop = logsEl.parentElement.scrollHeight;
        });

        dockerCompose.stderr.on('data', (data) => {
          const text = data.toString();
          logsContent += text;
          logsEl.innerHTML += '<span class="error">' + text + '</span>';
          logsEl.parentElement.scrollTop = logsEl.parentElement.scrollHeight;
        });

        function clearLogs() {
          logsContent = '';
          logsEl.textContent = '';
        }
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
  const serviceStatus = dockerManager.getServiceStatus();

  dialog.showMessageBox({
    type: 'info',
    title: 'S2RTool Service Status',
    message: 'Service Status Information',
    detail: `Docker Containers:\n${status}\n\nWindows Service:\n${serviceStatus}`,
    buttons: ['OK']
  });
}

function runHealthCheck() {
  console.log('Running health check...');

  const healthCheckScript = path.join(INSTALL_PATH, 'scripts', 'health-check.bat');

  if (!fs.existsSync(healthCheckScript)) {
    dialog.showErrorBox(
      'Health Check Not Found',
      `Health check script not found at:\n${healthCheckScript}`
    );
    return;
  }

  const { spawn } = require('child_process');
  const healthCheck = spawn('cmd.exe', ['/c', healthCheckScript, INSTALL_PATH], {
    cwd: INSTALL_PATH
  });

  let output = '';

  healthCheck.stdout.on('data', (data) => {
    output += data.toString();
  });

  healthCheck.stderr.on('data', (data) => {
    output += data.toString();
  });

  healthCheck.on('close', (code) => {
    const message = code === 0 ? 'All Systems Operational' :
                    code === 2 ? 'Operational with Warnings' :
                    'Critical Issues Detected';

    dialog.showMessageBox({
      type: code === 0 ? 'info' : code === 2 ? 'warning' : 'error',
      title: 'Health Check Results',
      message: message,
      detail: output,
      buttons: ['OK']
    });
  });
}

function openSettings() {
  const configWizardPath = path.join(INSTALL_PATH, 'config-wizard', 'S2RConfigWizard.exe');

  if (fs.existsSync(configWizardPath)) {
    const { exec } = require('child_process');
    exec(`"${configWizardPath}" "${INSTALL_PATH}"`, (error) => {
      if (error) {
        dialog.showErrorBox('Cannot Open Settings', `Error: ${error.message}`);
      }
    });
  } else {
    dialog.showErrorBox(
      'Configuration Wizard Not Found',
      `Configuration wizard not found at:\n${configWizardPath}\n\nYou can edit .env file manually.`
    );
  }
}

function checkForUpdates() {
  // Placeholder for update checking
  dialog.showMessageBox({
    type: 'info',
    title: 'Check for Updates',
    message: 'You are using the latest version',
    detail: 'S2RTool v4.0\n\nUpdate checking will be implemented in a future release.',
    buttons: ['OK']
  });
}

function openDocumentation() {
  shell.openExternal('https://github.com/darkend16987/S2RTool-reborn#readme');
}

function handleExit() {
  const isRunning = dockerManager.isRunning();

  if (isRunning) {
    const choice = dialog.showMessageBoxSync({
      type: 'question',
      title: 'Exit S2RTool',
      message: 'S2RTool services are running',
      detail: 'Do you want to stop the services before exiting?',
      buttons: ['Stop & Exit', 'Exit Only', 'Cancel'],
      defaultId: 2,
      cancelId: 2
    });

    if (choice === 0) {
      // Stop and exit
      dockerManager.stop(() => {
        app.quit();
      });
    } else if (choice === 1) {
      // Exit only
      app.quit();
    }
    // choice === 2: Cancel, do nothing
  } else {
    app.quit();
  }
}

// ============================================
// Error Handling
// ============================================

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  // Don't crash the tray app
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
});

console.log('Main script loaded');
