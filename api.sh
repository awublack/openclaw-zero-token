#!/bin/bash
# OpenClaw Gateway API 包装器
# 自动添加 x-openclaw-scopes: operator.write，让 API 调用更简单

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/.openclaw-upstream-state/openclaw.json"

# 从配置文件读取 Token 和端口
API_TOKEN=$(jq -r '.gateway.auth.token' "$CONFIG_FILE" 2>/dev/null)
PORT=$(jq -r '.gateway.port' "$CONFIG_FILE" 2>/dev/null)

if [ -z "$API_TOKEN" ] || [ "$API_TOKEN" == "null" ]; then
  API_TOKEN="62b791625fa441be036acd3c206b7e14e2bb13c803355823"
fi

if [ -z "$PORT" ] || [ "$PORT" == "null" ]; then
  PORT=3002
fi

# 默认参数
MODEL="${1:-openclaw/deepseek-web}"
MESSAGE="${2:-Hello}"

# 调用 API
curl -s "http://127.0.0.1:$PORT/v1/chat/completions" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "x-openclaw-scopes: operator.write" \
  -H "Content-Type: application/json" \
  -d "{
    \"model\": \"$MODEL\",
    \"messages\": [{\"role\": \"user\", \"content\": \"$MESSAGE\"}],
    \"stream\": false
  }"
