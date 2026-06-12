#!/usr/bin/env node
/**
 * 本地 AI 代理服务器（开发用，零依赖）
 *
 * 作用：在 Web 开发环境中模拟微信云函数 tarot-chat 的行为，
 * 让前端无需部署云函数即可连接真实 AI 模型。
 *
 * 用法：
 *   1. 在 .env.local 中配置 DEEPSEEK_API_KEY（或 GLM_API_KEY）
 *   2. 终端 A：npm run dev:proxy   （默认监听 http://localhost:8787）
 *   3. 在 .env.local 中设置 VITE_API_PROXY_URL=http://localhost:8787
 *   4. 终端 B：npm run dev
 *
 * 接口协议（与 src/services/ai/client.ts 的 callCloudProxy 对齐）：
 *   POST /api/tarot-chat
 *   请求体：{ messages, temperature?, maxTokens? }
 *   响应体：{ result } 或 { error }
 */

import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.AI_PROXY_PORT || 8787);

// ---- 读取 .env.local（仅取本服务需要的 key，不依赖 dotenv） ----
function loadEnvFile() {
  const envPath = resolve(rootDir, '.env.local');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue; // 已有环境变量优先
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, '');
  }
}
loadEnvFile();

// ---- 模型配置（与 cloudfunctions/tarot-chat/index.js 保持一致） ----
const MODEL_CONFIG = {
  primary: {
    baseURL: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    apiKey: process.env.DEEPSEEK_API_KEY,
  },
  fallback1: {
    baseURL: 'https://api.z.ai/api/paas/v4',
    model: 'glm-5.1',
    apiKey: process.env.GLM_API_KEY,
  },
};

async function callModel(modelKey, payload) {
  const config = MODEL_CONFIG[modelKey];
  if (!config?.apiKey) {
    return { error: `未配置 ${modelKey} 的 API Key` };
  }

  try {
    const response = await fetch(`${config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: payload.messages,
        temperature: payload.temperature ?? 0.7,
        max_tokens: payload.maxTokens ?? 2048,
      }),
      signal: AbortSignal.timeout(30000),
    });

    const data = await response.json();
    if (data.error) {
      return { error: data.error.message || 'AI 服务错误' };
    }
    return { result: data.choices?.[0]?.message?.content || '' };
  } catch (error) {
    return { error: error.message || '网络请求失败' };
  }
}

async function handleChat(payload) {
  if (!Array.isArray(payload?.messages)) {
    return { status: 400, body: { error: 'messages 参数必填且为数组' } };
  }

  let outcome = await callModel('primary', payload);
  if (outcome.error && MODEL_CONFIG.fallback1.apiKey) {
    console.log(`[proxy] 主模型失败（${outcome.error}），尝试 fallback1`);
    outcome = await callModel('fallback1', payload);
  }
  return { status: outcome.error ? 502 : 200, body: outcome };
}

const server = http.createServer(async (req, res) => {
  // CORS：vite dev server 跨端口访问
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204).end();
    return;
  }

  if (req.method === 'POST' && req.url === '/api/tarot-chat') {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', async () => {
      let payload;
      try {
        payload = JSON.parse(raw);
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '请求体不是合法 JSON' }));
        return;
      }
      const { status, body } = await handleChat(payload);
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(body));
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: `未知端点：${req.method} ${req.url}` }));
});

server.listen(PORT, () => {
  const hasPrimary = Boolean(MODEL_CONFIG.primary.apiKey);
  const hasFallback = Boolean(MODEL_CONFIG.fallback1.apiKey);
  console.log(`[proxy] AI 代理已启动：http://localhost:${PORT}`);
  console.log(`[proxy] DeepSeek key: ${hasPrimary ? '已配置' : '缺失'} | GLM key: ${hasFallback ? '已配置' : '缺失'}`);
  if (!hasPrimary && !hasFallback) {
    console.warn('[proxy] 警告：未配置任何 API Key，请在 .env.local 中设置 DEEPSEEK_API_KEY 或 GLM_API_KEY');
  }
  console.log(`[proxy] 前端请设置 VITE_API_PROXY_URL=http://localhost:${PORT}`);
});
