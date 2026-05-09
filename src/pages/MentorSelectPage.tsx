import { useState } from 'react';
import BottomNav from '../components/BottomNav';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Star, X, Sparkles, UserRound } from 'lucide-react';
import { mentors } from '../data/mentors';
import { useAppStore } from '../store/useAppStore';
import './MentorSelectPage.scss';

export default function MentorSelectPage() {
  const { primaryMentor, setPrimaryMentor } = useAppStore();
  const [viewedMentorId, setViewedMentorId] = useState<string | null>(null);

  const viewedMentor = mentors.find((mentor) => mentor.id === viewedMentorId) || null;

  return (
    <div className="mentor-page">
      <div className="grain-overlay" />

      <header className="mentor-header">
        <span className="header-star"><Star size={18} /></span>
        <h1 className="header-title">选择你的灵魂导师</h1>
        <div className="header-divider" />
      </header>

      <main className="mentor-main">
        <div className="mentor-grid">
          {mentors.map((mentor, i) => {
            const isSelected = primaryMentor === mentor.id;
            return (
              <motion.div
                key={mentor.id}
                className={`mentor-card ${isSelected ? 'selected' : ''}`}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                whileTap={{ scale: 0.98 }}
              >
                <button className="mentor-hero" onClick={() => setViewedMentorId(mentor.id)}>
                  <div className="mentor-portrait">
                    {mentor.avatarImage ? (
                      <img className="mentor-avatar-img" src={mentor.avatarImage} alt={`${mentor.chineseName}头像`} />
                    ) : (
                      <span className="avatar-emoji">{mentor.avatarEmoji}</span>
                    )}
                  </div>
                  <span className="view-badge">
                    <Sparkles size={12} />
                    查看大图
                  </span>
                </button>

                <h3 className="card-name">{mentor.chineseName}</h3>
                <span className="card-specialty">{mentor.title}</span>
                <p className="card-desc">{mentor.personality}</p>

                <div className="mentor-actions">
                  <button className={`select-btn ${isSelected ? 'selected' : ''}`} onClick={() => setPrimaryMentor(mentor.id)}>
                    {isSelected ? (
                      <>
                        <Check size={14} /> 已选择
                      </>
                    ) : (
                      '选择导师'
                    )}
                  </button>
                  <button className="detail-btn" onClick={() => setViewedMentorId(mentor.id)}>
                    <UserRound size={14} />
                    详情
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>

      <AnimatePresence>
        {viewedMentor && (
          <motion.div
            className="mentor-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setViewedMentorId(null)}
          >
            <motion.div
              className="mentor-modal-card"
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ duration: 0.24 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close" onClick={() => setViewedMentorId(null)} aria-label="关闭">
                <X size={16} />
              </button>

              <div className="modal-portrait">
                {viewedMentor.avatarImage ? (
                  <img src={viewedMentor.avatarImage} alt={viewedMentor.chineseName} />
                ) : (
                  <span className="modal-emoji">{viewedMentor.avatarEmoji}</span>
                )}
              </div>

              <div className="modal-info">
                <span className="modal-tag">
                  <Sparkles size={12} />
                  {viewedMentor.title}
                </span>
                <h2>{viewedMentor.chineseName}</h2>
                <p className="modal-desc">{viewedMentor.personality}</p>
                <p className="modal-desc">{viewedMentor.teachingStyle}</p>

                <div className="modal-chip-list">
                  {viewedMentor.specialties.map((tag) => (
                    <span key={tag} className="modal-chip">{tag}</span>
                  ))}
                </div>

                <div className="modal-section">
                  <h3>导师寄语</h3>
                  <p>{viewedMentor.greeting}</p>
                </div>

                <div className="modal-section">
                  <h3>示范风格</h3>
                  <p>{viewedMentor.sampleResponse}</p>
                </div>

                <button
                  className={`modal-select-btn ${primaryMentor === viewedMentor.id ? 'selected' : ''}`}
                  onClick={() => setPrimaryMentor(viewedMentor.id)}
                >
                  {primaryMentor === viewedMentor.id ? '当前导师' : '设为当前导师'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
