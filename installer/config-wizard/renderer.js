/**
 * S2RTool Configuration Wizard - Renderer Process
 * Handles UI logic, validation, and IPC communication
 */

// ============================================
// State Management
// ============================================

const state = {
  installPath: '',
  apiKeyValid: false,
  isSubmitting: false,
  existingConfig: null
};

// ============================================
// DOM Elements
// ============================================

const elements = {
  // Installation info
  installPath: document.getElementById('installPath'),

  // API Key
  apiKey: document.getElementById('apiKey'),
  toggleApiKeyBtn: document.getElementById('toggleApiKeyBtn'),
  testApiKeyBtn: document.getElementById('testApiKeyBtn'),
  apiKeyStatus: document.getElementById('apiKeyStatus'),
  getApiKeyLink: document.getElementById('getApiKeyLink'),

  // Ports
  frontendPort: document.getElementById('frontendPort'),
  backendPort: document.getElementById('backendPort'),
  frontendPortPreview: document.getElementById('frontendPortPreview'),

  // Options
  autoStart: document.getElementById('autoStart'),
  desktopShortcut: document.getElementById('desktopShortcut'),

  // Buttons
  cancelBtn: document.getElementById('cancelBtn'),
  saveBtn: document.getElementById('saveBtn'),

  // Overlay
  loadingOverlay: document.getElementById('loadingOverlay'),
  loadingTitle: document.getElementById('loadingTitle'),
  loadingMessage: document.getElementById('loadingMessage'),
  step1: document.getElementById('step1'),
  step2: document.getElementById('step2'),
  step3: document.getElementById('step3')
};

// ============================================
// Initialization
// ============================================

async function init() {
  console.log('Initializing Configuration Wizard...');

  // Load installation path
  try {
    state.installPath = await window.electron.getInstallPath();
    elements.installPath.textContent = state.installPath;
    console.log('Installation path:', state.installPath);
  } catch (error) {
    console.error('Failed to get installation path:', error);
    elements.installPath.textContent = 'Error loading path';
  }

  // Check for existing configuration
  try {
    const result = await window.electron.checkExistingConfig();
    if (result.exists) {
      state.existingConfig = result.config;
      console.log('Existing configuration found:', result.config);

      // Pre-fill form
      if (result.config.frontendPort) {
        elements.frontendPort.value = result.config.frontendPort;
        updateFrontendPortPreview();
      }
      if (result.config.backendPort) {
        elements.backendPort.value = result.config.backendPort;
      }

      // Show info message
      if (result.config.apiKeySet) {
        showStatus(
          'info',
          'Existing configuration detected. You can update your settings below.'
        );
      } else {
        showStatus(
          'warning',
          'Configuration file exists but API key is not set. Please configure your Gemini API key.'
        );
      }
    }
  } catch (error) {
    console.error('Failed to check existing config:', error);
  }

  // Attach event listeners
  attachEventListeners();

  console.log('Configuration Wizard initialized');
}

// ============================================
// Event Listeners
// ============================================

function attachEventListeners() {
  // API Key toggle visibility
  elements.toggleApiKeyBtn.addEventListener('click', toggleApiKeyVisibility);

  // Test API Key
  elements.testApiKeyBtn.addEventListener('click', testApiKey);

  // API Key input - enable test button
  elements.apiKey.addEventListener('input', () => {
    const hasValue = elements.apiKey.value.trim().length > 0;
    elements.testApiKeyBtn.disabled = !hasValue;

    // Reset validation status when user types
    if (state.apiKeyValid) {
      state.apiKeyValid = false;
      elements.saveBtn.disabled = true;
      hideStatus();
    }
  });

  // Port inputs
  elements.frontendPort.addEventListener('input', updateFrontendPortPreview);
  elements.frontendPort.addEventListener('change', validatePort);
  elements.backendPort.addEventListener('change', validatePort);

  // Get API Key link
  elements.getApiKeyLink.addEventListener('click', (e) => {
    e.preventDefault();
    require('electron').shell.openExternal('https://makersuite.google.com/app/apikey');
  });

  // Cancel button
  elements.cancelBtn.addEventListener('click', handleCancel);

  // Save button
  elements.saveBtn.addEventListener('click', handleSave);

  // Enter key on API key input
  elements.apiKey.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && elements.apiKey.value.trim()) {
      testApiKey();
    }
  });
}

// ============================================
// API Key Functions
// ============================================

function toggleApiKeyVisibility() {
  const type = elements.apiKey.type === 'password' ? 'text' : 'password';
  elements.apiKey.type = type;

  // Update button icon (optional - could swap SVG)
  const svg = elements.toggleApiKeyBtn.querySelector('svg');
  if (type === 'text') {
    // Eye-off icon (when showing password)
    svg.innerHTML = '<path d="M2 10s3-7 8-7 8 7 8 7-3 7-8 7-8-7-8-7z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M1 1l18 18" stroke="currentColor" stroke-width="2"/>';
  } else {
    // Eye icon (when hiding password)
    svg.innerHTML = '<path d="M10 4C5 4 1.73 7.11 1 10c.73 2.89 4 6 9 6s8.27-3.11 9-6c-.73-2.89-4-6-9-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>';
  }
}

async function testApiKey() {
  const apiKey = elements.apiKey.value.trim();

  if (!apiKey) {
    showStatus('error', 'Please enter an API key');
    return;
  }

  // Show loading state
  elements.testApiKeyBtn.classList.add('loading');
  elements.testApiKeyBtn.disabled = true;
  showStatus('info', 'Testing API key... This may take a few seconds.');

  try {
    console.log('Testing API key...');
    const result = await window.electron.validateApiKey(apiKey);

    console.log('Validation result:', result);

    if (result.valid) {
      state.apiKeyValid = true;
      showStatus('success', '✓ API key is valid! You can now save the configuration.');
      elements.saveBtn.disabled = false;
    } else {
      state.apiKeyValid = false;
      showStatus('error', `✗ ${result.error || 'Invalid API key'}`);
      elements.saveBtn.disabled = true;
    }
  } catch (error) {
    console.error('API key validation error:', error);
    state.apiKeyValid = false;
    showStatus('error', `✗ Error: ${error.message}`);
    elements.saveBtn.disabled = true;
  } finally {
    elements.testApiKeyBtn.classList.remove('loading');
    elements.testApiKeyBtn.disabled = false;
  }
}

// ============================================
// Port Functions
// ============================================

function updateFrontendPortPreview() {
  const port = elements.frontendPort.value || '3001';
  elements.frontendPortPreview.textContent = port;
}

function validatePort(event) {
  const input = event.target;
  const port = parseInt(input.value, 10);

  if (isNaN(port) || port < 1024 || port > 65535) {
    input.setCustomValidity('Port must be between 1024 and 65535');
    input.reportValidity();
    return false;
  }

  // Check if frontend and backend ports are the same
  const frontendPort = parseInt(elements.frontendPort.value, 10);
  const backendPort = parseInt(elements.backendPort.value, 10);

  if (frontendPort === backendPort) {
    input.setCustomValidity('Frontend and Backend ports must be different');
    input.reportValidity();
    return false;
  }

  input.setCustomValidity('');
  return true;
}

// ============================================
// Status Messages
// ============================================

function showStatus(type, message) {
  elements.apiKeyStatus.textContent = message;
  elements.apiKeyStatus.className = `status-message ${type}`;
  elements.apiKeyStatus.classList.remove('hidden');
}

function hideStatus() {
  elements.apiKeyStatus.classList.add('hidden');
}

// ============================================
// Save Configuration
// ============================================

async function handleSave() {
  if (state.isSubmitting) {
    return; // Prevent double submission
  }

  // Validate API key
  if (!state.apiKeyValid) {
    await window.electron.showError(
      'Validation Required',
      'Please test your API key before saving the configuration.'
    );
    return;
  }

  // Validate ports
  const frontendPort = parseInt(elements.frontendPort.value, 10);
  const backendPort = parseInt(elements.backendPort.value, 10);

  if (isNaN(frontendPort) || frontendPort < 1024 || frontendPort > 65535) {
    await window.electron.showError('Invalid Port', 'Frontend port must be between 1024 and 65535');
    return;
  }

  if (isNaN(backendPort) || backendPort < 1024 || backendPort > 65535) {
    await window.electron.showError('Invalid Port', 'Backend port must be between 1024 and 65535');
    return;
  }

  if (frontendPort === backendPort) {
    await window.electron.showError('Port Conflict', 'Frontend and Backend ports must be different');
    return;
  }

  // Collect configuration
  const config = {
    apiKey: elements.apiKey.value.trim(),
    frontendPort: frontendPort.toString(),
    backendPort: backendPort.toString(),
    autoStart: elements.autoStart.checked,
    desktopShortcut: elements.desktopShortcut.checked
  };

  console.log('Saving configuration:', { ...config, apiKey: '[REDACTED]' });

  // Show loading overlay
  state.isSubmitting = true;
  showLoadingOverlay();

  try {
    // Step 1: Save configuration file
    updateProgressStep(1, 'active', '⏳');
    console.log('Step 1: Saving .env file...');

    await window.electron.saveConfig(config);

    updateProgressStep(1, 'completed', '✓');
    console.log('Step 1: Configuration saved successfully');

    // Step 2: Install Windows Service (if requested)
    updateProgressStep(2, 'active', '⏳');
    console.log('Step 2: Installing Windows Service...');

    try {
      const serviceResult = await window.electron.installService(config.autoStart);

      if (serviceResult.skipped) {
        console.log('Step 2: Service installation skipped (not requested)');
        updateProgressStep(2, 'completed', '○');
      } else if (serviceResult.success) {
        console.log('Step 2: Service installed successfully');
        updateProgressStep(2, 'completed', '✓');
      }
    } catch (serviceError) {
      console.error('Step 2: Service installation failed:', serviceError);
      updateProgressStep(2, 'error', '✗');
      // Continue anyway - service is optional
    }

    // Step 3: Create desktop shortcut (if requested)
    updateProgressStep(3, 'active', '⏳');
    console.log('Step 3: Creating shortcuts...');

    try {
      const shortcutResult = await window.electron.createShortcut(config);

      if (shortcutResult.skipped) {
        console.log('Step 3: Shortcut creation skipped (not requested)');
        updateProgressStep(3, 'completed', '○');
      } else if (shortcutResult.success) {
        console.log('Step 3: Shortcut created successfully');
        updateProgressStep(3, 'completed', '✓');
      } else {
        console.warn('Step 3: Shortcut creation failed (non-critical)');
        updateProgressStep(3, 'completed', '⚠');
      }
    } catch (shortcutError) {
      console.error('Step 3: Shortcut creation error:', shortcutError);
      updateProgressStep(3, 'completed', '⚠');
      // Continue anyway - shortcut is optional
    }

    // Success!
    console.log('Configuration completed successfully');

    elements.loadingTitle.textContent = '✓ Configuration Complete!';
    elements.loadingMessage.textContent = 'S2RTool has been configured successfully.';

    // Wait a moment to show success, then close
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Close the wizard
    await window.electron.closeWindow();

  } catch (error) {
    console.error('Error during configuration:', error);

    hideLoadingOverlay();
    state.isSubmitting = false;

    await window.electron.showError(
      'Configuration Error',
      `Failed to save configuration: ${error.message}\n\nPlease try again or contact support.`
    );
  }
}

// ============================================
// Cancel
// ============================================

async function handleCancel() {
  const confirmed = confirm(
    'Are you sure you want to cancel the configuration?\n\n' +
    'S2RTool will not work properly without a valid configuration.'
  );

  if (confirmed) {
    await window.electron.closeWindow();
  }
}

// ============================================
// Loading Overlay
// ============================================

function showLoadingOverlay() {
  elements.loadingOverlay.classList.remove('hidden');
  elements.loadingTitle.textContent = 'Saving Configuration...';
  elements.loadingMessage.textContent = 'Please wait while we configure S2RTool';

  // Reset all steps
  updateProgressStep(1, '', '⏳');
  updateProgressStep(2, '', '⏳');
  updateProgressStep(3, '', '⏳');
}

function hideLoadingOverlay() {
  elements.loadingOverlay.classList.add('hidden');
}

function updateProgressStep(stepNumber, status, icon) {
  const step = elements[`step${stepNumber}`];
  if (!step) return;

  // Remove all status classes
  step.classList.remove('active', 'completed', 'error');

  // Add new status class
  if (status) {
    step.classList.add(status);
  }

  // Update icon
  const iconElement = step.querySelector('.step-icon');
  if (iconElement && icon) {
    iconElement.textContent = icon;
  }
}

// ============================================
// Error Handler
// ============================================

window.addEventListener('error', (event) => {
  console.error('Unhandled error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// ============================================
// Start Application
// ============================================

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('Renderer script loaded');
