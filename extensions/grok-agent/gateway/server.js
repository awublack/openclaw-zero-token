// grok-agent/gateway/server.js
// Local HTTP server to proxy requests to Grok (X) via authenticated browser session

const http = require('http');
const https = require('https');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');

// Path to stored Grok session cookies (from browser)
const SESSION_FILE = path.join(
  process.env.HOME || '/home/awu',
  '.openclaw-upstream-state',
  'grok-session.json'
);

// Grok API endpoint (Web interface)
const GROK_API_BASE = 'https://x.com/api/grok';

// Load session data (cookies, auth tokens)
function loadSessionData() {
  try {
    const data = fs.readFileSync(SESSION_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('❌ Grok session file not found:', SESSION_FILE);
    console.error('Please log in to Grok via browser and save session to:', SESSION_FILE);
    return null;
  }
}

// Create HTTP proxy server
const server = http.createServer(async (req, res) => {
  // Only allow POST to /v1/grok-completions
  if (req.method !== 'POST' || req.url !== '/v1/grok-completions') {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }

  // Read request body
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    const session = loadSessionData();
    if (!session) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Session not authenticated. Please log in to Grok via browser.'
      }));
      return;
    }

    try {
      // Forward request to Grok's web API
      const grokReq = https.request({
        hostname: 'x.com',
        port: 443,
        path: '/api/grok',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': session.cookie || '',
          'Authorization': session.bearer || '',
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      }, grokRes => {
        // Forward headers
        res.writeHead(grokRes.statusCode, grokRes.headers);

        // Stream response
        grokRes.on('data', chunk => res.write(chunk));
        grokRes.on('end', () => res.end());
      });

      // Forward request body
      grokReq.write(body);
      grokReq.end();

    } catch (err) {
      console.error('❌ Proxy error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal proxy error' }));
    }
  });
});

// Start server on port 3002 (same as groq-agent for consistency)
const PORT = 3002;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ Grok Agent Gateway listening on http://127.0.0.1:${PORT}/v1/grok-completions`);
  console.log(`💡 Session file: ${SESSION_FILE}`);
});

// Export for use in OpenClaw agent startup
module.exports = { server, PORT };