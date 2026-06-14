import BottomNav from '../components/BottomNav';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Award, Sparkles, BookOpen, Crown, Trophy, Flame, MoonStar, PenLine, Star,
  SlidersHorizontal, Target,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { getMentorById } from '../data/mentors';
import { achievementRules } from '../data/achievements';
import './ProfilePage.scss';

/** 成就规则表中的 icon 键 → 图标组件 */
const achievementIcons: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  'book-open': BookOpen,
  crown: Crown,
  trophy: Trophy,
  flame: Flame,
  'moon-star': MoonStar,
  'pen-line': PenLine,
  star: Star,
};

const deckOptions: { key: 'eastern' | 'chinese-ink'; label: string; desc: string }[] = [
  { key: 'eastern', label: '东方神秘', desc: '华丽神秘的东方风格' },
  { key: 'chinese-ink', label: '中国水墨', desc: '淡雅写意的水墨风格' },
];

const studyTargets = [3, 5, 7] as const;

export default function ProfilePage() {
  const navigate = useNavigate();
  const userName = useAppStore((state) => state.userName);
  const progress = useAppStore((state) => state.progress);
  const primaryMentor = useAppStore((state) => state.primaryMentor);
  const setUserName = useAppStore((state) => state.setUserName);
  const cardDeck = useAppStore((state) => state.cardDeck);
  const setCardDeck = useAppStore((state) => state.setCardDeck);
  const dailyStudyTarget = useAppStore((state) => state.dailyStudyTarget);
  const setDailyStudyTarget = useAppStore((state) => state.setDailyStudyTarget);
  const mentor = getMentorById(primaryMentor || 'luna');

  // 成就：以规则表为完整列表，已解锁状态来自 store 的真实数据
  const unlockedIds = new Set(progress.achievements.map((a) => a.id));
  const [draftName, setDraftName] = useState(userName);
  const [showMenu, setShowMenu] = useState(false);
  const logout = useAuthStore((s) => s.logout);
  const handleLogout = () => { logout(); navigate("/auth"); };
  const [isEditingName, setIsEditingName] = useState(false);

  const handleSaveName = () => {
    const trimmedName = draftName.trim();
    if (!trimmedName) return;
    setUserName(trimmedName);
    setIsEditingName(false);
  };

  const level = Math.floor(progress.learnedCards.length / 5) + 1;
  const levelTitle = level <= 3 ? '林间学徒' : level <= 6 ? '月光学者' : '星辰大师';

  return (
    <div className="profile-page">
      <header className="profile-header">
        <div className="deco-blob gold" />
        <div className="deco-blob emerald" />

        <div className="user-row">
          <div className="avatar-wrapper" onClick={() => setShowMenu((v) => !v)} style={{ cursor: 'pointer', position: 'relative' }}>
            <div className="avatar-circle">
              <span className="avatar-letter">{userName ? userName[0].toUpperCase() : '?'}</span>
            </div>
            <div className="avatar-badge">
              <Sparkles size={10} />
            </div>
            {showMenu && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, background: 'var(--bg-card, #fff)', border: '1px solid var(--border, #ccc)', borderRadius: 10, padding: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 20, minWidth: 120 }}>
                <div style={{ padding: '4px 12px', fontSize: 12, color: 'var(--text-muted, #999)', borderBottom: '1px solid var(--border, #eee)', marginBottom: 4 }}>账户</div>
                <button onClick={handleLogout} style={{ width: '100%', background: 'none', border: 'none', padding: '8px 12px', textAlign: 'left', cursor: 'pointer', color: 'crimson', fontSize: 14, borderRadius: 6 }}>退出登录</button>
              </div>
            )}
          </div>

          <div className="user-info">
            {isEditingName ? (
              <div className="name-editor">
                <input
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="输入名字"
                  className="name-input"
                  autoFocus
                />
                <button className="save-btn" onClick={handleSaveName}>保存</button>
              </div>
            ) : (
              <>
                <h1 className="user-name gold-glow" onClick={() => setIsEditingName(true)}>
                  {userName || '未命名学员'}
                </h1>
                <div className="level-badge">
                  <span>{levelTitle} Lv.{level}</span>
                </div>
              </>
            )}
          </div>

        </div>
      </header>

      <main className="profile-main">
        <section className="stats-row">
          <div className="stat-box">
            <span className="stat-val">{progress.learnedCards.length}/78</span>
            <span className="stat-label">已学卡牌</span>
          </div>
          <div className="stat-box">
            <span className="stat-val">{progress.totalSessions}</span>
            <span className="stat-label">学习次数</span>
          </div>
          <div className="stat-box">
            <span className="stat-val">{progress.streak}</span>
            <span className="stat-label">连续天数</span>
          </div>
        </section>

        {mentor && (
          <section className="mentor-section">
            <div className="mentor-row" onClick={() => navigate('/mentors')}>
              <div className="mentor-avatar-sm">
                {mentor.avatarImage ? (
                  <img src={mentor.avatarImage} alt={`${mentor.chineseName}头像`} />
                ) : (
                  <span>{mentor.avatarEmoji}</span>
                )}
              </div>
              <div className="mentor-info">
                <span className="mentor-label">当前导师</span>
                <span className="mentor-name-sm">{mentor.chineseName} · {mentor.title}</span>
              </div>
              <span className="arrow">→</span>
            </div>
          </section>
        )}

        <section className="achievements-section">
          <div className="section-header">
            <h2 className="section-title">
              <Award size={16} className="title-icon" />
              成就勋章
            </h2>
            <span className="view-all">{unlockedIds.size}/{achievementRules.length}</span>
          </div>

          <div className="badge-grid">
            {achievementRules.map((rule) => {
              const Icon = achievementIcons[rule.icon] || Sparkles;
              const unlocked = unlockedIds.has(rule.id);
              return (
                <div key={rule.id} className={`badge-item ${unlocked ? 'unlocked' : 'locked'}`} title={rule.description}>
                  <div className="badge-circle">
                    <Icon size={22} />
                    {unlocked && <div className="badge-dot" />}
                  </div>
                  <span className="badge-name">{rule.name}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="deck-section">
          <h2 className="section-title">
            <SlidersHorizontal size={16} className="title-icon" />
            牌面风格
          </h2>
          <div className="deck-list">
            {deckOptions.map((deck) => (
              <button
                key={deck.key}
                className={`deck-item ${cardDeck === deck.key ? 'active' : ''}`}
                onClick={() => setCardDeck(deck.key)}
              >
                <div className="deck-info">
                  <span className="deck-label">{deck.label}</span>
                  <span className="deck-desc">{deck.desc}</span>
                </div>
                <span className="deck-check">{cardDeck === deck.key ? '✓' : ''}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="settings-section">
          <h2 className="section-title">
            <Target size={16} className="title-icon" />
            每日学习目标
          </h2>
          <div className="target-pills" role="group" aria-label="每日学习目标">
            {studyTargets.map((target) => (
              <button
                key={target}
                type="button"
                className={`target-pill ${dailyStudyTarget === target ? 'active' : ''}`}
                onClick={() => setDailyStudyTarget(target)}
              >
                {target} 张/天
              </button>
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
