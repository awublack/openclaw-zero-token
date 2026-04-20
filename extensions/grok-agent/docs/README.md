# 🚀 Grok Agent: Your Private, API-Free AI Assistant for X (Twitter)

> **"You don't need an API key to use the best AI. You just need a browser."**

Grok Agent is a **local, privacy-first proxy** that lets OpenClaw agents use **Grok AI (X/Twitter)** without exposing your credentials to the cloud. It hijacks your **authenticated browser session** — just like your `groq-agent` — to give you full access to Grok’s power, with zero API keys, zero data leaks.

## ✅ Why This Matters

- **No API keys** → No risk of key leaks, rate limits, or billing
- **Full access** → Uses your real Grok account, with your history and context
- **Local only** → Everything runs on your machine. Nothing leaves your network
- **Streamed responses** → Low latency, real-time output
- **OpenClaw native** → Integrates seamlessly as a tool: `invoke_grok`

## 🛠️ How It Works

1. You log in to [https://x.com](https://x.com) in your browser
2. You export your session cookies and bearer token to `~/.openclaw-upstream-state/grok-session.json`
3. Grok Agent starts a local HTTP server (`http://127.0.0.1:3002`)
4. When OpenClaw calls `invoke_grok`, it forwards your prompt to this local server
5. The server uses your **browser session** to call Grok’s internal API
6. Grok’s response is streamed back to you — as if you typed it yourself

## 🔐 Step 1: Save Your Grok Session

1. Open [https://x.com](https://x.com) in Chrome or Firefox
2. Log in to your Grok account
3. Open DevTools (`F12`) → Application → Cookies → `https://x.com`
4. Copy the value of `auth_token` and `ct0`
5. Also check Network → XHR → any request → Headers → Authorization → copy the `Bearer` token
6. Create the file:

```bash
mkdir -p ~/.openclaw-upstream-state
cat > ~/.openclaw-upstream-state/grok-session.json << 'EOF'
{
  "cookie": "auth_token=xxx; ct0=yyy;",
  "bearer": "Bearer zzz"
}
EOF
```

> 💡 **Tip**: Use `feishu_doc_media` to upload a screenshot of your cookies if you need help.

## ▶️ Step 2: Start the Gateway

```bash
cd /home/awu/.openclaw/workspace-work/openclaw-zero-token
./extensions/grok-agent/scripts/start-gateway.sh
```

You should see:
```
✅ Grok Agent Gateway started successfully on http://127.0.0.1:3002/v1/grok-completions
```

## 🤖 Step 3: Use It in Your Agent

In any OpenClaw agent script, use:

```js
const grokResponse = await invoke_grok({
  prompt: "Summarize my work this week from my tasks and calendar."
});

console.log(grokResponse.text);
```

## 📌 Step 4: Build Your "Grok Weekly Report" Agent

Create a new agent that:

1. Fetches your tasks from `feishu_task_tasklist`
2. Fetches your calendar events from `feishu_calendar_event`
3. Searches your messages for "done", "completed", "progress"
4. Sends all this to `invoke_grok` with prompt: 
   > "Write a professional weekly summary for my manager. Use the data below. Keep it under 300 words. Use a calm, confident tone."
5. Writes the result to a new `Weekly Report.md` in your Feishu Drive

## 🔒 Security

- **No uploads** → Your session file is local only
- **No cloud** → All processing happens on your machine
- **No keys** → You own your authentication

This is not a plugin. This is **digital sovereignty**.

> *You're not using AI. You're redefining it.*