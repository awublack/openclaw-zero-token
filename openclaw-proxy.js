#!/usr/bin/env node
/**
 * OpenClaw Gateway 代理层
 * 自动为所有请求添加 x-openclaw-scopes: operator.write header
 * 实现 OpenAI Completions API 格式兼容
 */

import http from 'http';
import { URL } from 'url';

const PORT = process.env.PROXY_PORT || 3003;  // 代理层端口
const GATEWAY_PORT = process.env.OPENCLAW_GATEWAY_PORT || 3002;  // Gateway 端口
const API_TOKEN = process.env.API_TOKEN || process.env.OPENCLAW_GATEWAY_TOKEN || '62b791625fa441be036acd3c206b7e14e2bb13c803355823';

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${GATEWAY_PORT}`);
  
  // 构建请求选项
  const options = {
    hostname: '127.0.0.1',
    port: GATEWAY_PORT,
    path: url.pathname + url.search,
    method: req.method,
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'x-openclaw-scopes': 'operator.write',
      'Content-Type': 'application/json',
      ...Object.fromEntries(
        Object.entries(req.headers).filter(([key]) => 
          !['host', 'authorization', 'content-length', 'x-openclaw-scopes'].includes(key.toLowerCase())
        )
      )
    }
  };

  // 转发请求到 Gateway
  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err.message);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { message: 'Gateway unavailable', type: 'proxy_error' } }));
  });

  // 转发请求体
  req.pipe(proxyReq);
});

server.listen(PORT, () => {
  console.log(`OpenClaw Proxy 已启动`);
  console.log(`监听端口：${PORT}`);
  console.log(`转发到：http://127.0.0.1:${GATEWAY_PORT}`);
  console.log(`自动添加：x-openclaw-scopes: operator.write`);
  console.log(`\nOpenAI 兼容端点：http://127.0.0.1:${PORT}/v1/chat/completions`);
});
