import { type ChatProvider, type ChatCompletionRequest } from "openclaw/plugin-sdk/chat";

const GROQ_API_BASE_URL = "https://api.groq.com/openai/v1";

// Default models supported by Groq
const DEFAULT_GROQ_MODEL = "mixtral-8x7b-32768";

export const groqChatProvider: ChatProvider = {
  id: "groq-api",
  capabilities: ["chat"],
  
  async chatCompletion(request: ChatCompletionRequest) {
    const { model = DEFAULT_GROQ_MODEL, messages, temperature, max_tokens, stream } = request;
    
    // Extract API key from request config or environment
    const apiKey = request.config?.apiKey || process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      throw new Error("GROQ_API_KEY environment variable or request.config.apiKey is required.");
    }
    
    const response = await fetch(`${GROQ_API_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: temperature !== undefined ? temperature : 0.7,
        max_tokens: max_tokens !== undefined ? max_tokens : 4096,
        stream: stream || false,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    if (stream) {
      // For streaming, return the ReadableStream directly
      return response.body;
    } else {
      // For non-streaming, parse and return the JSON response
      const data = await response.json();
      return data;
    }
  }
};