#!/bin/bash
# OpenClaw Gateway 简化测试脚本
# 自动添加 x-openclaw-scopes: operator.write 头，无需手动指定

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/.openclaw-upstream-state/openclaw.json"

# 从配置文件读取 Token
API_TOKEN=$(jq -r '.gateway.auth.token' "$CONFIG_FILE" 2>/dev/null)
PORT=$(jq -r '.gateway.port' "$CONFIG_FILE" 2>/dev/null)

if [ -z "$API_TOKEN" ] || [ "$API_TOKEN" == "null" ]; then
    API_TOKEN="62b791625fa441be036acd3c206b7e14e2bb13c803355823"
fi

if [ -z "$PORT" ] || [ "$PORT" == "null" ]; then
    PORT=3002
fi

BASE_URL="http://127.0.0.1:$PORT/v1/chat/completions"

# 默认参数
MODEL="openclaw/deepseek-web"
MESSAGE="Say hello"
STREAM="false"

# 解析参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -m|--model)
            MODEL="$2"
            shift 2
            ;;
        -msg|--message)
            MESSAGE="$2"
            shift 2
            ;;
        -s|--stream)
            STREAM="$2"
            shift 2
            ;;
        -h|--help)
            echo "用法：$0 [选项]"
            echo ""
            echo "选项:"
            echo "  -m, --model MODEL      模型名称 (默认：openclaw/deepseek-web)"
            echo "  -msg, --message MSG    消息内容 (默认：Say hello)"
            echo "  -s, --stream BOOL      是否流式输出 (默认：false)"
            echo "  -h, --help             显示帮助"
            echo ""
            echo "示例:"
            echo "  $0"
            echo "  $0 -m openclaw -msg 'Hello'"
            echo "  $0 --model openclaw/deepseek-web --message '测试'"
            exit 0
            ;;
        *)
            echo "未知选项：$1"
            echo "使用 --help 查看帮助"
            exit 1
            ;;
    esac
done

# 发送请求
curl -s "$BASE_URL" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "x-openclaw-scopes: operator.write" \
    -H "Content-Type: application/json" \
    -d "{
        \"model\": \"$MODEL\",
        \"messages\": [{\"role\": \"user\", \"content\": \"$MESSAGE\"}],
        \"stream\": $STREAM
    }" | jq '.'
