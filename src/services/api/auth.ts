import { apiFetch } from './client';

export interface AuthUser {
  id: string; email: string; nickname: string | null;
  daily_study_target?: number; card_deck?: string;
  personality_type?: string | null; primary_mentor?: string | null;
}

export async function register(email: string, password: string, nickname?: string): Promise<{ token: string; user: AuthUser }> {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, nickname }),
  });
}

export async function login(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  return apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export async function me(): Promise<{ user: AuthUser }> {
  return apiFetch('/auth/me');
}
