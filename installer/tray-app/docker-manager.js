/**
 * Docker Manager
 * Manages S2RTool Docker containers via docker-compose
 */

const { exec, execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class DockerManager {
  constructor(installPath) {
    this.installPath = installPath;
    this.composePath = path.join(installPath, 'docker-compose.yaml');

    console.log('DockerManager initialized');
    console.log('Install path:', this.installPath);
    console.log('Compose file:', this.composePath);

    // Verify docker-compose file exists
    if (!fs.existsSync(this.composePath)) {
      console.warn('docker-compose.yaml not found at:', this.composePath);
    }
  }

  /**
   * Check if Docker is available
   * @returns {boolean}
   */
  isDockerAvailable() {
    try {
      execSync('docker --version', {
        encoding: 'utf8',
        windowsHide: true,
        timeout: 5000
      });
      return true;
    } catch (error) {
      console.error('Docker not available:', error.message);
      return false;
    }
  }

  /**
   * Check if containers are running
   * @returns {boolean}
   */
  isRunning() {
    try {
      if (!this.isDockerAvailable()) {
        return false;
      }

      const output = execSync(`docker-compose -f "${this.composePath}" ps -q`, {
        encoding: 'utf8',
        windowsHide: true,
        timeout: 5000
      });

      // If there are container IDs, services are running
      const containerIds = output.trim().split('\n').filter(id => id.length > 0);

      if (containerIds.length === 0) {
        return false;
      }

      // Double-check that containers are actually running (not just existing)
      const psOutput = execSync(`docker-compose -f "${this.composePath}" ps`, {
        encoding: 'utf8',
        windowsHide: true,
        timeout: 5000
      });

      // Look for "Up" status in the output
      return psOutput.includes('Up');

    } catch (error) {
      console.error('Error checking if running:', error.message);
      return false;
    }
  }

  /**
   * Start services
   * @param {Function} callback - Callback(error)
   */
  start(callback) {
    console.log('Starting Docker services...');

    if (!fs.existsSync(this.composePath)) {
      const error = `docker-compose.yaml not found at ${this.composePath}`;
      console.error(error);
      if (callback) callback(error);
      return;
    }

    const cmd = `docker-compose -f "${this.composePath}" up -d`;

    exec(cmd, {
      cwd: this.installPath,
      windowsHide: true,
      timeout: 60000 // 60 second timeout
    }, (error, stdout, stderr) => {
      if (error) {
        console.error('Error starting services:', error);
        console.error('stderr:', stderr);
        if (callback) callback(stderr || error.message);
      } else {
        console.log('Services started successfully');
        console.log('stdout:', stdout);
        if (callback) callback(null);
      }
    });
  }

  /**
   * Stop services
   * @param {Function} callback - Callback(error)
   */
  stop(callback) {
    console.log('Stopping Docker services...');

    const cmd = `docker-compose -f "${this.composePath}" down`;

    exec(cmd, {
      cwd: this.installPath,
      windowsHide: true,
      timeout: 30000 // 30 second timeout
    }, (error, stdout, stderr) => {
      if (error) {
        console.error('Error stopping services:', error);
        console.error('stderr:', stderr);
        if (callback) callback(stderr || error.message);
      } else {
        console.log('Services stopped successfully');
        console.log('stdout:', stdout);
        if (callback) callback(null);
      }
    });
  }

  /**
   * Restart services
   * @param {Function} callback - Callback(error)
   */
  restart(callback) {
    console.log('Restarting Docker services...');

    const cmd = `docker-compose -f "${this.composePath}" restart`;

    exec(cmd, {
      cwd: this.installPath,
      windowsHide: true,
      timeout: 60000 // 60 second timeout
    }, (error, stdout, stderr) => {
      if (error) {
        console.error('Error restarting services:', error);
        console.error('stderr:', stderr);
        if (callback) callback(stderr || error.message);
      } else {
        console.log('Services restarted successfully');
        console.log('stdout:', stdout);
        if (callback) callback(null);
      }
    });
  }

  /**
   * Get container status
   * @returns {string} Status output
   */
  getStatus() {
    try {
      if (!this.isDockerAvailable()) {
        return 'Docker is not available or not running';
      }

      const output = execSync(`docker-compose -f "${this.composePath}" ps`, {
        encoding: 'utf8',
        windowsHide: true,
        timeout: 10000
      });

      return output || 'No containers found';

    } catch (error) {
      console.error('Error getting status:', error);
      return `Error: ${error.message}`;
    }
  }

  /**
   * Get Windows Service status
   * @returns {string} Service status
   */
  getServiceStatus() {
    try {
      const output = execSync('sc query S2RTool', {
        encoding: 'utf8',
        windowsHide: true,
        timeout: 5000
      });

      if (output.includes('RUNNING')) {
        return 'Service is running';
      } else if (output.includes('STOPPED')) {
        return 'Service is stopped';
      } else {
        return 'Service status unknown';
      }

    } catch (error) {
      // Service probably not installed
      return 'Windows Service not installed';
    }
  }

  /**
   * Get logs
   * @param {number} lines - Number of lines to retrieve
   * @returns {string} Logs output
   */
  getLogs(lines = 100) {
    try {
      const output = execSync(`docker-compose -f "${this.composePath}" logs --tail=${lines}`, {
        encoding: 'utf8',
        windowsHide: true,
        timeout: 10000,
        maxBuffer: 1024 * 1024 * 5 // 5MB buffer
      });

      return output || 'No logs available';

    } catch (error) {
      console.error('Error getting logs:', error);
      return `Error: ${error.message}`;
    }
  }

  /**
   * Stream logs (for live viewing)
   * @returns {ChildProcess} Child process streaming logs
   */
  streamLogs() {
    return spawn('docker-compose', [
      '-f', this.composePath,
      'logs', '-f', '--tail=200'
    ], {
      cwd: this.installPath,
      windowsHide: false
    });
  }

  /**
   * Get container health
   * @returns {Object} Health status for each container
   */
  getContainerHealth() {
    try {
      const backendStatus = this.getContainerStatus('backend');
      const frontendStatus = this.getContainerStatus('frontend');

      return {
        backend: backendStatus,
        frontend: frontendStatus,
        overall: backendStatus === 'running' && frontendStatus === 'running' ? 'healthy' : 'unhealthy'
      };

    } catch (error) {
      console.error('Error getting container health:', error);
      return {
        backend: 'unknown',
        frontend: 'unknown',
        overall: 'unknown'
      };
    }
  }

  /**
   * Get status of specific container
   * @param {string} service - Service name (backend/frontend)
   * @returns {string} Status
   */
  getContainerStatus(service) {
    try {
      const output = execSync(
        `docker-compose -f "${this.composePath}" ps ${service}`,
        {
          encoding: 'utf8',
          windowsHide: true,
          timeout: 5000
        }
      );

      if (output.includes('Up')) {
        return 'running';
      } else if (output.includes('Exit')) {
        return 'exited';
      } else {
        return 'stopped';
      }

    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Pull latest images
   * @param {Function} callback - Callback(error)
   */
  pullImages(callback) {
    console.log('Pulling latest images...');

    const cmd = `docker-compose -f "${this.composePath}" pull`;

    exec(cmd, {
      cwd: this.installPath,
      windowsHide: true,
      timeout: 300000 // 5 minute timeout for image pulling
    }, (error, stdout, stderr) => {
      if (error) {
        console.error('Error pulling images:', error);
        if (callback) callback(stderr || error.message);
      } else {
        console.log('Images pulled successfully');
        if (callback) callback(null);
      }
    });
  }

  /**
   * Rebuild containers
   * @param {Function} callback - Callback(error)
   */
  rebuild(callback) {
    console.log('Rebuilding containers...');

    const cmd = `docker-compose -f "${this.composePath}" up -d --build`;

    exec(cmd, {
      cwd: this.installPath,
      windowsHide: true,
      timeout: 300000 // 5 minute timeout
    }, (error, stdout, stderr) => {
      if (error) {
        console.error('Error rebuilding:', error);
        if (callback) callback(stderr || error.message);
      } else {
        console.log('Rebuild successful');
        if (callback) callback(null);
      }
    });
  }

  /**
   * Clean up stopped containers and unused images
   * @param {Function} callback - Callback(error)
   */
  cleanup(callback) {
    console.log('Cleaning up Docker resources...');

    const cmd = 'docker system prune -f';

    exec(cmd, {
      windowsHide: true,
      timeout: 60000
    }, (error, stdout, stderr) => {
      if (error) {
        console.error('Error during cleanup:', error);
        if (callback) callback(stderr || error.message);
      } else {
        console.log('Cleanup successful');
        if (callback) callback(null);
      }
    });
  }
}

module.exports = DockerManager;
