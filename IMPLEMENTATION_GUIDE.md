# OpenClaw Gateway - OpenAI 兼容 API 实现文档

**创建时间**: 2026-04-19  
**位置**: `/home/awu/.openclaw/workspace-work/openclaw-zero-token`  
**状态**: ✅ 已完成并验证通过

---

## 📋 目录

1. [项目概述](#项目概述)
2. [修改日志](#修改日志)
3. [系统架构](#系统架构)
4. [使用说明](#使用说明)
5. [故障排查](#故障排查)
6. [最佳实践](#最佳实践)

---

## 项目概述

### 🎯 目标
实现一个**完全兼容 OpenAI Completions API 格式**的本地网关，通过浏览器自动化技术调用 12+ 个主流 LLM 模型（ChatGPT、DeepSeek、Qwen、Gemini 等）。

### ✅ 核心特性
- **OpenAI 兼容**: 完全符合 OpenAI API 规范，可直接对接 LangChain、LlamaIndex 等工具
- **自动 Scope 处理**: 代理层自动添加必需的 `x-openclaw-scopes` header
- **持久化凭证**: 授权一次，永久有效
- **多模型支持**: 一套接口调用 12+ 个主流 LLM
- **零侵入**: 不修改任何模型方代码

---

## 修改日志

### 2026-04-19 - 初始实现

#### 1. 配置文件修改
**文件**: `.openclaw-upstream-state/openclaw.json`

```json
{
  "gateway": {
    "port": 3002,
    "mode": "local",
    "bind": "loopback",
    "auth": {
      "mode": "token",
      "token": "62b791625fa441be036acd3c206b7e14e2bb13c803355823"
    },
    "http": {
      "endpoints": {
        "chatCompletions": {
          "enabled": true
        }
      }
    }
  },
  "models": {
    "mode": "merge",
    "providers": {
      "deepseek-web": {
        "baseUrl": "https://chat.deepseek.com",
        "api": "deepseek-web",
        "models": [...]
      }
    }
  }
}
```

**修改内容**:
- ✅ 端口从 3001 改为 3002（避免冲突）
- ✅ 添加 DeepSeek provider 配置
- ✅ 配置 Gateway Token 认证

#### 2. 启动脚本修改
**文件**: `server.sh`

**修改 1**: 端口配置
```bash
# 修改前
PORT=3001

# 修改后
PORT=3002
```

**修改 2**: 添加默认 scopes 支持
```bash
# 在 start_gateway() 函数中添加
export OPENCLAW_GATEWAY_DEFAULT_SCOPES="operator.write"
```

**修改 3**: 启动代理层
```bash
# 启动 Gateway
nohup "$NODE" "$SCRIPT_DIR/openclaw.mjs" gateway --port "$PORT" --auth token > "$TMP_LOG" 2>&1 &
GATEWAY_PID=$!

# 等待 Gateway 启动
sleep 2

# 启动代理层（自动添加 x-openclaw-scopes）
echo "启动 OpenClaw 代理层（OpenAI 兼容模式）..."
nohup "$NODE" "$SCRIPT_DIR/openclaw-proxy.js" > "$TMP_LOG.proxy" 2>&1 &
PROXY_PID=$!
```

**修改 3**: 添加测试命令
```bash
case "${1:-start}" in
  # ... 其他命令
  test)
    test_api "${2:-openclaw/deepseek-web}" "${3:-Hello from OpenClaw!}"
    ;;
  api)
    api_call "${2:-openclaw/deepseek-web}" "${3:-Hello}"
    ;;
esac
```

#### 3. 新增文件

##### 3.1 代理层实现
**文件**: `openclaw-proxy.js`

```javascript
import http from 'http';
import { URL } from 'url';

const PORT = process.env.PROXY_PORT || 3003;
const GATEWAY_PORT = process.env.OPENCLAW_GATEWAY_PORT || 3002;
const API_TOKEN = process.env.API_TOKEN || '62b791625fa441be036acd3c206b7e14e2bb13c803355823';

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${GATEWAY_PORT}`);
  
  const options = {
    hostname: '127.0.0.1',
    port: GATEWAY_PORT,
    path: url.pathname + url.search,
    method: req.method,
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'x-openclaw-scopes': 'operator.write',  // 关键：自动添加
      'Content-Type': 'application/json',
      ...Object.fromEntries(
        Object.entries(req.headers).filter(([key]) => 
          !['host', 'authorization', 'content-length', 'x-openclaw-scopes'].includes(key.toLowerCase())
        )
      )
    }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { message: 'Gateway unavailable', type: 'proxy_error' } }));
  });

  req.pipe(proxyReq);
});

server.listen(PORT, () => {
  console.log(`OpenClaw Proxy 已启动`);
  console.log(`监听端口：${PORT}`);
  console.log(`自动添加：x-openclaw-scopes: operator.write`);
});
```

##### 3.2 辅助脚本
**文件**: `api.sh`
```bash
#!/bin/bash
# OpenClaw Gateway API 包装器
# 自动添加 x-openclaw-scopes: operator.write

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/.openclaw-upstream-state/openclaw.json"

API_TOKEN=$(jq -r '.gateway.auth.token' "$CONFIG_FILE" 2>/dev/null)
PORT=$(jq -r '.gateway.port' "$CONFIG_FILE" 2>/dev/null)

MODEL="${1:-openclaw/deepseek-web}"
MESSAGE="${2:-Hello}"

curl -s "http://127.0.0.1:$PORT/v1/chat/completions" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "x-openclaw-scopes: operator.write" \
  -H "Content-Type: application/json" \
  -d "{
    \"model\": \"$MODEL\",
    \"messages\": [{\"role\": \"user\", \"content\": \"$MESSAGE\"}],
    \"stream\": false
  }"
```

**文件**: `test-all-models.sh`
- 批量测试所有 12 个模型
- 自动统计成功/失败数量

**文件**: `test_examples.md`
- 所有 12 个模型的标准 curl 测试命令
- 包含响应格式说明

---

## 系统架构

### 架构图
```
客户端 (curl/应用)
    ↓ [HTTP + OpenAI 格式]
代理层 (3003 端口)
    ├─ 自动添加 x-openclaw-scopes: operator.write
    ├─ 转发请求到 Gateway
    ↓ [HTTP + 完整 headers]
Gateway (3002 端口)
    ├─ Token 认证
    ├─ 路由分发
    ├─ 模型选择
    ↓ [CDP 协议]
浏览器 CDP (9222 端口)
    ├─ 网页自动化
    ├─ Cookie 管理
    ├─ JavaScript 执行
    ↓ [HTTPS]
各大模型网站
    ├─ ChatGPT (chatgpt.com)
    ├─ DeepSeek (chat.deepseek.com)
    ├─ Qwen (chat.qwen.ai)
    └─ ...
```

### 组件说明

| 组件 | 端口 | 职责 | 技术栈 |
|------|------|------|--------|
| **代理层** | 3003 | OpenAI 兼容、自动添加 scopes | Node.js http |
| **Gateway** | 3002 | 认证、路由、模型管理 | OpenClaw Gateway |
| **浏览器 CDP** | 9222 | 网页自动化、凭证管理 | Chrome DevTools Protocol |
| **凭证存储** | - | 持久化存储 Cookie/Token | JSON 文件 |

---

## 使用说明

### 快速开始

#### 1. 启动服务
```bash
cd /home/awu/.openclaw/workspace-work/openclaw-zero-token
./server.sh start
```

#### 2. 测试调用
```bash
# 方式 1：使用 curl（标准 OpenAI 格式）
curl -X POST 'http://127.0.0.1:3003/v1/chat/completions' \
  -H 'Authorization: Bearer 62b791625fa441be036acd3c206b7e14e2bb13c803355823' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/deepseek-web",
    "messages": [{"role": "user", "content": "你好"}]
  }'

# 方式 2：使用简化脚本
./api.sh openclaw/deepseek-web "你好"

# 方式 3：批量测试
./test-all-models.sh
```

### 支持的模型列表

| 模型名 | 提供商 | 地区 | 状态 |
|--------|--------|------|------|
| `openclaw/deepseek-web` | DeepSeek | 中国 | ✅ |
| `openclaw/chatgpt-web` | OpenAI | 国际 | ✅ |
| `openclaw/qwen-web` | 阿里云 | 国际 | ✅ |
| `openclaw/qwen-cn-web` | 阿里云 | 中国 | ✅ |
| `openclaw/glm-intl-web` | 智谱 AI | 国际 | ✅ |
| `openclaw/glm-web` | 智谱 AI | 中国 | ✅ |
| `openclaw/grok-web` | xAI | 国际 | ✅ |
| `openclaw/doubao-web` | 字节跳动 | 中国 | ✅ |
| `openclaw/gemini-web` | Google | 国际 | ✅ |
| `openclaw/kimi-web` | 月之暗面 | 中国 | ✅ |
| `openclaw/perplexity-web` | Perplexity | 国际 | ✅ |
| `openclaw/xiaomimo-web` | 小米 | 中国 | ✅ |

### 添加新模型

#### 步骤 1: 运行授权向导
```bash
./onboard.sh webauth
```

#### 步骤 2: 选择模型提供商
- 选择对应的模型（如 ChatGPT Web、DeepSeek Web 等）
- 在浏览器中完成登录
- 凭证会自动保存

#### 步骤 3: 重启服务
```bash
./server.sh restart
```

#### 步骤 4: 测试新模型
```bash
./server.sh test openclaw/<新模型名> "测试消息"
```

### 高级用法

#### 流式响应
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

#### 多轮对话
```bash
curl -X POST 'http://127.0.0.1:3003/v1/chat/completions' \
  -H 'Authorization: Bearer TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/deepseek-web",
    "messages": [
      {"role": "system", "content": "你是一个简洁的助手"},
      {"role": "user", "content": "1+1 等于几？"},
      {"role": "assistant", "content": "2"},
      {"role": "user", "content": "2+2 呢？"}
    ]
  }'
```

#### 使用不同模型
```bash
# ChatGPT
curl ... -d '{"model": "openclaw/chatgpt-web", ...}'

# Qwen
curl ... -d '{"model": "openclaw/qwen-web", ...}'

# Gemini
curl ... -d '{"model": "openclaw/gemini-web", ...}'
```

---

## 故障排查

### 常见问题

#### 1. "No response from OpenClaw"
**原因**: 
- 浏览器会话过期
- Cookie 失效
- 网页需要重新登录

**解决方案**:
```bash
# 1. 重新授权
./onboard.sh webauth

# 2. 重启服务
./server.sh restart

# 3. 在浏览器中手动登录
# 打开 http://127.0.0.1:9222 对应的 Chrome 实例
# 访问对应网站并登录
```

#### 2. "missing scope: operator.write"
**原因**: 请求缺少必需的 scope header

**解决方案**:
- 使用代理层（3003 端口）：自动添加
- 或手动添加 header: `-H "x-openclaw-scopes: operator.write"`

#### 3. Gateway 启动失败
**检查**:
```bash
# 查看日志
tail -50 /tmp/openclaw-upstream-gateway.log

# 检查端口占用
lsof -i :3002
lsof -i :3003

# 清理并重启
./server.sh stop
./server.sh start
```

#### 4. 浏览器 CDP 连接失败
**检查**:
```bash
# 检查 Chrome 进程
ps aux | grep chrome | grep 9222

# 检查 CDP 端点
curl http://127.0.0.1:9222/json/version

# 重启浏览器
./start-chrome-debug.sh
```

### 日志位置

| 日志类型 | 位置 |
|---------|------|
| Gateway 日志 | `/tmp/openclaw-upstream-gateway.log` |
| 代理层日志 | `/tmp/openclaw-upstream-gateway.log.proxy` |
| 凭证文件 | `.openclaw-upstream-state/agents/main/agent/auth-profiles.json` |
| 配置状态 | `.openclaw-upstream-state/openclaw.json` |

---

## 最佳实践

### 1. 凭证管理
- ✅ 定期重新授权（Cookie 过期时）
- ✅ 不要在公共场合暴露 Token
- ✅ 备份 `auth-profiles.json`

### 2. 性能优化
- ✅ 使用连接池减少握手开销
- ✅ 合理设置超时时间
- ✅ 监控浏览器内存使用

### 3. 安全建议
- ✅ 限制 API 访问来源（防火墙）
- ✅ 定期更新 Token
- ✅ 监控异常请求

### 4. 监控告警
```bash
# 健康检查
curl -s http://127.0.0.1:3003/v1/models \
  -H "Authorization: Bearer TOKEN" | jq '.'

# 检查服务状态
./server.sh status

# 检查浏览器状态
curl http://127.0.0.1:9222/json/version
```

---

## 附录

### A. 完整测试脚本
```bash
#!/bin/bash
# test-complete.sh - 完整测试所有模型

API_URL="http://127.0.0.1:3003/v1/chat/completions"
TOKEN="62b791625fa441be036acd3c206b7e14e2bb13c803355823"

MODELS=(
  "deepseek-web" "chatgpt-web" "qwen-web" "qwen-cn-web"
  "glm-intl-web" "glm-web" "grok-web" "doubao-web"
  "gemini-web" "kimi-web" "perplexity-web" "xiaomimo-web"
)

echo "测试所有模型..."
for MODEL in "${MODELS[@]}"; do
  RESPONSE=$(curl -s --max-time 10 "$API_URL" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"model\": \"openclaw/$MODEL\", \"messages\": [{\"role\": \"user\", \"content\": \"test\"}]}")
  
  if echo "$RESPONSE" | jq -e '.choices[0].message.content' > /dev/null 2>&1; then
    echo "✅ $MODEL: 成功"
  else
    echo "❌ $MODEL: 失败 - $RESPONSE"
  fi
done
```

### B. 环境变量
```bash
export OPENCLAW_GATEWAY_PORT=3002
export PROXY_PORT=3003
export API_TOKEN="62b791625fa441be036acd3c206b7e14e2bb13c803355823"
```

### C. 相关资源
- OpenClaw 官方文档：`/home/awu/.npm-global/lib/node_modules/openclaw/docs`
- ClawHub 技能市场：https://clawhub.com
- OpenAI API 文档：https://platform.openai.com/docs/api-reference

---

**文档版本**: 1.0  
**最后更新**: 2026-04-19  
**维护者**: awublack  
**状态**: ✅ 生产就绪
