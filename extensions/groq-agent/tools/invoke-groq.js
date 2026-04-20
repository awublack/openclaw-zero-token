// groq-agent/tools/invoke-groq.js
// Tool to invoke Groq AI from within OpenClaw agents

const axios = require('axios');

// Local gateway endpoint (must match server.js)
const GROQ_GATEWAY_URL = 'http://127.0.0.1:3002/v1/groq-completions';

module.exports = {
  name: 'invoke_groq',
  description: 'Invoke Groq AI via authenticated browser session. Use for generating summaries, reports, etc.',
  parameters: {
    type: 'object',
    required: ['prompt'],
    properties: {
      prompt: {
        type: 'string',
        description: 'The prompt to send to Groq AI'
      }
    }
  },
  handler: async ({ prompt }) => {
    try {
      const response = await axios.post(GROQ_GATEWAY_URL, {
        model: 'mixtral-8x7b-32768', // or your preferred model
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
            error: 'Groq proxy error: ' + err.message,
            success: false
          });
        });
      });
    } catch (err) {
      return {
        error: 'Failed to reach Groq gateway: ' + err.message,
        success: false
      };
    }
  }
};