import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { groqChatProvider } from "./chat-provider.js";

export default definePluginEntry({
  id: "groq-api",
  name: "Groq API Chat Provider",
  description: "Official Groq API integration for chat completions. Requires API key.",
  register(api) {
    api.registerChatProvider(groqChatProvider);
  }
});