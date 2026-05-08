import BottomNav from '../components/BottomNav';
import { motion } from 'framer-motion';
import { Check, Star } from 'lucide-react';
import { mentors } from '../data/mentors';
import { useAppStore } from '../store/useAppStore';
import './MentorSelectPage.scss';

export default function MentorSelectPage() {
  const { primaryMentor, setPrimaryMentor } = useAppStore();

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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => setPrimaryMentor(mentor.id)}
                whileTap={{ scale: 0.96 }}
              >
                <div className="avatar-ring">
                  {mentor.avatarImage ? (
                    <img className="mentor-avatar-img" src={mentor.avatarImage} alt={`${mentor.chineseName}头像`} />
                  ) : (
                    <span className="avatar-emoji">{mentor.avatarEmoji}</span>
                  )}
                </div>
                <h3 className="card-name">{mentor.chineseName}</h3>
                <span className="card-specialty">{mentor.title}</span>
                <p className="card-desc">{mentor.personality.slice(0, 40)}...</p>
                <button className={`select-btn ${isSelected ? 'selected' : ''}`}>
                  {isSelected ? (
                    <><Check size={14} /> 已选择</>
                  ) : (
                    '选择'
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
