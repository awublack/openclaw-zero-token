# OpenClaw API Server - 完整的 OpenAI 兼容 API 服务

## 🎯 升级亮点

### 对比旧版代理

| 特性 | 旧版 (openclaw-proxy.js) | 新版 (openclaw-api-server.js) |
|------|-------------------------|------------------------------|
| **模型发现** | ❌ 不支持 | ✅ `/v1/models` 端点 |
| **错误处理** | 基础 | ✅ 完整的错误类型和状态码 |
| **流式响应** | 简单转发 | ✅ 完整支持 SSE 流 |
| **CORS** | ❌ 不支持 | ✅ 完整支持 |
| **健康检查** | ❌ 无 | ✅ `/health` 端点 |
| **日志记录** | 无 | ✅ 请求日志 |
| **超时控制** | 无 | ✅ 60 秒超时 |
| **兼容性** | 仅 chat/completions | ✅ 支持 completions 旧版 |

---

## 🚀 快速开始

### 1. 启动服务

```bash
cd /home/awu/.openclaw/workspace-work/openclaw-zero-token
./server.sh start
```

启动后会看到：
```
╔══════════════════════════════════════════════════════════╗
║     OpenClaw API Server - OpenAI Compatible              ║
╠══════════════════════════════════════════════════════════╣
║  监听端口：3003
║  转发到：http://127.0.0.1:3002
║  自动 Scope: operator.write
║  支持端点：
║    - GET  /v1/models
║    - POST /v1/chat/completions
║    - POST /v1/completions
║    - GET  /health
║  可用模型：12 个
╚══════════════════════════════════════════════════════════╝
```

### 2. 测试连接

```bash
# 健康检查
curl http://127.0.0.1:3003/health

# 获取模型列表
curl http://127.0.0.1:3003/v1/models

# 聊天测试
curl -X POST 'http://127.0.0.1:3003/v1/chat/completions' \
  -H 'Authorization: Bearer 62b791625fa441be036acd3c206b7e14e2bb13c803355823' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/deepseek-web",
    "messages": [{"role": "user", "content": "你好"}]
  }'
```

---

## 📡 API 端点

### 1. GET /health - 健康检查

**请求**:
```bash
curl http://127.0.0.1:3003/health
```

**响应**:
```json
{
  "status": "ok",
  "service": "openclaw-api-server",
  "version": "1.0.0",
  "models": [
    "openclaw/deepseek-web",
    "openclaw/chatgpt-web",
    "openclaw/qwen-web",
    ...
  ]
}
```

### 2. GET /v1/models - 获取模型列表

**请求**:
```bash
curl http://127.0.0.1:3003/v1/models
```

**响应**:
```json
{
  "object": "list",
  "data": [
    {
      "id": "openclaw/deepseek-web",
      "object": "model",
      "created": 1776590400000,
      "owned_by": "openclaw"
    },
    {
      "id": "openclaw/chatgpt-web",
      "object": "model",
      "created": 1776590400000,
      "owned_by": "openclaw"
    }
  ]
}
```

### 3. POST /v1/chat/completions - 聊天完成

**请求**:
```bash
curl -X POST 'http://127.0.0.1:3003/v1/chat/completions' \
  -H 'Authorization: Bearer TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/deepseek-web",
    "messages": [{"role": "user", "content": "你好"}]
  }'
```

**响应**:
```json
{
  "id": "chatcmpl_xxx",
  "object": "chat.completion",
  "created": 1776590400,
  "model": "openclaw/deepseek-web",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "你好！有什么我可以帮你的吗？"
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 0,
    "completion_tokens": 0,
    "total_tokens": 0
  }
}
```

---

## 🔧 配置选项

### 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `API_SERVER_PORT` | `3003` | API 服务器监听端口 |
| `OPENCLAW_GATEWAY_PORT` | `3002` | Gateway 端口 |
| `API_TOKEN` | `62b79...` | Gateway 认证 Token |

### 启动配置

```bash
# 自定义端口
export API_SERVER_PORT=4000
export OPENCLAW_GATEWAY_PORT=3002
export API_TOKEN="your-token"

# 启动
node openclaw-api-server.js
```

---

## 💡 使用场景

### 1. LangChain 集成

```python
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    base_url="http://127.0.0.1:3003/v1",
    api_key="62b791625fa441be036acd3c206b7e14e2bb13c803355823",
    model="openclaw/deepseek-web"
)

response = llm.invoke("你好")
print(response.content)
```

### 2. LlamaIndex 集成

```python
from llama_index.llms.openai import OpenAI

llm = OpenAI(
    api_key="62b791625fa441be036acd3c206b7e14e2bb13c803355823",
    api_base="http://127.0.0.1:3003/v1",
    model="openclaw/chatgpt-web"
)

response = llm.complete("你好")
print(response)
```

### 3. Node.js OpenAI SDK

```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'http://127.0.0.1:3003/v1',
  apiKey: '62b791625fa441be036acd3c206b7e14e2bb13c803355823',
});

const chatCompletion = await openai.chat.completions.create({
  model: 'openclaw/qwen-web',
  messages: [{ role: 'user', content: '你好' }],
});

console.log(chatCompletion.choices[0].message.content);
```

---

## 🔍 错误处理

### 错误响应格式

```json
{
  "error": {
    "message": "错误信息",
    "type": "错误类型"
  }
}
```

### 常见错误

| 错误码 | 类型 | 说明 |
|--------|------|------|
| 400 | `invalid_request_error` | 缺少必要字段（model/messages） |
| 401 | `unauthorized` | Token 无效 |
| 404 | `not_found` | 端点不存在 |
| 500 | `server_error` | 服务器内部错误 |
| 502 | `gateway_error` | Gateway 连接失败 |
| 504 | `timeout_error` | Gateway 超时 |

---

## 📊 日志与监控

### 请求日志

```
[2026-04-19T12:34:56.789Z] POST /v1/chat/completions - 200 (1234ms)
[2026-04-19T12:34:58.123Z] GET /v1/models - 200 (5ms)
```

### 日志位置

- **API Server 日志**: `/tmp/openclaw-upstream-gateway.log.api`
- **Gateway 日志**: `/tmp/openclaw-upstream-gateway.log`

---

## 🎯 高级功能

### 1. 流式响应

```bash
curl -X POST 'http://127.0.0.1:3003/v1/chat/completions' \
  -H 'Authorization: Bearer TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/deepseek-web",
    "messages": [{"role": "user", "content": "你好"}],
    "stream": true
  }'
```

### 2. 多轮对话

```bash
curl -X POST 'http://127.0.0.1:3003/v1/chat/completions' \
  -H 'Authorization: Bearer TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/chatgpt-web",
    "messages": [
      {"role": "system", "content": "你是一个简洁的助手"},
      {"role": "user", "content": "1+1 等于几？"},
      {"role": "assistant", "content": "2"},
      {"role": "user", "content": "2+2 呢？"}
    ]
  }'
```

---

## ✅ 总结

### 升级优势

1. **更强的通用性** - 完整的 OpenAI API 兼容，支持模型发现、错误处理、流式响应
2. **开箱即用** - 无需修改现有应用，直接替换 base_url 即可
3. **生产就绪** - 完整的错误处理、超时控制、日志记录
4. **向后兼容** - 保留旧版 `/v1/completions` 端点

### 下一步

- [ ] 添加认证中间件（IP 白名单、速率限制）
- [ ] 添加请求缓存
- [ ] 添加负载均衡（多 Gateway 实例）
- [ ] 添加指标收集（Prometheus 格式）

---

**文档版本**: 1.0  
**创建时间**: 2026-04-19  
**位置**: `/home/awu/.openclaw/workspace-work/openclaw-zero-token/API_SERVER_GUIDE.md`
