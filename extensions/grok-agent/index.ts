import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

// Grok Agent - Local Gateway Proxy for X (Twitter) Grok AI
// This plugin enables use of Grok without API keys by hijacking browser sessions.

export default definePluginEntry({
  id: "grok-agent",
  name: "Grok Agent (Browser Session Proxy)",
  description: "Proxy for Grok AI via authenticated browser session. No API key required.",
  register(api) {
    // Register a local HTTP server to proxy requests to Grok's web API
    api.registerHttpServer({
      path: "/v1/grok-completions",
      handler: async (req, res) => {
        // This will be implemented in the next step
        // It will:
        // 1. Read browser cookies from ~/.openclaw-upstream-state/grok-session.json
        // 2. Forward request to https://x.com/api/grok
        // 3. Stream response back as SSE
        
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Grok Agent: Local gateway not yet configured. See docs.');
      }
    });

    // Register a tool to allow agents to invoke Grok
    api.registerTool({
      name: "invoke_grok",
      description: "Invoke Grok AI via browser session. Use for generating summaries, reports, etc.",
      parameters: {
        type: "object",
        required: ["prompt"],
        properties: {
          prompt: {
            type: "string",
            description: "The prompt to send to Grok AI"
          }
        }
      },
      handler: async ({ prompt }) => {
        // This will call the local gateway
        // In production, this will use fetch to http://127.0.0.1:3002/v1/grok-completions
        return { error: "Grok Agent gateway not yet started. Check configuration." };
      }
    });
  }
});