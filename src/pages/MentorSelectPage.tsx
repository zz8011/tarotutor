import BottomNav from '../components/BottomNav';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check } from 'lucide-react';
import { mentors } from '../data/mentors';
import { useAppStore } from '../store/useAppStore';
import './MentorSelectPage.scss';

export default function MentorSelectPage() {
  const navigate = useNavigate();
  const { primaryMentor, setPrimaryMentor } = useAppStore();

  return (
    <div className="mentor-page page-container">
      <div className="mentor-header">
        <button className="back-btn" aria-label="返回" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <h1>选择你的导师</h1>
      </div>

      <p className="mentor-intro">
        每位导师都有独特的教学风格。你可以随时切换，也可以在学习中邀请其他导师"客串"。
      </p>

      <div className="mentor-list">
        {mentors.map((mentor, index) => (
          <motion.div
            key={mentor.id}
            className={`mentor-card ${primaryMentor === mentor.id ? 'selected' : ''}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => setPrimaryMentor(mentor.id)}
            style={{ '--mentor-color': mentor.colorTheme.primary } as React.CSSProperties}
          >
            <div className="mentor-avatar">{mentor.avatarEmoji}</div>
            <div className="mentor-info">
              <h3>{mentor.chineseName} <span className="mentor-name-en">{mentor.name}</span></h3>
              <p className="mentor-title">{mentor.title}</p>
              <div className="mentor-tags">
                {mentor.styleTags.map((tag) => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
              <p className="mentor-desc">{mentor.personality}</p>
            </div>
            {primaryMentor === mentor.id && (
              <div className="selected-badge">
                <Check size={16} />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <button className="btn-primary confirm-btn" onClick={() => navigate('/')}>
        确认选择
      </button>
          <BottomNav />
    </div>
  );
}
