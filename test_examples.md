# OpenClaw Gateway - 所有模型测试示例

## 通用说明

- **API 端点**: `http://127.0.0.1:3003/v1/chat/completions`
- **Authorization Token**: `62b791625fa441be036acd3c206b7e14e2bb13c803355823`
- **格式**: 完全兼容 OpenAI API 格式

---

## 1. DeepSeek Web (深度求索)

```bash
curl -X POST 'http://127.0.0.1:3003/v1/chat/completions' \
  -H 'Authorization: Bearer 62b791625fa441be036acd3c206b7e14e2bb13c803355823' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/deepseek-web",
    "messages": [
      { "role": "user", "content": "你好" }
    ]
  }'
```

**响应示例**:
```json
{
  "id": "chatcmpl_xxx",
  "model": "openclaw/deepseek-web",
  "choices": [{
    "message": {
      "content": "你好！有什么我可以帮你的吗？"
    }
  }]
}
```

---

## 2. ChatGPT Web (OpenAI)

```bash
curl -X POST 'http://127.0.0.1:3003/v1/chat/completions' \
  -H 'Authorization: Bearer 62b791625fa441be036acd3c206b7e14e2bb13c803355823' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/chatgpt-web",
    "messages": [
      { "role": "user", "content": "Hello, how are you?" }
    ]
  }'
```

---

## 3. Qwen Web (通义千问 - 国际版)

```bash
curl -X POST 'http://127.0.0.1:3003/v1/chat/completions' \
  -H 'Authorization: Bearer 62b791625fa441be036acd3c206b7e14e2bb13c803355823' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/qwen-web",
    "messages": [
      { "role": "user", "content": "介绍一下你自己" }
    ]
  }'
```

---

## 4. Qwen-CN Web (通义千问 - 国内版)

```bash
curl -X POST 'http://127.0.0.1:3003/v1/chat/completions' \
  -H 'Authorization: Bearer 62b791625fa441be036acd3c206b7e14e2bb13c803355823' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/qwen-cn-web",
    "messages": [
      { "role": "user", "content": "你好，请介绍一下你自己" }
    ]
  }'
```

---

## 5. GLM Intl Web (智谱 GLM - 国际版)

```bash
curl -X POST 'http://127.0.0.1:3003/v1/chat/completions' \
  -H 'Authorization: Bearer 62b791625fa441be036acd3c206b7e14e2bb13c803355823' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/glm-intl-web",
    "messages": [
      { "role": "user", "content": "Hello, introduce yourself" }
    ]
  }'
```

---

## 6. GLM Web (智谱 GLM - 国内版)

```bash
curl -X POST 'http://127.0.0.1:3003/v1/chat/completions' \
  -H 'Authorization: Bearer 62b791625fa441be036acd3c206b7e14e2bb13c803355823' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/glm-web",
    "messages": [
      { "role": "user", "content": "你好，介绍一下你自己" }
    ]
  }'
```

---

## 7. Grok Web (xAI)

```bash
curl -X POST 'http://127.0.0.1:3003/v1/chat/completions' \
  -H 'Authorization: Bearer 62b791625fa441be036acd3c206b7e14e2bb13c803355823' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/grok-web",
    "messages": [
      { "role": "user", "content": "Hi, what can you do?" }
    ]
  }'
```

---

## 8. Doubao Web (豆包 - 字节跳动)

```bash
curl -X POST 'http://127.0.0.1:3003/v1/chat/completions' \
  -H 'Authorization: Bearer 62b791625fa441be036acd3c206b7e14e2bb13c803355823' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/doubao-web",
    "messages": [
      { "role": "user", "content": "你好，你能做什么？" }
    ]
  }'
```

---

## 9. Gemini Web (Google)

```bash
curl -X POST 'http://127.0.0.1:3003/v1/chat/completions' \
  -H 'Authorization: Bearer 62b791625fa441be036acd3c206b7e14e2bb13c803355823' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/gemini-web",
    "messages": [
      { "role": "user", "content": "Hello, tell me about yourself" }
    ]
  }'
```

---

## 10. Kimi Web (月之暗面)

```bash
curl -X POST 'http://127.0.0.1:3003/v1/chat/completions' \
  -H 'Authorization: Bearer 62b791625fa441be036acd3c206b7e14e2bb13c803355823' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/kimi-web",
    "messages": [
      { "role": "user", "content": "你好，介绍一下你的能力" }
    ]
  }'
```

---

## 11. Perplexity Web

```bash
curl -X POST 'http://127.0.0.1:3003/v1/chat/completions' \
  -H 'Authorization: Bearer 62b791625fa441be036acd3c206b7e14e2bb13c803355823' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/perplexity-web",
    "messages": [
      { "role": "user", "content": "What is the weather today?" }
    ]
  }'
```

---

## 12. Xiaomimo Web (小蜜 - 小米)

```bash
curl -X POST 'http://127.0.0.1:3003/v1/chat/completions' \
  -H 'Authorization: Bearer 62b791625fa441be036acd3c206b7e14e2bb13c803355823' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/xiaomimo-web",
    "messages": [
      { "role": "user", "content": "你好" }
    ]
  }'
```

---

## 批量测试脚本

使用以下脚本可以一次性测试所有模型：

```bash
cd /home/awu/.openclaw/workspace-work/openclaw-zero-token
./test-all-models.sh
```

---

## 响应格式说明

所有模型的响应格式都遵循 OpenAI 标准：

```json
{
  "id": "chatcmpl_xxx",
  "object": "chat.completion",
  "created": 1776586343,
  "model": "openclaw/<模型名>",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "AI 的回复内容"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 0,
    "completion_tokens": 0,
    "total_tokens": 0
  }
}
```

---

## 注意事项

1. **端口**: 代理层运行在 `3003` 端口
2. **Token**: 所有请求使用相同的 Bearer Token
3. **模型格式**: 统一使用 `openclaw/<模型名>` 格式
4. **自动 scopes**: 代理层自动添加 `x-openclaw-scopes: operator.write`

---

**更新时间**: 2026-04-19  
**位置**: `/home/awu/.openclaw/workspace-work/openclaw-zero-token`
