const https = require('https');

/**
 * Test if a Gemini API key is valid by making a test request
 * @param {string} apiKey - The Gemini API key to test
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
async function testGeminiApiKey(apiKey) {
  return new Promise((resolve) => {
    // Validate format first
    if (!apiKey || typeof apiKey !== 'string') {
      resolve({ valid: false, error: 'API key is required' });
      return;
    }

    if (apiKey.length < 30) {
      resolve({ valid: false, error: 'API key appears to be too short' });
      return;
    }

    // Prepare test request to Gemini API
    const testPrompt = 'Hello';

    const requestData = JSON.stringify({
      contents: [{
        parts: [{ text: testPrompt }]
      }]
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${encodeURIComponent(apiKey)}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData)
      },
      timeout: 15000  // 15 second timeout
    };

    console.log('Testing API key with Gemini API...');

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        console.log('API response status:', res.statusCode);

        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(responseData);
            if (parsed.candidates && parsed.candidates.length > 0) {
              console.log('API key validation successful');
              resolve({ valid: true });
            } else {
              console.log('Unexpected API response format');
              resolve({
                valid: false,
                error: 'Unexpected response from Gemini API'
              });
            }
          } catch (e) {
            console.error('Failed to parse API response:', e);
            resolve({
              valid: false,
              error: 'Invalid response format from Gemini API'
            });
          }
        } else if (res.statusCode === 400) {
          try {
            const error = JSON.parse(responseData);
            console.log('API key validation failed:', error);
            resolve({
              valid: false,
              error: error.error?.message || 'Invalid API key'
            });
          } catch (e) {
            resolve({
              valid: false,
              error: 'Invalid API key (400 Bad Request)'
            });
          }
        } else if (res.statusCode === 403) {
          resolve({
            valid: false,
            error: 'API key is invalid or does not have permission'
          });
        } else if (res.statusCode === 429) {
          resolve({
            valid: false,
            error: 'Rate limit exceeded. Please try again later.'
          });
        } else {
          try {
            const error = JSON.parse(responseData);
            resolve({
              valid: false,
              error: error.error?.message || `HTTP ${res.statusCode}: ${res.statusMessage}`
            });
          } catch (e) {
            resolve({
              valid: false,
              error: `HTTP ${res.statusCode}: ${res.statusMessage}`
            });
          }
        }
      });
    });

    req.on('error', (error) => {
      console.error('Request error:', error);

      if (error.code === 'ENOTFOUND') {
        resolve({
          valid: false,
          error: 'Cannot connect to Gemini API. Check your internet connection.'
        });
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
        resolve({
          valid: false,
          error: 'Request timeout. Please check your internet connection.'
        });
      } else {
        resolve({
          valid: false,
          error: `Network error: ${error.message}`
        });
      }
    });

    req.on('timeout', () => {
      console.error('Request timeout');
      req.destroy();
      resolve({
        valid: false,
        error: 'Request timeout. Please check your internet connection.'
      });
    });

    req.write(requestData);
    req.end();
  });
}

module.exports = {
  testGeminiApiKey
};
