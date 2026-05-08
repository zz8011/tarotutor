import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, BookOpen, Star, Compass, User, MoonStar, WandSparkles } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { useAppStore } from '../store/useAppStore';
import { getDailyCardGuidance } from '../services/ai';
import { getCardById, getCardImagePath } from '../data/tarotCards';
import { useState, useMemo } from 'react';
import { useMagicParticles } from '../hooks/useMagicParticles';
import { useFireflies } from '../hooks/useFireflies';
import './HomePage.scss';

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
  const { progress, dailyCard, drawDailyCard, primaryMentor, cardDeck } = useAppStore();
  const [dailyGuidance, setDailyGuidance] = useState('');
  const [isLoadingGuidance, setIsLoadingGuidance] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  // Initialize magic particles and fireflies
  useMagicParticles({ color: 'var(--accent-gold)', count: 8 });
  const { fireflies } = useFireflies({ count: 12 });

  const hasCompletedQuiz = !!primaryMentor;
  const learnedCount = progress.learnedCards.length;
  const totalCards = 78;
  const learnProgress = Math.round((learnedCount / totalCards) * 100);

  const dailyCardData = useMemo(() => {
    if (!dailyCard) return null;
    return getCardById(dailyCard.cardId);
  }, [dailyCard]);

  const handleDrawDaily = async () => {
    if (dailyCard) {
      setIsFlipped(true);
      return;
    }
    const nextDailyCard = await drawDailyCard();
    const card = getCardById(nextDailyCard.cardId);
    if (!card) return;
    setIsFlipped(true);
    setIsLoadingGuidance(true);
    try {
      const guidance = await getDailyCardGuidance(card, nextDailyCard.orientation);
      setDailyGuidance(guidance);
    } catch (error) {
      console.error('每日指引获取失败:', error);
    } finally {
      setIsLoadingGuidance(false);
    }
  };

  const quickActions = [
    { icon: Compass, label: '性格测试', path: '/quiz', desc: '发现你的灵魂导师' },
    { icon: User, label: '导师选择', path: '/mentors', desc: '选择你的引路人' },
    { icon: BookOpen, label: '卡牌学习', path: '/learn', desc: '深入每张牌的奥秘' },
    { icon: Star, label: '牌阵占卜', path: '/spread', desc: '探索命运的指引' },
  ];

  return (
    <div className="home-page">
      {/* Animated Background */}
      <div className="stars-bg">
        {starPositions.map((s, i) => (
          <div
            key={i}
            className="star"
            style={{
              width: s.w, height: s.h,
              top: s.top, left: s.left,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Fireflies Background */}
      <div className="fireflies-bg">
        {fireflies.map((f) => (
          <div
            key={f.id}
            className="firefly"
            style={{
              left: f.left,
              top: f.top,
              animationDelay: f.delay,
              animationDuration: f.duration,
              '--move-x': f.moveX,
              '--move-y': f.moveY,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Header */}
      <header className="home-header">
        <h1 className="title-gradient">神秘塔罗学院</h1>
        <p className="title-sub">MYSTIC TAROT ACADEMY</p>
      </header>

      {/* Main Content */}
      <main className="home-main">
        {/* Daily Card Section */}
        <section className="daily-section">
          <h2 className="section-label">
            <Sparkles size={14} />
            今日启示
            <Sparkles size={14} />
          </h2>

          <div className={`card-container ${isFlipped ? 'card-flipped' : ''}`} onClick={handleDrawDaily}>
            <div className="card-inner">
              {/* Back */}
              <div className="card-front daily-card">
                <div className="card-back-design">
                  <div className="card-inner-border">
                    <MoonStar size={32} className="card-icon" />
                    <span className="card-hint">点击翻开灵感</span>
                  </div>
                </div>
              </div>
              {/* Front */}
              <div className="card-back daily-card">
                {dailyCardData ? (
                  <div className="card-face">
                    <div className="card-image-area">
                      <img
                        src={getCardImagePath(dailyCardData.id, cardDeck)}
                        alt={dailyCardData.chineseName}
                        className="daily-card-image"
                        key={`daily-${dailyCardData.id}-${cardDeck}`}
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

          {dailyGuidance && (
            <motion.div
              className="daily-guidance glass-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p>{dailyGuidance}</p>
            </motion.div>
          )}

          {isLoadingGuidance && (
            <p className="loading-text">正在解读中...</p>
          )}
        </section>

        {/* Learning Progress */}
        {!hasCompletedQuiz && (
          <motion.section
            className="cta-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="cta-card glass-dark" onClick={() => navigate('/quiz')}>
              <div className="cta-icon"><WandSparkles size={28} /></div>
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
              <span className="progress-value">{learnedCount}/{totalCards}</span>
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

        {/* Quick Actions Grid */}
        <section className="actions-grid">
          {quickActions.map((action, i) => (
            <motion.button
              key={action.path}
              className="action-card glass-dark"
              onClick={() => navigate(action.path)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i + 0.2 }}
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
