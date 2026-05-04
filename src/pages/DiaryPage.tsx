import BottomNav from '../components/BottomNav';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Calendar, Sparkles } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { getCardById } from '../data/tarotCards';
import './DiaryPage.scss';

export default function DiaryPage() {
  const navigate = useNavigate();
  const { progress } = useAppStore();

  return (
    <div className="diary-page page-container">
      <div className="diary-header">
        <button className="back-btn" aria-label="返回" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <h1>心灵图鉴</h1>
      </div>

      <div className="diary-stats card-glass">
        <div className="stat">
          <Sparkles size={24} className="stat-icon" />
          <span className="stat-value">{progress.diaryEntries.length}</span>
          <span className="stat-label">日记篇数</span>
        </div>
        <div className="stat">
          <BookOpen size={24} className="stat-icon" />
          <span className="stat-value">{progress.learnedCards.length}</span>
          <span className="stat-label">已学卡牌</span>
        </div>
        <div className="stat">
          <Calendar size={24} className="stat-icon" />
          <span className="stat-value">{progress.streak}</span>
          <span className="stat-label">连续天数</span>
        </div>
      </div>

      <div className="diary-entries">
        {progress.diaryEntries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📖</div>
            <p>还没有学习日记</p>
            <span>完成一次学习后，可以记录你的感受</span>
          </div>
        ) : (
          progress.diaryEntries.map((entry, index) => {
            const card = getCardById(entry.cardId);
            return (
              <motion.div
                key={entry.id}
                className="diary-entry card-glass"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="entry-header">
                  <span className="entry-date">{new Date(entry.date).toLocaleDateString('zh-CN')}</span>
                  <span className="entry-card">{card?.chineseName}</span>
                </div>
                <p className="entry-content">{entry.content}</p>
              </motion.div>
            );
          })
        )}
      </div>
          <BottomNav />
    </div>
  );
}
