#!/bin/bash
# 批量测试所有已授权的模型

API_URL="http://127.0.0.1:3003/v1/chat/completions"
API_TOKEN="62b791625fa441be036acd3c206b7e14e2bb13c803355823"
MESSAGE="用一句话介绍你自己"

# 完整的模型列表
MODELS=(
  "openclaw/deepseek-web"
  "openclaw/chatgpt-web"
  "openclaw/qwen-web"
  "openclaw/qwen-cn-web"
  "openclaw/glm-intl-web"
  "openclaw/glm-web"
  "openclaw/grok-web"
  "openclaw/doubao-web"
  "openclaw/gemini-web"
  "openclaw/kimi-web"
  "openclaw/perplexity-web"
  "openclaw/xiaomimo-web"
)

echo "=========================================="
echo "批量测试所有模型 ($(date +%H:%M:%S))"
echo "总计：${#MODELS[@]} 个模型"
echo "=========================================="
echo ""

SUCCESS_COUNT=0
FAIL_COUNT=0

for MODEL in "${MODELS[@]}"; do
  echo "📍 测试模型：$MODEL"
  
  RESPONSE=$(curl -s --max-time 30 "$API_URL" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"model\": \"$MODEL\",
      \"messages\": [{\"role\": \"user\", \"content\": \"$MESSAGE\"}]
    }")
  
  # 检查是否成功
  if echo "$RESPONSE" | jq -e '.choices[0].message.content' > /dev/null 2>&1; then
    CONTENT=$(echo "$RESPONSE" | jq -r '.choices[0].message.content' | head -c 150)
    echo "✅ 成功 | 回复：$CONTENT..."
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  else
    ERROR=$(echo "$RESPONSE" | jq -r '.error.message // "未知错误"' 2>/dev/null)
    echo "❌ 失败 | $ERROR"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
  
  echo "------------------------------------------"
done

echo ""
echo "=========================================="
echo "测试完成"
echo "成功：$SUCCESS_COUNT | 失败：$FAIL_COUNT"
echo "=========================================="
