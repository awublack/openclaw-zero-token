import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

// Groq Agent - Local Gateway Proxy for Groq AI
// This plugin enables use of Groq without API keys by hijacking browser sessions.

export default definePluginEntry({
  id: "groq-agent",
  name: "Groq Agent (Browser Session Proxy)",
  description: "Proxy for Groq AI via authenticated browser session. No API key required.",
  register(api) {
    // Register a local HTTP server to proxy requests to Groq's web API
    api.registerHttpServer({
      path: "/v1/groq-completions",
      handler: async (req, res) => {
        // This will be implemented in the next step
        // It will:
        // 1. Read browser cookies from ~/.openclaw-upstream-state/groq-session.json
        // 2. Forward request to https://groq.com/api/groq
        // 3. Stream response back as SSE
        
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Groq Agent: Local gateway not yet configured. See docs.');
      }
    });

    // Register a tool to allow agents to invoke Groq
    api.registerTool({
      name: "invoke_groq",
      description: "Invoke Groq AI via browser session. Use for generating summaries, reports, etc.",
      parameters: {
        type: "object",
        required: ["prompt"],
        properties: {
          prompt: {
            type: "string",
            description: "The prompt to send to Groq AI"
          }
        }
      },
      handler: async ({ prompt }) => {
        // This will call the local gateway
        // In production, this will use fetch to http://127.0.0.1:3002/v1/groq-completions
        return { error: "Groq Agent gateway not yet started. Check configuration." };
      }
    });
  }
});