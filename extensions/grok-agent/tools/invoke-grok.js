// grok-agent/tools/invoke-grok.js
// Tool to invoke Grok AI from within OpenClaw agents

const axios = require('axios');

// Local gateway endpoint (must match server.js)
const GROK_GATEWAY_URL = 'http://127.0.0.1:3002/v1/grok-completions';

module.exports = {
  name: 'invoke_grok',
  description: 'Invoke Grok AI via authenticated browser session. Use for generating summaries, reports, etc.',
  parameters: {
    type: 'object',
    required: ['prompt'],
    properties: {
      prompt: {
        type: 'string',
        description: 'The prompt to send to Grok AI'
      }
    }
  },
  handler: async ({ prompt }) => {
    try {
      const response = await axios.post(GROK_GATEWAY_URL, {
        model: 'grok',
        messages: [{ role: 'user', content: prompt }],
        stream: true
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        responseType: 'stream'
      });

      // Stream response back as plain text (OpenClaw handles SSE)
      let fullResponse = '';
      return new Promise((resolve, reject) => {
        response.data.on('data', (chunk) => {
          const text = chunk.toString();
          fullResponse += text;
          // In OpenClaw, we just return the full stream at end
        });

        response.data.on('end', () => {
          resolve({
            text: fullResponse,
            success: true
          });
        });

        response.data.on('error', (err) => {
          reject({
            error: 'Grok proxy error: ' + err.message,
            success: false
          });
        });
      });
    } catch (err) {
      return {
        error: 'Failed to reach Grok gateway: ' + err.message,
        success: false
      };
    }
  }
};