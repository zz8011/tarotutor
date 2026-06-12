// ============================================================
// AI 服务配置 — 强制云函数代理，禁止客户端直连 API
// ============================================================

// 开发环境代理配置说明：
// 1. 在 .env.local 中设置 VITE_API_PROXY_URL=http://localhost:3001
// 2. 启动本地代理服务器（如 simple-proxy-server 或 vite-plugin-proxy）
// 3. 代理服务器负责持有 API Key 并转发请求到实际 AI 服务商
// 4. 生产环境（微信小程序）自动使用 wx.cloud.callFunction，无需额外配置
// 5. 严禁在客户端代码中引入任何 API Key 或直连 AI 服务商的 baseURL

// 云函数端点配置
export const CLOUD_FUNCTIONS = {
  wechat: {
    chat: 'tarot-chat',
    streamChat: 'tarot-stream',
    dailyCard: 'tarot-daily',
    spread: 'tarot-spread',
    welcome: 'tarot-welcome',
  },
  dev: {
    baseURL: import.meta.env.VITE_API_PROXY_URL || '/api',
  },
};

function validateProxyURL(url: string): string {
  if (!url) return '';
  // 允许相对路径（如 /api，由同域名 Nginx 反向代理）
  if (url.startsWith('/')) return url;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      console.error(`[AI Config] 拒绝不安全的代理协议: ${parsed.protocol}`);
      return '';
    }
    // 禁止 localhost 以外的内网地址（生产环境）
    const hostname = parsed.hostname;
    const isPrivate =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.');
    if (isPrivate && import.meta.env.PROD) {
      console.error(`[AI Config] 生产环境禁止内网代理地址: ${url}`);
      return '';
    }
    return url;
  } catch {
    console.error(`[AI Config] 无效的代理 URL: ${url}`);
    return '';
  }
}

export const proxyBaseURL = validateProxyURL(CLOUD_FUNCTIONS.dev.baseURL);
