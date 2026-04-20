import { type ToolDefinition } from "openclaw/plugin-sdk/tool";

export const invokeGroqTool: ToolDefinition = {
  name: "invoke_groq",
  description: "Invoke Groq AI via official API. Requires GROQ_API_KEY environment variable or config.apiKey.",
  parameters: {
    type: "object",
    required: ["prompt"],
    properties: {
      prompt: {
        type: "string",
        description: "The prompt to send to Groq AI"
      },
      model: {
        type: "string",
        description: "Model to use (e.g., mixtral-8x7b-32768, llama3-70b-8192). Default: mixtral-8x7b-32768",
        default: "mixtral-8x7b-32768"
      },
      temperature: {
        type: "number",
        description: "Sampling temperature (0.0-1.0). Default: 0.7",
        default: 0.7
      },
      max_tokens: {
        type: "number",
        description: "Maximum tokens to generate. Default: 4096",
        default: 4096
      }
    }
  },
  handler: async ({ prompt, model, temperature, max_tokens }) => {
    // This tool uses the registered groq-api chat provider internally
    // It's a convenience wrapper for agents to use without knowing the provider details
    
    const result = await invokeChatProvider({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature,
      max_tokens
    });
    
    if (typeof result === "string") {
      return { text: result };
    } else if (result.choices && result.choices.length > 0) {
      return { text: result.choices[0].message.content };
    } else {
      return { error: "Unexpected response format from Groq API" };
    }
  }
};

// Helper function to call the registered chat provider
async function invokeChatProvider(request: {
  model?: string;
  messages: { role: string; content: string }[];
  temperature?: number;
  max_tokens?: number;
}) {
  // This would normally be injected by OpenClaw's plugin system
  // For now, we simulate it by calling the provider directly
  const { groqChatProvider } = await import("./chat-provider.js");
  
  const response = await groqChatProvider.chatCompletion(request);
  
  if (response instanceof ReadableStream) {
    // Handle streaming
    const chunks: string[] = [];
    const reader = response.getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(new TextDecoder().decode(value));
    }
    
    // Parse SSE stream and extract final text
    let finalText = "";
    for (const chunk of chunks) {
      if (chunk.startsWith("data: ")) {
        const json = JSON.parse(chunk.substring(6));
        if (json.choices && json.choices[0].delta?.content) {
          finalText += json.choices[0].delta.content;
        }
      }
    }
    return finalText;
  } else {
    // Non-streaming response
    return response.choices[0].message.content;
  }
}