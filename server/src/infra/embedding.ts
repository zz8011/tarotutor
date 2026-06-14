// 通用 OpenAI 兼容 embedding。env 在 embed() 内运行时读（避免模块顶层早于 dotenv 加载）。
function cfg() {
  return {
    base: process.env.EMBEDDING_BASE_URL || 'http://192.168.5.111:80/v1',
    key: process.env.EMBEDDING_API_KEY || '',
    model: process.env.EMBEDDING_MODEL || 'Qwen3-Embedding-4B',
  };
}

export async function embed(text: string): Promise<number[]> {
  if (!text?.trim()) throw new Error('empty input');
  const { base, key, model } = cfg();

  let res: Response;
  try {
    res = await fetch(`${base}/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, input: text }),
    });
  } catch {
    throw new Error('embedding service unavailable');
  }
  if (!res.ok) throw new Error(`embedding failed: ${res.status}`);
  const json = (await res.json()) as { data?: { embedding?: number[] }[] };
  const vec = json.data?.[0]?.embedding;
  if (!Array.isArray(vec) || vec.length === 0) throw new Error('embedding response malformed');
  return vec;
}

export function toPgVector(v: number[]): string {
  return `[${v.join(',')}]`;
}
