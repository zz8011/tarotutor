// store ↔ 后端 sync：登录后拉数据(bootstrap) + 旧数据导入 + 写操作增量同步
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { recordsApi, sessionsApi, diaryApi, achievementsApi, divinationsApi, dailyApi } from './data';
import { apiFetch } from './client';
import { me as authMe } from './auth';

const isLoggedIn = () => !!useAuthStore.getState().user;
const quiet = (p: Promise<unknown>) => p.catch((e: unknown) => console.warn('[sync]', e instanceof Error ? e.message : String(e)));

// 登录后：拉后端数据 → store
export async function bootstrapFromServer(): Promise<void> {
  if (!isLoggedIn()) return;
  try {
    const [progressRes, recordsRes, diaryRes, achRes, divRes, dailyRes, sessRes] = await Promise.all([
      apiFetch<{ progress: Record<string, unknown> | null }>('/progress'),
      recordsApi.list(),
      diaryApi.list(),
      achievementsApi.list(),
      divinationsApi.list(),
      dailyApi.get(),
      sessionsApi.current(),
    ]);
    const meRes = await authMe();
    const u = meRes.user;
    const s = useAppStore.getState();
    const p = progressRes.progress;
    const records = (recordsRes.records as Array<Record<string, unknown>>).reduce((acc, r) => {
      acc[String(r.card_id)] = r; return acc;
    }, {} as Record<string, unknown>);
    const d = dailyRes.daily as Record<string, unknown> | null;
    useAppStore.setState({
      userName: u.nickname ?? s.userName,
      dailyStudyTarget: (u.daily_study_target as 3 | 5 | 7) ?? s.dailyStudyTarget,
      cardDeck: (u.card_deck as 'eastern' | 'chinese-ink') ?? s.cardDeck,
      personalityType: u.personality_type ?? s.personalityType,
      primaryMentor: u.primary_mentor ?? s.primaryMentor,
      progress: {
        ...s.progress,
        currentPhase: (p?.current_phase as typeof s.progress.currentPhase) ?? s.progress.currentPhase,
        learnedCards: (p?.learned_cards as number[]) ?? s.progress.learnedCards,
        streak: (p?.streak as number) ?? s.progress.streak,
        longestStreak: (p?.longest_streak as number) ?? s.progress.longestStreak,
        totalSessions: (p?.total_sessions as number) ?? s.progress.totalSessions,
        lastStudyDate: (p?.last_study_date as string | null) ?? s.progress.lastStudyDate,
        diaryEntries: (diaryRes.entries as typeof s.progress.diaryEntries) ?? s.progress.diaryEntries,
        achievements: (achRes.achievements as typeof s.progress.achievements) ?? s.progress.achievements,
      },
      studyJournal: { ...s.studyJournal, records: records as typeof s.studyJournal.records },
      spreads: (divRes.spreads as typeof s.spreads) ?? [],
      dailyCard: d ? { cardId: d.card_id as number, date: d.date as string, orientation: d.orientation as 'upright' | 'reversed', deck: d.deck as 'eastern' | 'chinese-ink' } : null,
      currentSession: ((sessRes as { session: typeof s.currentSession | null }).session) ?? null,
    });
  } catch (e) { console.warn('[sync] bootstrap failed', e instanceof Error ? e.message : String(e)); }
}

// 首次登录：旧 localStorage 数据导入后端
export async function importLegacy(): Promise<void> {
  if (!isLoggedIn()) return;
  if (localStorage.getItem('tarot-tutor-imported') === '1') return; // 防重复 import
  const raw = localStorage.getItem('tarot-tutor-storage');
  if (!raw) return;
  try {
    const persisted = JSON.parse(raw);
    const st = persisted.state ?? persisted;
    if (typeof st !== 'object' || st === null) return; // 基本结构校验
    // 校验各字段类型，过滤畸形值
    const learnedCards: number[] = Array.isArray(st.progress?.learnedCards) ? st.progress.learnedCards.filter((x: unknown) => typeof x === 'number') : [];
    const diaryEntries: Record<string, any>[] = Array.isArray(st.progress?.diaryEntries) ? st.progress.diaryEntries : [];
    const achievements: Record<string, any>[] = Array.isArray(st.progress?.achievements) ? st.progress.achievements : [];
    const spreads: Record<string, any>[] = Array.isArray(st.spreads) ? st.spreads : [];
    const tasks: Promise<unknown>[] = [];
    for (const cardId of learnedCards) tasks.push(quiet(recordsApi.upsert(cardId, { mastered: true })));
    for (const d of diaryEntries) tasks.push(quiet(diaryApi.create({ id: d.id, cardId: d.cardId, content: d.content, mood: d.mood, tags: d.tags })));
    for (const a of achievements) tasks.push(quiet(achievementsApi.unlock({ achievementId: a.id, name: a.name, description: a.description, icon: a.icon })));
    for (const sp of spreads) tasks.push(quiet(divinationsApi.create({ id: sp.id, templateId: sp.templateId, cards: sp.cards, question: sp.question, interpretation: sp.interpretation, cardDeck: sp.cardDeck, date: sp.date })));
    if (st.progress) tasks.push(quiet(apiFetch('/progress', { method: 'PATCH', body: JSON.stringify({ current_phase: st.progress.currentPhase, learned_cards: st.progress.learnedCards, streak: st.progress.streak, longest_streak: st.progress.longestStreak, total_sessions: st.progress.totalSessions, last_study_date: st.progress.lastStudyDate }) })));
    await Promise.all(tasks);
    localStorage.setItem('tarot-tutor-imported', '1'); // 标记已导入，防重复
    localStorage.removeItem('tarot-tutor-storage');
    console.log('[sync] legacy 导入完成');
  } catch (e) { console.warn('[sync] import failed', e instanceof Error ? e.message : String(e)); }
}

// 增量同步：登录后 subscribe store 变化，新增项推后端
let prev = { diaryLen: -1, spreadsLen: -1, achLen: -1, learnedKey: '', dailyDate: '' };
export function subscribeSync(): () => void {
  const check = (state: ReturnType<typeof useAppStore.getState>) => {
    if (!isLoggedIn()) return;
    const dLen = state.progress.diaryEntries.length;
    if (prev.diaryLen >= 0 && dLen > prev.diaryLen) {
      state.progress.diaryEntries.slice(0, dLen - prev.diaryLen).forEach((d) =>
        void quiet(diaryApi.create({ id: d.id, cardId: d.cardId, content: d.content, mood: d.mood, tags: d.tags })));
    }
    prev.diaryLen = dLen;

    const sLen = state.spreads.length;
    if (prev.spreadsLen >= 0 && sLen > prev.spreadsLen) {
      state.spreads.slice(0, sLen - prev.spreadsLen).forEach((sp) =>
        void quiet(divinationsApi.create({ id: sp.id, templateId: sp.templateId, cards: sp.cards, question: sp.question, interpretation: sp.interpretation, cardDeck: sp.cardDeck, date: sp.date })));
    }
    prev.spreadsLen = sLen;

    const aLen = state.progress.achievements.length;
    if (prev.achLen >= 0 && aLen > prev.achLen) {
      state.progress.achievements.slice(0, aLen - prev.achLen).forEach((a) =>
        void quiet(achievementsApi.unlock({ achievementId: a.id, name: a.name, description: a.description, icon: a.icon })));
    }
    prev.achLen = aLen;

    const learnedKey = state.progress.learnedCards.join(',');
    if (prev.learnedKey !== '' && learnedKey !== prev.learnedKey) {
      state.progress.learnedCards.forEach((c) => void quiet(recordsApi.upsert(c, { mastered: true })));
      void quiet(apiFetch('/progress', { method: 'PATCH', body: JSON.stringify({ learned_cards: state.progress.learnedCards, streak: state.progress.streak, longest_streak: state.progress.longestStreak, total_sessions: state.progress.totalSessions }) }));
    }
    prev.learnedKey = learnedKey;

    if (state.dailyCard && state.dailyCard.date !== prev.dailyDate) {
      void quiet(dailyApi.upsert({ date: state.dailyCard.date, cardId: state.dailyCard.cardId, orientation: state.dailyCard.orientation, deck: state.dailyCard.deck, guidance: state.dailyGuidance?.content }));
      prev.dailyDate = state.dailyCard.date;
    }
  };
  // 立即记录基线（避免 bootstrap 拉来的数据被当新增重复推）
  const s = useAppStore.getState();
  prev = { diaryLen: s.progress.diaryEntries.length, spreadsLen: s.spreads.length, achLen: s.progress.achievements.length, learnedKey: s.progress.learnedCards.join(','), dailyDate: s.dailyCard?.date ?? '' };
  return useAppStore.subscribe(check);
}

// 一次性初始化（登录后调）
export async function initSync(): Promise<void> {
  await bootstrapFromServer();
  const s = useAppStore.getState();
  const serverEmpty = s.progress.totalSessions === 0 && s.progress.diaryEntries.length === 0 && s.spreads.length === 0;
  if (serverEmpty) await importLegacy();
  await bootstrapFromServer();
  subscribeSync();
}
