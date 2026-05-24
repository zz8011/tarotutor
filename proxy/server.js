/**
 * AI API 代理服务器
 * 安全原则：API Key 只存在服务器环境变量，绝不暴露给客户端
 */
const http = require('http');
const https = require('https');
const url = require('url');

const PORT = process.env.PROXY_PORT || 3001;
const API_KEY = process.env.DEEPSEEK_API_KEY;
const API_BASE = process.env.DEEPSEEK_API_BASE || 'https://api.deepseek.com';

// 允许的客户端 origin（生产环境 + 本地开发）
const ALLOWED_ORIGINS = [
  'https://taro.renchengzhang.com',
  'http://localhost:5173',
  'http://localhost:3000',
];

function setCORS(res, origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  res.setHeader('Access-Control-Allow-Origin', allowed);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(data)); } catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

function proxyToDeepSeek(path, body) {
  return new Promise((resolve, reject) => {
    const apiUrl = new URL(path, API_BASE);
    const postData = JSON.stringify(body);
    const options = {
      hostname: apiUrl.hostname,
      port: apiUrl.port || 443,
      path: apiUrl.pathname + apiUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Length': Buffer.byteLength(postData),
      },
      timeout: 30000,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, body: json });
        } catch {
          resolve({ status: res.statusCode, body: { error: data } });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('timeout')));
    req.write(postData);
    req.end();
  });
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || '';
  setCORS(res, origin);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 只接受 POST
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  // 检查 API Key
  if (!API_KEY) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Server API Key not configured' }));
    return;
  }

  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  // 路由映射：/api/tarot-chat -> /chat/completions
  const routeMap = {
    '/api/tarot-chat': '/chat/completions',
    '/api/tarot-stream': '/chat/completions',
    '/api/tarot-daily': '/chat/completions',
    '/api/tarot-spread': '/chat/completions',
    '/api/tarot-welcome': '/chat/completions',
  };

  const apiPath = routeMap[pathname];
  if (!apiPath) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unknown endpoint' }));
    return;
  }

  try {
    const body = await readBody(req);
    const messages = body.messages || [];
    const temperature = typeof body.temperature === 'number' ? body.temperature : 0.7;
    const maxTokens = body.maxTokens || 2048;

    const payload = {
      model: 'deepseek-chat',
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: pathname === '/api/tarot-stream',
    };

    const result = await proxyToDeepSeek(apiPath, payload);

    if (result.status >= 200 && result.status < 300) {
      const content = result.body.choices?.[0]?.message?.content || '';
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ result: content }));
    } else {
      res.writeHead(result.status || 502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: result.body.error?.message || 'API error' }));
    }
  } catch (err) {
    console.error('[Proxy Error]', err.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal proxy error' }));
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`AI Proxy running on http://127.0.0.1:${PORT}`);
});
