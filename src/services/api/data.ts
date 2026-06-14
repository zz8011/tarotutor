// 各数据类型的后端 sync API（对应 server domain routes）
import { apiFetch } from './client';

// 学习记录（间隔重复）
export const recordsApi = {
  list: () => apiFetch<{ records: unknown[] }>('/records'),
  due: () => apiFetch<{ records: unknown[] }>('/records/due'),
  upsert: (cardId: number, data: Record<string, unknown>) =>
    apiFetch(`/records/${cardId}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// 学习会话
export const sessionsApi = {
  start: (id: string, cardId: number, mentorId?: string, orientation?: string) =>
    apiFetch('/sessions', { method: 'POST', body: JSON.stringify({ id, cardId, mentorId, orientation }) }),
  current: () => apiFetch('/sessions/current'),
  patch: (id: string, patch: Record<string, unknown>) =>
    apiFetch(`/sessions/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  addMessage: (sessionId: string, msg: { id: string; role: string; content: string; phase?: string }) =>
    apiFetch(`/sessions/${sessionId}/messages`, { method: 'POST', body: JSON.stringify(msg) }),
  end: (id: string) => apiFetch(`/sessions/${id}/end`, { method: 'POST' }),
};

// 日记
export const diaryApi = {
  list: () => apiFetch<{ entries: unknown[] }>('/diary'),
  create: (entry: { id: string; cardId?: number; content: string; mood?: string; tags?: string[] }) =>
    apiFetch('/diary', { method: 'POST', body: JSON.stringify(entry) }),
  remove: (id: string) => apiFetch(`/diary/${id}`, { method: 'DELETE' }),
};

// 成就
export const achievementsApi = {
  list: () => apiFetch<{ achievements: unknown[] }>('/achievements'),
  unlock: (a: { achievementId: string; name?: string; description?: string; icon?: string }) =>
    apiFetch('/achievements', { method: 'POST', body: JSON.stringify(a) }),
};

// 占卜历史
export const divinationsApi = {
  list: () => apiFetch<{ spreads: unknown[] }>('/divinations'),
  create: (d: Record<string, unknown>) =>
    apiFetch('/divinations', { method: 'POST', body: JSON.stringify(d) }),
};

// 每日牌
export const dailyApi = {
  get: (date?: string) => apiFetch<{ daily: unknown | null }>(`/daily${date ? `?date=${date}` : ''}`),
  upsert: (d: { date: string; cardId: number; orientation?: string; deck?: string; guidance?: string }) =>
    apiFetch('/daily', { method: 'POST', body: JSON.stringify(d) }),
};

// 导师记忆（对话结束提炼 + 开场检索）
export const mentorApi = {
  write: (mentorId: string, text: string, sessionId?: string) =>
    apiFetch('/mentor/memory', { method: 'POST', body: JSON.stringify({ mentorId, text, sessionId }) }),
  search: (mentorId: string, text: string, limit = 5) =>
    apiFetch<{ memories: { id: string; memory_text: string; created_at: string; distance: number }[] }>(
      `/mentor/memory/search?mentorId=${encodeURIComponent(mentorId)}&text=${encodeURIComponent(text)}&limit=${limit}`
    ),
};
