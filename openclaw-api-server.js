#!/usr/bin/env node
/**
 * OpenClaw API Server - 完整的 OpenAI 兼容 API 服务
 * 
 * 功能：
 * - 自动添加 x-openclaw-scopes: operator.write
 * - 支持 /v1/models 端点（模型发现）
 * - 支持 /v1/chat/completions（流式/非流式）
 * - 支持 /v1/completions（兼容旧版）
 * - 完整的错误处理
 * - CORS 支持
 * - 请求日志
 */

import http from 'http';
import https from 'https';
import { URL } from 'url';
import fs from 'fs';

// ==================== 配置 ====================
const CONFIG = {
  port: process.env.API_SERVER_PORT || 3003,
  gatewayPort: process.env.OPENCLAW_GATEWAY_PORT || 3002,
  gatewayHost: '127.0.0.1',
  apiToken: process.env.API_TOKEN || '62b791625fa441be036acd3c206b7e14e2bb13c803355823',
  defaultScope: 'operator.write',
};

// 预定义的模型列表（也可从 Gateway 动态获取）
const MODELS = [
  { id: 'openclaw/deepseek-web', object: 'model', created: Date.now(), owned_by: 'openclaw' },
  { id: 'openclaw/chatgpt-web', object: 'model', created: Date.now(), owned_by: 'openclaw' },
  { id: 'openclaw/qwen-web', object: 'model', created: Date.now(), owned_by: 'openclaw' },
  { id: 'openclaw/qwen-cn-web', object: 'model', created: Date.now(), owned_by: 'openclaw' },
  { id: 'openclaw/glm-intl-web', object: 'model', created: Date.now(), owned_by: 'openclaw' },
  { id: 'openclaw/glm-web', object: 'model', created: Date.now(), owned_by: 'openclaw' },
  { id: 'openclaw/grok-web', object: 'model', created: Date.now(), owned_by: 'openclaw' },
  { id: 'openclaw/doubao-web', object: 'model', created: Date.now(), owned_by: 'openclaw' },
  { id: 'openclaw/gemini-web', object: 'model', created: Date.now(), owned_by: 'openclaw' },
  { id: 'openclaw/kimi-web', object: 'model', created: Date.now(), owned_by: 'openclaw' },
  { id: 'openclaw/perplexity-web', object: 'model', created: Date.now(), owned_by: 'openclaw' },
  { id: 'openclaw/xiaomimo-web', object: 'model', created: Date.now(), owned_by: 'openclaw' },
];

// ==================== 工具函数 ====================

// 解析 JSON Body
async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

// 发送 JSON 响应
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

// 发送流式响应
function sendStream(res, data) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// 日志
function log(method, url, status, duration) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${method} ${url} - ${status} (${duration}ms)`);
}

// ==================== 请求处理 ====================

// 处理 /v1/models - 获取模型列表
async function handleModels(req, res) {
  const startTime = Date.now();
  try {
    // 优先使用缓存的模型列表
    const cachedModelsPath = './.openclaw-upstream-state/cached-models.json';
    let models = [];
    try {
      if (fs.existsSync(cachedModelsPath)) {
        const cached = JSON.parse(fs.readFileSync(cachedModelsPath, 'utf8'));
        models = cached.data || [];
        console.log(`使用缓存的模型列表，共 ${models.length} 个模型`);
      }
    } catch (e) {
      console.log('读取缓存模型列表失败：', e.message);
    }
    
    // 如果缓存为空，尝试从 Gateway 动态获取
    if (models.length === 0) {
      const gatewayModels = await fetchModelsFromGateway();
      models = gatewayModels.length > 0 ? gatewayModels : MODELS;
    }
    
    log('GET', '/v1/models', 200, Date.now() - startTime);
    sendJSON(res, 200, {
      object: 'list',
      data: models,
    });
  } catch (error) {
    log('GET', '/v1/models', 500, Date.now() - startTime);
    sendJSON(res, 500, {
      error: {
        message: error.message,
        type: 'server_error',
      },
    });
  }
}

// 从 Gateway 动态获取模型
async function fetchModelsFromGateway() {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: CONFIG.gatewayHost,
      port: CONFIG.gatewayPort,
      path: '/v1/models',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CONFIG.apiToken}`,
        'x-openclaw-scopes': CONFIG.defaultScope,
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.data || []);
        } catch {
          resolve([]);
        }
      });
    });
    
    req.on('error', () => resolve([]));
    req.setTimeout(2000, () => { req.destroy(); resolve([]); });
    req.end();
  });
}

// 处理 /v1/chat/completions - 聊天完成
async function handleChatCompletions(req, res) {
  const startTime = Date.now();
  
  try {
    const body = await parseBody(req);
    
    // 验证必要字段
    if (!body.model) {
      log('POST', '/v1/chat/completions', 400, Date.now() - startTime);
      return sendJSON(res, 400, { error: { message: 'Missing required field: model', type: 'invalid_request_error' } });
    }
    
    if (!body.messages || !Array.isArray(body.messages)) {
      log('POST', '/v1/chat/completions', 400, Date.now() - startTime);
      return sendJSON(res, 400, { error: { message: 'Missing or invalid field: messages', type: 'invalid_request_error' } });
    }
    
    // 转发请求到 Gateway
    forwardToGateway(req, res, body, startTime);
  } catch (error) {
    log('POST', '/v1/chat/completions', 500, Date.now() - startTime);
    sendJSON(res, 500, { error: { message: error.message, type: 'server_error' } });
  }
}

// 转发请求到 Gateway
function forwardToGateway(originalReq, res, body, startTime) {
  const isStream = body.stream === true;
  
  const gatewayReq = http.request({
    hostname: CONFIG.gatewayHost,
    port: CONFIG.gatewayPort,
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(JSON.stringify(body)),
      'Authorization': `Bearer ${CONFIG.apiToken}`,
      'x-openclaw-scopes': CONFIG.defaultScope, // 关键：自动添加 scopes
    },
  }, (gatewayRes) => {
    // 设置响应头
    res.statusCode = gatewayRes.statusCode;
    res.setHeader('Content-Type', gatewayRes.headers['content-type'] || 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (isStream) {
      // 流式响应
      gatewayRes.on('data', chunk => {
        res.write(chunk);
      });
      gatewayRes.on('end', () => {
        res.end();
        log('POST', '/v1/chat/completions (stream)', gatewayRes.statusCode, Date.now() - startTime);
      });
    } else {
      // 非流式响应
      let data = '';
      gatewayRes.on('data', chunk => { data += chunk; });
      gatewayRes.on('end', () => {
        res.end(data);
        log('POST', '/v1/chat/completions', gatewayRes.statusCode, Date.now() - startTime);
      });
    }
  });
  
  gatewayReq.on('error', (error) => {
    log('POST', '/v1/chat/completions', 502, Date.now() - startTime);
    sendJSON(res, 502, { error: { message: `Gateway error: ${error.message}`, type: 'gateway_error' } });
  });
  
  gatewayReq.setTimeout(60000, () => {
    gatewayReq.destroy();
    sendJSON(res, 504, { error: { message: 'Gateway timeout', type: 'timeout_error' } });
  });
  
  gatewayReq.write(JSON.stringify(body));
  gatewayReq.end();
}

// 处理 /v1/completions - 兼容旧版
async function handleCompletions(req, res) {
  // 转换为 chat/completions 格式
  const body = await parseBody(req);
  const chatBody = {
    model: body.model || 'openclaw/default',
    messages: [
      { role: 'user', content: body.prompt || '' }
    ],
    stream: body.stream || false,
  };
  
  // 重用 chat/completions 处理逻辑
  await handleChatCompletions({ ...req, url: '/v1/chat/completions' }, res);
}

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

  
  const url = new URL(req.url, `http://127.0.0.1:${CONFIG.port}`);

  // --- 路由匹配 ---
  console.log(`路由检查：${req.method} ${url.pathname}`);
  // 兼容路径：/chat/completions
  console.log('匹配到 /chat/completions');
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
      message: `Not found: ${url.pathname}`,
      type: 'not_found',
    },
  });
};

// ==================== 启动 HTTP 服务器 (3003 端口) ====================
const httpServer = http.createServer(requestHandler);
httpServer.listen(CONFIG.port, () => {
  console.log(`🚀 HTTP Server listening on port ${CONFIG.port}`);
});

// ==================== 启动 HTTPS 服务器 (3004 端口) ====================
if (httpsOptions.key) {
  const httpsServer = https.createServer(httpsOptions, requestHandler);
  httpsServer.listen(CONFIG.httpsPort, () => {
    console.log(`🔒 HTTPS Server listening on port ${CONFIG.httpsPort}`);
  });
} else {
  console.log('💡 提示：如需 HTTPS，请确保证书文件存在');
}

// ==================== 优雅关闭 ====================
const shutdown = () => {
  console.log('\n🛑 正在关闭服务器...');
  httpServer.close(() => process.exit(0));
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
