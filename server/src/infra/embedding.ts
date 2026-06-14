const BASE = process.env.LLAMA_SERVER_BASE_URL || 'http://192.168.5.111:80/v1';
const KEY = process.env.LLAMA_SERVER_API_KEY || '';
const MODEL = process.env.EMBEDDING_MODEL || 'Qwen3-Embedding-4B';

export async function embed(text: string): Promise<number[]> {
  const res = await fetch(`${BASE}/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ model: MODEL, input: text }),
  });
  if (!res.ok) throw new Error(`embedding failed: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { data: { embedding: number[] }[] };
  return json.data[0].embedding;
}

// pgvector 字面量格式：[0.1,0.2,...]
export function toPgVector(v: number[]): string {
  return `[${v.join(',')}]`;
}
