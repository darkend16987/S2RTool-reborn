const fs = require('fs');
const path = require('path');

/**
 * Create .env file with user configuration
 * @param {string} installPath - Installation directory path
 * @param {object} config - Configuration object
 * @param {string} config.apiKey - Gemini API key
 * @param {string} config.frontendPort - Frontend port number
 * @param {string} config.backendPort - Backend port number
 * @returns {Promise<{success: boolean, path: string}>}
 */
async function createEnvFile(installPath, config) {
  return new Promise((resolve, reject) => {
    try {
      const envPath = path.join(installPath, '.env');

      console.log('Creating .env file at:', envPath);
      console.log('Configuration:', {
        frontendPort: config.frontendPort,
        backendPort: config.backendPort,
        apiKeySet: !!config.apiKey
      });

      // Build .env content
      const timestamp = new Date().toISOString();
      const envContent = `# S2RTool Configuration
# Generated on ${timestamp}
# DO NOT share this file - it contains your API key!

# ============================================
# Required Configuration
# ============================================

# Gemini API Key (Required)
# Get your API key from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=${config.apiKey}

# ============================================
# Port Configuration
# ============================================

# Frontend Port (default: 3001)
# Access S2RTool at: http://localhost:${config.frontendPort}
FRONTEND_PORT=${config.frontendPort}

# Backend API Port (default: 5001)
# Internal API server port
BACKEND_PORT=${config.backendPort}

# ============================================
# Application Settings
# ============================================

# Debug Mode (True/False)
# Set to True for detailed logging
DEBUG=False

# Log Level (DEBUG/INFO/WARNING/ERROR)
# Controls the verbosity of logging
LOG_LEVEL=INFO

# ============================================
# Docker Configuration (Advanced)
# ============================================

# Docker Registry
# Leave empty for Docker Hub
DOCKER_REGISTRY=docker.io

# Docker Username
# Only needed if using private registry
DOCKER_USERNAME=

# ============================================
# Notes
# ============================================

# To reconfigure S2RTool:
# 1. Stop the service: net stop S2RTool
# 2. Edit this file
# 3. Start the service: net start S2RTool
#
# Or run the Configuration Wizard again:
# "${path.join(installPath, 'config-wizard', 'S2RConfigWizard.exe')}"

`;

      // Write file
      fs.writeFileSync(envPath, envContent, { encoding: 'utf8', mode: 0o600 });

      console.log('.env file created successfully');

      // Verify file was created
      if (fs.existsSync(envPath)) {
        const stats = fs.statSync(envPath);
        console.log('.env file size:', stats.size, 'bytes');

        resolve({
          success: true,
          path: envPath,
          size: stats.size
        });
      } else {
        reject(new Error('File was not created successfully'));
      }

    } catch (error) {
      console.error('Error creating .env file:', error);

      if (error.code === 'EACCES') {
        reject(new Error('Permission denied. Please run as Administrator.'));
      } else if (error.code === 'ENOENT') {
        reject(new Error('Installation directory not found: ' + installPath));
      } else {
        reject(new Error('Failed to create .env file: ' + error.message));
      }
    }
  });
}

/**
 * Validate port number
 * @param {string|number} port - Port number to validate
 * @returns {boolean}
 */
function isValidPort(port) {
  const portNum = parseInt(port, 10);
  return !isNaN(portNum) && portNum >= 1024 && portNum <= 65535;
}

/**
 * Check if port is already in use
 * @param {number} port - Port number to check
 * @returns {Promise<boolean>}
 */
async function isPortInUse(port) {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();

    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);  // Port is in use
      } else {
        resolve(false);
      }
    });

    server.once('listening', () => {
      server.close();
      resolve(false);  // Port is available
    });

    server.listen(port);
  });
}

module.exports = {
  createEnvFile,
  isValidPort,
  isPortInUse
};
