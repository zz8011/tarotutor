import BottomNav from '../components/BottomNav';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Award, Sparkles } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { getMentorById } from '../data/mentors';
import './ProfilePage.scss';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { userName, progress, primaryMentor, setUserName } = useAppStore();
  const mentor = getMentorById(primaryMentor || 'luna');
  const [draftName, setDraftName] = useState(userName);
  const [isEditingName, setIsEditingName] = useState(!userName);

  const handleSaveName = () => {
    const trimmedName = draftName.trim();
    if (!trimmedName) return;
    setUserName(trimmedName);
    setIsEditingName(false);
  };

  return (
    <div className="profile-page page-container">
      <div className="profile-header">
        <button className="back-btn" aria-label="返回" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <h1>个人中心</h1>
      </div>

      {/* User Card */}
      <motion.div
        className="user-card card-glass"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="user-avatar">
          {userName ? userName[0].toUpperCase() : '?'}
        </div>
        <div className="user-info">
          <h2>{userName || '未命名学员'}</h2>
          <p>{mentor?.chineseName} 的学徒</p>
        </div>
        {isEditingName ? (
          <div className="name-editor">
            <input
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              placeholder="输入名字"
              aria-label="输入名字"
            />
            <button className="btn-secondary" onClick={handleSaveName}>
              保存
            </button>
          </div>
        ) : (
          <button className="btn-secondary" onClick={() => setIsEditingName(true)}>
            修改名字
          </button>
        )}
      </motion.div>

      {/* Stats */}
      <div className="profile-stats">
        <div className="stat-card">
          <BookOpen size={20} />
          <span className="stat-num">{progress.learnedCards.length}</span>
          <span className="stat-label">已学卡牌</span>
        </div>
        <div className="stat-card">
          <Sparkles size={20} />
          <span className="stat-num">{progress.totalSessions}</span>
          <span className="stat-label">学习次数</span>
        </div>
        <div className="stat-card">
          <Award size={20} />
          <span className="stat-num">{progress.achievements.length}</span>
          <span className="stat-label">获得徽章</span>
        </div>
      </div>

      {/* Mentor Info */}
      {mentor && (
        <div className="mentor-card card-glass">
          <h3>当前导师</h3>
          <div className="mentor-row">
            <span className="mentor-avatar">{mentor.avatarEmoji}</span>
            <div>
              <p className="mentor-name">{mentor.chineseName} {mentor.name}</p>
              <p className="mentor-style">{mentor.styleTags.join(' · ')}</p>
            </div>
          </div>
          <button className="btn-secondary" onClick={() => navigate('/mentors')}>
            切换导师
          </button>
        </div>
      )}

      {/* Achievements */}
      <div className="achievements-section">
        <h3>成就徽章</h3>
        <div className="achievements-grid">
          {progress.achievements.length === 0 ? (
            <p className="empty-text">还没有获得徽章，继续学习吧！</p>
          ) : (
            progress.achievements.map((ach) => (
              <div key={ach.id} className="achievement-item">
                <span className="ach-icon">{ach.icon}</span>
                <span className="ach-name">{ach.name}</span>
              </div>
            ))
          )}
        </div>
      </div>
          <BottomNav />
    </div>
  );
}
