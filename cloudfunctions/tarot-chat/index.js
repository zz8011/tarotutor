/**
 * 微信小程序云函数 — tarot-chat
 * 部署路径：cloudfunctions/tarot-chat/index.js
 * 
 * 功能：接收前端聊天请求，转发到 DeepSeek/GLM API，返回结果
 * 安全：API Key 存储在云函数环境变量中，前端不可见
 */

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// 从云函数环境变量读取密钥（微信公众平台配置）
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const GLM_API_KEY = process.env.GLM_API_KEY;

// 模型配置
const MODEL_CONFIG = {
  primary: {
    baseURL: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    apiKey: DEEPSEEK_API_KEY,
  },
  fallback1: {
    baseURL: 'https://api.z.ai/api/paas/v4',
    model: 'glm-5.1',
    apiKey: GLM_API_KEY,
  },
};

exports.main = async (event, context) => {
  const { messages, temperature = 0.7, maxTokens = 2048, model = 'primary' } = event;

  if (!messages || !Array.isArray(messages)) {
    return { error: 'messages 参数必填且为数组' };
  }

  const config = MODEL_CONFIG[model] || MODEL_CONFIG.primary;

  if (!config.apiKey) {
    return { error: `未配置 ${model} 的 API Key` };
  }

  try {
    const response = await cloud.httpRequest({
      url: `${config.baseURL}/chat/completions`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: {
        model: config.model,
        messages,
        temperature,
        max_tokens: maxTokens,
      },
      timeout: 30000,
    });

    const data = response.body;

    if (data.error) {
      // 主模型失败，尝试 fallback
      if (model === 'primary' && MODEL_CONFIG.fallback1.apiKey) {
        console.log('[Cloud] 主模型失败，尝试 fallback1');
        return exports.main({ ...event, model: 'fallback1' }, context);
      }
      return { error: data.error.message || 'AI 服务错误' };
    }

    const result = data.choices?.[0]?.message?.content || '';
    return { result };

  } catch (error) {
    console.error('[Cloud] 请求失败:', error);

    // 网络错误时尝试 fallback
    if (model === 'primary' && MODEL_CONFIG.fallback1.apiKey) {
      console.log('[Cloud] 主模型网络错误，尝试 fallback1');
      return exports.main({ ...event, model: 'fallback1' }, context);
    }

    return { error: error.message || '网络请求失败' };
  }
};
