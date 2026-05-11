import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, BookOpen, Star, Compass, User, MoonStar, WandSparkles } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { useAppStore } from '../store/useAppStore';
import { tarotCards, getCardById, getCardImagePath } from '../data/tarotCards';
import { resolveCardBackAsset } from '../data/assetManifest';
import { useMagicParticles } from '../hooks/useMagicParticles';
import { useFireflies } from '../hooks/useFireflies';
import { useDailyInsight } from '../hooks/useDailyInsight';
import AiResponse from '../components/AiResponse';
import LazyImage from '../components/common/LazyImage';
import './HomePage.scss';

const studyStageLabel = {
  observe: '观察牌面',
  symbols: '提取符号',
  teach: '导师讲解',
  scenario: '情境练习',
  quiz: '掌握测试',
  mastered: '已掌握',
} as const;

const starPositions = [
  { w: 4, h: 4, top: '10%', left: '10%', delay: 0.5 },
  { w: 4, h: 4, top: '24%', left: '80%', delay: 1.2 },
  { w: 6, h: 6, top: '40%', left: '25%', delay: 2.1 },
  { w: 2, h: 2, top: '60%', left: '67%', delay: 0.8 },
  { w: 4, h: 4, top: '70%', left: '10%', delay: 1.5 },
  { w: 6, h: 6, top: '50%', left: '95%', delay: 3 },
  { w: 4, h: 4, top: '5%', left: '50%', delay: 2.5 },
  { w: 3, h: 3, top: '85%', left: '40%', delay: 1.8 },
  { w: 5, h: 5, top: '30%', left: '60%', delay: 0.3 },
  { w: 3, h: 3, top: '15%', left: '35%', delay: 2.8 },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { progress, primaryMentor, dailyStudyTarget, setDailyStudyTarget, studyJournal } = useAppStore();
  const { dailyCardData, dailyCardDeck, currentDailyGuidance, handleDrawDaily, isFlipped, isLoadingGuidance, showGuidance } =
    useDailyInsight();

  useMagicParticles({ color: 'var(--accent-gold)', count: 8 });
  const { fireflies } = useFireflies({ count: 12 });

  const hasCompletedQuiz = !!primaryMentor;
  const learnedCount = progress.learnedCards.length;
  const totalCards = tarotCards.length;
  const learnProgress = Math.round((learnedCount / totalCards) * 100);
  const isSpreadUnlocked = learnedCount >= totalCards;
  const studyTargets = [3, 5, 7] as const;

  const activeCard = studyJournal.activeCardId != null ? getCardById(studyJournal.activeCardId) : null;
  const dueReviewCount = Object.values(studyJournal.records).filter((record) => {
    if (!record.nextReviewAt) return false;
    return new Date(record.nextReviewAt).getTime() <= Date.now();
  }).length;

  const quickActions = [
    { icon: Compass, label: '性格测试', path: '/quiz', desc: '发现你的灵魂导师' },
    { icon: User, label: '导师选择', path: '/mentors', desc: '选择你的引路人' },
    { icon: BookOpen, label: '卡牌学习', path: '/learn', desc: '深入每张牌的奥秘' },
    {
      icon: Star,
      label: '牌阵占卜',
      path: '/spread',
      desc: isSpreadUnlocked ? '探索命运的指引方向' : `学完全部牌后解锁（剩余 ${totalCards - learnedCount} 张）`,
      disabled: !isSpreadUnlocked,
    },
  ];

  return (
    <div className="home-page">
      <div className="stars-bg">
        {starPositions.map((s, i) => (
          <div
            key={i}
            className="star"
            style={{ width: s.w, height: s.h, top: s.top, left: s.left, animationDelay: `${s.delay}s` }}
          />
        ))}
      </div>

      <div className="fireflies-bg">
        {fireflies.map((f) => (
          <div
            key={f.id}
            className="firefly"
            style={
              {
                left: f.left,
                top: f.top,
                animationDelay: f.delay,
                animationDuration: f.duration,
                '--move-x': f.moveX,
                '--move-y': f.moveY,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <header className="home-header">
        <h1 className="title-gradient">神秘塔罗学院</h1>
        <p className="title-sub">MYSTIC TAROT ACADEMY</p>
      </header>

      <main className="home-main">
        <section className="daily-section">
          <h2 className="section-label">
            <Sparkles size={14} />
            今日启示
            <Sparkles size={14} />
          </h2>

          <div className={`card-container ${isFlipped ? 'card-flipped' : ''}`} onClick={handleDrawDaily}>
            <div className="card-inner">
              <div className="card-front daily-card">
                <div className="card-back-art">
                  <LazyImage src={resolveCardBackAsset(dailyCardDeck)} alt="塔罗牌背" className="daily-card-back-image" placeholder="card-back" />
                  <div className="card-back-caption">
                    <MoonStar size={22} className="card-icon" />
                    <span className="card-hint">点击翻开灵感</span>
                  </div>
                </div>
              </div>
              <div className="card-back daily-card">
                {dailyCardData ? (
                  <div className="card-face">
                    <div className="card-image-area">
                      <LazyImage
                        src={getCardImagePath(dailyCardData.id, dailyCardDeck)}
                        alt={dailyCardData.chineseName}
                        className="daily-card-image"
                        placeholder="skeleton"
                      />
                      <div className="card-number-label">{dailyCardData.number}</div>
                    </div>
                    <div className="card-info-area">
                      <p className="card-numeral">{dailyCardData.number}</p>
                      <h3 className="card-name">{dailyCardData.chineseName}</h3>
                      <p className="card-keywords">{dailyCardData.keywords.slice(0, 3).join(' · ')}</p>
                    </div>
                  </div>
                ) : (
                  <div className="card-face">
                    <div className="card-image-area">
                      <Sparkles size={32} className="card-icon" />
                    </div>
                    <div className="card-info-area">
                      <h3 className="card-name">翻开你的牌</h3>
                      <p className="card-keywords">点击抽取今日卡牌</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {showGuidance && currentDailyGuidance && (
            <motion.div className="daily-guidance glass-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <AiResponse text={currentDailyGuidance} />
            </motion.div>
          )}

          {isLoadingGuidance && <p className="loading-text">正在解读中...</p>}
        </section>

        <section className="study-dock">
          <div className="study-dock-card glass-dark">
            <div className="study-dock-copy">
              <span className="study-dock-label">学习系统</span>
              <h3 className="study-dock-title">{activeCard ? `继续学 ${activeCard.chineseName}` : '今天从一张牌开始'}</h3>
                <p className="study-dock-text">
                  {activeCard
                    ? `当前阶段：${studyStageLabel[studyJournal.activeStage] || '学习中'} · 待复习 ${dueReviewCount} 张`
                    : `每天按自己的节奏学 ${dailyStudyTarget} 张，学完的牌会自动进入复习节奏。`}
                </p>
            </div>
            <div className="study-dock-actions">
              <button type="button" className="study-dock-btn primary" onClick={() => navigate(activeCard ? `/learn/${activeCard.id}` : '/library')}>
                {activeCard ? '继续学习' : '去牌库开始'}
              </button>
              <button type="button" className="study-dock-btn secondary" onClick={() => navigate('/library')}>
                打开牌库
              </button>
            </div>
          </div>
        </section>

        {!hasCompletedQuiz && (
          <motion.section className="cta-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <div className="cta-card glass-dark" onClick={() => navigate('/quiz')}>
              <div className="cta-icon">
                <WandSparkles size={28} />
              </div>
              <div className="cta-content">
                <h3>开始灵魂之旅</h3>
                <p>完成性格测试，找到你的专属塔罗导师</p>
              </div>
              <span className="cta-arrow">→</span>
            </div>
          </motion.section>
        )}

        {hasCompletedQuiz && (
          <section className="progress-section">
            <div className="progress-header">
              <span className="progress-label">学习进度</span>
              <span className="progress-value">
                {learnedCount}/{totalCards}
              </span>
            </div>
            <div className="progress-track">
              <motion.div
                className="progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${learnProgress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </section>
        )}

        <motion.section className="plan-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.26 }}>
          <div className="plan-card glass-dark">
            <div className="plan-copy">
              <span className="plan-label">学习计划</span>
              <p>每天按自己的节奏学一组，学完全部 78 张后再进入牌阵。</p>
            </div>
            <div className="plan-pills" role="group" aria-label="每日学习计划">
              {studyTargets.map((target) => (
                <button
                  key={target}
                  type="button"
                  className={`plan-pill ${dailyStudyTarget === target ? 'active' : ''}`}
                  onClick={() => setDailyStudyTarget(target)}
                >
                  {target} 张/天
                </button>
              ))}
            </div>
          </div>
        </motion.section>

        <section className="actions-grid">
          {quickActions.map((action, i) => (
            <motion.button
              key={action.path}
              className={`action-card glass-dark ${action.disabled ? 'disabled' : ''}`}
              onClick={() => {
                if (action.disabled) return;
                navigate(action.path);
              }}
              disabled={action.disabled}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.08 * i + 0.15 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="action-icon">
                <action.icon size={24} />
              </div>
              <span className="action-label">{action.label}</span>
              <span className="action-desc">{action.desc}</span>
            </motion.button>
          ))}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
