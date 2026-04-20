# 🚀 Groq API Provider: Official Groq Integration for OpenClaw

> **"Use the real Groq API, with your key, your rules."**

This is the **official Groq API plugin** for OpenClaw, following the exact pattern of `linuxhsj/openclaw-zero-token`. It integrates directly with Groq's public API endpoint (`https://api.groq.com/openai/v1`) using your **personal API key**.

## ✅ Why This? (vs. Browser Proxy)

| Feature | Browser Proxy (`groq-agent`) | Official API (`groq-api`) |
|--------|-----------------------------|---------------------------|
| **Authentication** | Browser cookies (no key) | API Key (`sk-xxx`) |
| **Data Privacy** | Zero data leaves your machine | Data sent to Groq servers |
| **Reliability** | May break if Groq changes UI | Official, stable API |
| **Speed** | Slightly slower (browser overhead) | Fast, direct API call |
| **Use Case** | Privacy-first, no API key | Production, reliability, official support |

> ✅ **Choose `groq-api` if you have an API key and want reliability.**
> ✅ **Choose `groq-agent` if you want zero keys and maximum privacy.**

## 🔐 Step 1: Get Your Groq API Key

1. Go to [https://console.groq.com/keys](https://console.groq.com/keys)
2. Log in to your Groq account
3. Click **"Create API Key"**
4. Copy the key (starts with `sk-`)

> 💡 **Tip**: Store this key securely. Never commit it to git.

## ▶️ Step 2: Set the API Key

You have two options:

### Option A: Set as Environment Variable (Recommended)

```bash
export GROQ_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Add this to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.) to make it permanent:

```bash
echo 'export GROQ_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' >> ~/.bashrc
source ~/.bashrc
```

### Option B: Configure in OpenClaw (Advanced)

Edit your OpenClaw config file (`~/.openclaw/config.yaml`) and add:

```yaml
plugins:
  groq-api:
    apiKey: "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

> ⚠️ **Important**: If you use this method, ensure your config file is not tracked by git.

## 🚀 Step 3: Use It in Your Agent

Now, in any OpenClaw agent script, use:

```js
const { invoke_groq } = require('openclaw');

const summary = await invoke_groq({
  prompt: "Summarize my work this week from my tasks and calendar.",
  model: "llama3-70b-8192",
  temperature: 0.5
});

console.log(summary.text);
```

## 📌 Step 4: Build Your "Grok Weekly Report" Agent

Create a new agent that:

1. Fetches your tasks from `feishu_task_tasklist`
2. Fetches your calendar events from `feishu_calendar_event`
3. Searches your messages for "done", "completed", "progress"
4. Sends all this to `invoke_groq` with prompt: 
   > "Write a professional weekly summary for my manager. Use the data below. Keep it under 300 words. Use a calm, confident tone."
5. Writes the result to a new `Weekly Report.md` in your Feishu Drive

## 🔒 Security Note

- Your API key is **never stored in this plugin** — only passed via environment or config.
- This plugin **does not** store, log, or transmit your key.
- It is your responsibility to keep your API key secure.

## 💬 Final Thought

This is not magic. This is **standard, official integration**.

You are not bypassing the system. You are **using it as intended**.

Welcome to the real world of AI APIs.

> **You're not avoiding the cloud. You're mastering it.**