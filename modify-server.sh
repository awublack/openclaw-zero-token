#!/bin/bash
# 修改 openclaw-api-server.js 以支持 HTTPS

FILE="openclaw-api-server.js"

# 1. 添加导入
if ! grep -q "import https from 'https'" $FILE; then
  sed -i "s/import http from 'http';/import http from 'http';\nimport https from 'https';/" $FILE
  echo "✅ 添加 https 导入"
fi

if ! grep -q "import fs from 'fs'" $FILE; then
  sed -i "s/import { URL } from 'url';/import { URL } from 'url';\nimport fs from 'fs';/" $FILE
  echo "✅ 添加 fs 导入"
fi

# 2. 添加配置
if ! grep -q "httpsPort" $FILE; then
  sed -i 's/port: process.env.API_SERVER_PORT || 3003,/port: process.env.API_SERVER_PORT || 3003,\n  httpsPort: process.env.API_SERVER_HTTPS_PORT || 3004,/' $FILE
  echo "✅ 添加 httpsPort 配置"
fi

# 3. 替换启动逻辑 - 使用临时文件
cat > /tmp/new-server-start.js << 'ENDSCRIPT'
// ==================== 加载证书 ====================
let httpsOptions = {};
try {
  if (fs.existsSync('./certificate.crt') && fs.existsSync('./private.key')) {
    httpsOptions = {
      key: fs.readFileSync('./private.key'),
      cert: fs.readFileSync('./certificate.crt'),
    };
    console.log('✅ 检测到证书文件，将启用 HTTPS 支持');
  } else {
    console.log('⚠️ 未检测到证书文件，仅启用 HTTP 模式');
  }
} catch (error) {
  console.error('❌ 读取证书失败:', error.message);
}

// ==================== 请求处理逻辑 (共用) ====================
const requestHandler = async (req, res) => {
  // CORS 预检
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return;
  }

  const url = new URL(req.url, \`http://127.0.0.1:\${CONFIG.port}\`);

  // --- 路由匹配 ---
  // 兼容路径：/chat/completions
  if (url.pathname === '/chat/completions' && req.method === 'POST') {
    await handleChatCompletions(req, res);
    return;
  }

  // 标准路径：/v1/chat/completions
  if (url.pathname === '/v1/chat/completions' && req.method === 'POST') {
    await handleChatCompletions(req, res);
    return;
  }

  // 兼容旧版：/v1/completions
  if (url.pathname === '/v1/completions' && req.method === 'POST') {
    await handleCompletions(req, res);
    return;
  }

  // 获取模型列表
  if (url.pathname === '/v1/models' && req.method === 'GET') {
    await handleModels(req, res);
    return;
  }

  // 健康检查
  if (url.pathname === '/health' || url.pathname === '/') {
    sendJSON(res, 200, {
      status: 'ok',
      service: 'openclaw-api-server',
      version: '1.0.0',
      models: MODELS.map(m => m.id),
    });
    return;
  }

  // 404
  sendJSON(res, 404, {
    error: {
      message: \`Not found: \${url.pathname}\`,
      type: 'not_found',
    },
  });
};

// ==================== 启动 HTTP 服务器 (3003 端口) ====================
const httpServer = http.createServer(requestHandler);
httpServer.listen(CONFIG.port, () => {
  console.log(\`🚀 HTTP Server listening on port \${CONFIG.port}\`);
});

// ==================== 启动 HTTPS 服务器 (3004 端口) ====================
if (httpsOptions.key) {
  const httpsServer = https.createServer(httpsOptions, requestHandler);
  httpsServer.listen(CONFIG.httpsPort, () => {
    console.log(\`🔒 HTTPS Server listening on port \${CONFIG.httpsPort}\`);
  });
} else {
  console.log('💡 提示：如需 HTTPS，请确保证书文件存在');
}

// ==================== 优雅关闭 ====================
const shutdown = () => {
  console.log('\\n🛑 正在关闭服务器...');
  httpServer.close(() => process.exit(0));
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
ENDSCRIPT

echo "✅ 准备替换启动逻辑..."
