import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, BookOpen, Star, Compass, User } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { getDailyCardGuidance } from '../services/ai';
import { getCardById } from '../data/tarotCards';
import { useState } from 'react';
import './HomePage.scss';

export default function HomePage() {
  const navigate = useNavigate();
  const { userName, progress, dailyCard, drawDailyCard, primaryMentor } = useAppStore();
  const [dailyGuidance, setDailyGuidance] = useState('');
  const [isLoadingGuidance, setIsLoadingGuidance] = useState(false);

  const hasCompletedQuiz = !!primaryMentor;

  // 抽取每日卡牌并获取 AI 指引
  const handleDrawDaily = async () => {
    drawDailyCard();
    
    // 获取 AI 解读
    if (!dailyCard) return;
    const card = getCardById(dailyCard.cardId);
    if (!card) return;
    
    setIsLoadingGuidance(true);
    try {
      const guidance = await getDailyCardGuidance(card, dailyCard.orientation as 'upright' | 'reversed');
      setDailyGuidance(guidance);
    } catch (error) {
      console.error('每日指引获取失败:', error);
    } finally {
      setIsLoadingGuidance(false);
    }
  };

  return (
    <div className="home-page page-container">
      {/* Header */}
      <motion.header
        className="home-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="logo-section">
          <div className="logo-icon">🔮</div>
          <div>
            <h1 className="app-title text-gradient">AI 塔罗导师</h1>
            <p className="app-subtitle">像与一位有智慧的老师对话一样学习塔罗</p>
          </div>
        </div>
        {userName && (
          <div className="user-greeting">
            <span>欢迎，{userName}</span>
            <button className="profile-btn" onClick={() => navigate('/profile')}>
              <User size={20} />
            </button>
          </div>
        )}
      </motion.header>

      {/* Quiz CTA - 性格测试引导 */}
      {!hasCompletedQuiz && (
        <motion.section
          className="quiz-cta-section card-glass"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
        >
          <div className="quiz-cta-content">
            <div className="quiz-cta-icon">🧭</div>
            <div className="quiz-cta-text">
              <h3>开启你的塔罗之旅</h3>
              <p>完成性格测试，找到最适合你的AI导师</p>
            </div>
            <button className="btn-primary quiz-cta-btn" onClick={() => navigate('/quiz')}>
              开始测试
            </button>
          </div>
        </motion.section>
      )}

      {/* Daily Card Section */}
      <motion.section
        className="daily-card-section card-glass"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <div className="section-header">
          <Sparkles size={20} className="icon-gold" />
          <h2>今日灵感卡牌</h2>
        </div>
        {dailyCard ? (
          <div className="daily-card-display">
            <div className="card-mini">{dailyCard.orientation === 'upright' ? '🃏' : '🃏'}</div>
            <p className="card-status">今日已抽取 · 点击开始体验</p>
            
            {/* AI 每日指引 */}
            {isLoadingGuidance ? (
              <div className="guidance-loading">
                <div className="spinner" />
                <span>正在获取今日指引...</span>
              </div>
            ) : dailyGuidance ? (
              <motion.div
                className="daily-guidance card-glass"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="guidance-content">
                  {dailyGuidance.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </motion.div>
            ) : null}
            
            <button className="btn-primary" onClick={() => navigate(`/learn/${dailyCard.cardId}?mode=interpret`)}>
              开始体验
            </button>
          </div>
        ) : (
          <div className="daily-card-empty">
            <div className="card-placeholder pulse-glow">🎴</div>
            <p>今天的牌正在等待你...</p>
            <button className="btn-primary" onClick={handleDrawDaily}>
              <Sparkles size={18} />
              {isLoadingGuidance ? '连接中...' : '抽取今日卡牌'}
            </button>
          </div>
        )}
      </motion.section>

      {/* Quick Actions */}
      <motion.section
        className="quick-actions"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <h3 className="section-title">快速入口</h3>
        <div className="action-grid">
          <button className="action-card action-library" onClick={() => navigate('/library')}>
            <BookOpen size={28} />
            <span>卡牌学习</span>
            <small>78张塔罗牌完整解读</small>
          </button>
          <button className="action-card action-spread" onClick={() => navigate('/spread')}>
            <Star size={28} />
            <span>牌阵练习</span>
            <small>经典牌阵模拟解读</small>
          </button>
          <button className="action-card action-diary" onClick={() => navigate('/diary')}>
            <Sparkles size={28} />
            <span>心灵图鉴</span>
            <small>记录你的塔罗成长</small>
          </button>
          <button className="action-card action-mentors" onClick={() => navigate('/mentors')}>
            <Compass size={28} />
            <span>导师全览</span>
            <small>查看所有AI导师</small>
          </button>
        </div>
      </motion.section>

      {/* Progress Overview */}
      {progress.learnedCards.length > 0 && (
        <motion.section
          className="progress-overview card-glass"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="section-title">学习进度</h3>
          <div className="progress-stats">
            <div className="stat">
              <span className="stat-value">{progress.learnedCards.length}</span>
              <span className="stat-label">已学卡牌</span>
            </div>
            <div className="stat">
              <span className="stat-value">{progress.totalSessions}</span>
              <span className="stat-label">学习次数</span>
            </div>
            <div className="stat">
              <span className="stat-value">{progress.streak}</span>
              <span className="stat-label">连续天数</span>
            </div>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(progress.learnedCards.length / 78) * 100}%` }}
            />
          </div>
          <p className="progress-text">
            已完成 {Math.round((progress.learnedCards.length / 78) * 100)}% · {progress.currentPhase}
          </p>
        </motion.section>
      )}

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <button className="nav-item active" onClick={() => navigate('/')}>
          <Sparkles size={22} />
          <span>首页</span>
        </button>
        <button className="nav-item" onClick={() => navigate('/library')}>
          <BookOpen size={22} />
          <span>百科</span>
        </button>
        <button className="nav-item" onClick={() => navigate('/spread')}>
          <Star size={22} />
          <span>牌阵</span>
        </button>
        <button className="nav-item" onClick={() => navigate('/profile')}>
          <User size={22} />
          <span>我的</span>
        </button>
      </nav>
    </div>
  );
}
