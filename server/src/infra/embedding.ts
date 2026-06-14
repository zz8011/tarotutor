// 通用 OpenAI 兼容 embedding 客户端。
// 支持 GPUStack / 火山引擎 ARK(doubao-embedding)/ 智谱 / OpenAI 等。
// 生产用公网 API（火山引擎），开发可指向局域网 GPUStack。
const BASE = process.env.EMBEDDING_BASE_URL || 'http://192.168.5.111:80/v1';
const KEY = process.env.EMBEDDING_API_KEY || '';
const MODEL = process.env.EMBEDDING_MODEL || 'Qwen3-Embedding-4B';

export async function embed(text: string): Promise<number[]> {
  if (!text?.trim()) throw new Error('empty input');

  let res: Response;
  try {
    res = await fetch(`${BASE}/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({ model: MODEL, input: text }),
    });
  } catch {
    // 不暴露内部错误细节（HIGH: error message leakage）
    throw new Error('embedding service unavailable');
  }

  if (!res.ok) {
    // 只暴露 status，不暴露 body（可能含内部信息）
    throw new Error(`embedding failed: ${res.status}`);
  }

  const json = (await res.json()) as { data?: { embedding?: number[] }[] };
  const vec = json.data?.[0]?.embedding;
  if (!Array.isArray(vec) || vec.length === 0) throw new Error('embedding response malformed');
  return vec;
}

export function toPgVector(v: number[]): string {
  return `[${v.join(',')}]`;
}
