const { contextBridge, ipcRenderer } = require('electron');

/**
 * Expose protected methods that allow the renderer process
 * to use IPC without exposing the entire ipcRenderer
 */
contextBridge.exposeInMainWorld('electron', {
  /**
   * Get installation path
   */
  getInstallPath: () => ipcRenderer.invoke('get-install-path'),

  /**
   * Validate Gemini API key
   * @param {string} apiKey - The API key to validate
   * @returns {Promise<{valid: boolean, error?: string}>}
   */
  validateApiKey: (apiKey) => ipcRenderer.invoke('validate-api-key', apiKey),

  /**
   * Check if configuration already exists
   * @returns {Promise<{exists: boolean, config?: object}>}
   */
  checkExistingConfig: () => ipcRenderer.invoke('check-existing-config'),

  /**
   * Save configuration to .env file
   * @param {object} config - Configuration object
   * @returns {Promise<{success: boolean, path: string}>}
   */
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),

  /**
   * Install Windows Service for auto-start
   * @param {boolean} autoStart - Whether to install the service
   * @returns {Promise<{success: boolean, output?: string}>}
   */
  installService: (autoStart) => ipcRenderer.invoke('install-service', autoStart),

  /**
   * Create desktop shortcut
   * @param {object} config - Configuration object
   * @returns {Promise<{success: boolean, path?: string}>}
   */
  createShortcut: (config) => ipcRenderer.invoke('create-shortcut', config),

  /**
   * Show error dialog
   * @param {string} title - Dialog title
   * @param {string} message - Error message
   */
  showError: (title, message) => ipcRenderer.invoke('show-error', title, message),

  /**
   * Show success dialog
   * @param {string} title - Dialog title
   * @param {string} message - Success message
   */
  showSuccess: (title, message) => ipcRenderer.invoke('show-success', title, message),

  /**
   * Close the configuration wizard window
   */
  closeWindow: () => ipcRenderer.invoke('close-window')
});

// Log that preload script has loaded
console.log('Preload script loaded successfully');
