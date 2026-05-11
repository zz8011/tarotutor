import { sanitizeAiText } from '../../utils/aiText';
import { proxyBaseURL } from './config';
import type { CloudProxyOptions } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const wx: any | undefined;

export const isWechat = typeof wx !== 'undefined' && typeof wx.request === 'function';

/**
 * 通用云函数/代理调用封装（唯一合法的 AI 调用方式）
 * 所有返回文本都经过 sanitizeAiText 净化，防止 XSS
 */
export async function callCloudProxy(
  name: string,
  messages: { role: string; content: string }[],
  options: CloudProxyOptions = {}
): Promise<string> {
  const { temperature = 0.7, maxTokens = 2048 } = options;

  // 微信小程序环境
  if (isWechat) {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name,
        data: { messages, temperature, maxTokens },
        success: (res: unknown) => {
          const result = res as { result?: { result?: string; error?: string } };
          if (result.result?.error) {
            reject(new Error(result.result.error));
          } else {
            resolve(sanitizeAiText(result.result?.result || ''));
          }
        },
        fail: (err: unknown) => reject(new Error(String(err))),
      });
    });
  }

  // 开发环境：HTTP 请求到本地代理
  if (!proxyBaseURL) {
    throw new Error('未配置 API 代理地址，请在 .env.local 中设置 VITE_API_PROXY_URL');
  }

  const response = await fetch(`${proxyBaseURL}/api/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, temperature, maxTokens }),
    signal: AbortSignal.timeout(30000), // 30 秒超时
  });

  if (!response.ok) {
    throw new Error(`代理请求失败: ${response.status}`);
  }

  const data = await response.json() as { result?: string; error?: string };
  if (data.error) {
    throw new Error(data.error);
  }
  return sanitizeAiText(data.result || '');
}
