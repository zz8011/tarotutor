import BottomNav from '../components/BottomNav';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  Award, Scroll, CalendarCheck, Sparkles,
  SlidersHorizontal, Moon, Bell, HelpCircle, LogOut
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { getMentorById } from '../data/mentors';
import './ProfilePage.scss';

const achievements = [
  { icon: Scroll, name: '初识塔罗', unlocked: true },
  { icon: CalendarCheck, name: '连续7天', unlocked: true },
  { icon: Sparkles, name: '大阿卡纳', unlocked: true },
  { icon: Sparkles, name: '星辰指引', unlocked: false },
];

const settingsItems = [
  { icon: Moon, label: '深色模式' },
  { icon: Bell, label: '提醒设置' },
  { icon: HelpCircle, label: '使用帮助' },
  { icon: LogOut, label: '退出登录' },
];

const deckOptions: { key: 'eastern' | 'chinese-ink'; label: string; desc: string }[] = [
  { key: 'eastern', label: '东方神秘', desc: '华丽神秘的东方风格' },
  { key: 'chinese-ink', label: '中国水墨', desc: '淡雅写意的水墨风格' },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const userName = useAppStore((state) => state.userName);
  const progress = useAppStore((state) => state.progress);
  const primaryMentor = useAppStore((state) => state.primaryMentor);
  const setUserName = useAppStore((state) => state.setUserName);
  const cardDeck = useAppStore((state) => state.cardDeck);
  const setCardDeck = useAppStore((state) => state.setCardDeck);
  const mentor = getMentorById(primaryMentor || 'luna');
  const [draftName, setDraftName] = useState(userName);
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
          <div className="avatar-wrapper">
            <div className="avatar-circle">
              <span className="avatar-letter">{userName ? userName[0].toUpperCase() : '?'}</span>
            </div>
            <div className="avatar-badge">
              <Sparkles size={10} />
            </div>
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

          <button className="settings-btn">
            <SlidersHorizontal size={18} />
          </button>
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
            <span className="view-all">查看全部</span>
          </div>

          <div className="badge-grid">
            {achievements.map((ach, i) => {
              const Icon = ach.icon;
              return (
                <div key={i} className={`badge-item ${ach.unlocked ? 'unlocked' : 'locked'}`}>
                  <div className="badge-circle">
                    <Icon size={22} />
                    {ach.unlocked && <div className="badge-dot" />}
                  </div>
                  <span className="badge-name">{ach.name}</span>
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
            <SlidersHorizontal size={16} className="title-icon" />
            个人设置
          </h2>
          <div className="settings-list">
            {settingsItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <button key={i} className="settings-item">
                  <Icon size={18} className="item-icon" />
                  <span>{item.label}</span>
                  <span className="item-arrow">›</span>
                </button>
              );
            })}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
