// 后端 API 客户端。base /tutor/（生产 nginx 反代，dev vite proxy）。
const BASE = '/tutor';

export function getToken(): string | null {
  return localStorage.getItem('tarot-auth-token');
}
export function setToken(token: string | null): void {
  if (token) localStorage.setItem('tarot-auth-token', token);
  else localStorage.removeItem('tarot-auth-token');
}

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const j = await res.json(); msg = (j as { error?: string }).error ?? msg; } catch { /* ignore */ }
    if (res.status === 401) setToken(null); // token 失效清掉
    throw new ApiError(res.status, msg);
  }
  return res.json() as Promise<T>;
}
