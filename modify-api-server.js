// 在文件末尾添加新代码的脚本
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'openclaw-api-server.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. 添加导入
if (!content.includes("import https from 'https'")) {
  content = content.replace("import http from 'http';", "import http from 'http';\nimport https from 'https';");
}
if (!content.includes("import fs from 'fs'")) {
  content = content.replace("import { URL } from 'url';", "import { URL } from 'url';\nimport fs from 'fs';");
}

// 2. 添加配置
if (!content.includes('httpsPort')) {
  content = content.replace(
    'port: process.env.API_SERVER_PORT || 3003,',
    'port: process.env.API_SERVER_PORT || 3003,\n  httpsPort: process.env.API_SERVER_HTTPS_PORT || 3004,'
  );
}

// 3. 替换整个启动逻辑部分
const oldServerCode = `// ==================== 主服务器 ====================
const server = http.createServer(async (req, res) => {`;

const newServerCode = `// ==================== 加载证书 ====================
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
const requestHandler = async (req, res) => {`;

content = content.replace(oldServerCode, newServerCode);

// 4. 替换启动和关闭逻辑
const oldStartCode = `// 启动服务器
server.listen(CONFIG.port, () => {
  console.log(\`
╔══════════════════════════════════════════════════════════╗
║     OpenClaw API Server - OpenAI Compatible              ║
╠══════════════════════════════════════════════════════════╣
║  监听端口：\${CONFIG.port}
║  转发到：http://\${CONFIG.gatewayHost}:\${CONFIG.gatewayPort}
║  自动 Scope: \${CONFIG.defaultScope}
║  支持端点：
║    - GET /v1/models
║    - POST /v1/chat/completions
║    - POST /v1/completions
║    - GET /health
║  可用模型：\${MODELS.length} 个
╚══════════════════════════════════════════════════════════╝
\`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM，关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});
process.on('SIGINT', () => {
  console.log('收到 SIGINT，关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});`;

const newStartCode = `// ==================== 启动 HTTP 服务器 (3003 端口) ====================
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
process.on('SIGTERM', shutdown);`;

content = content.replace(oldStartCode, newStartCode);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ 文件修改完成');
