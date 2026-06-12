import { useState } from 'react';
import BottomNav from '../components/BottomNav';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { quizQuestions, calculateScores, getRecommendedMentors } from '../data/quizQuestions';
import { getMentorById } from '../data/mentors';
import { useAppStore } from '../store/useAppStore';
import './QuizPage.scss';

export default function QuizPage() {
  const navigate = useNavigate();
  const { setPersonalityType, setPrimaryMentor, updateProgress } = useAppStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>(new Array(quizQuestions.length).fill(-1));
  const [showResult, setShowResult] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const currentQuestion = quizQuestions[currentIndex];
  const totalQuestions = quizQuestions.length;
  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  const handleAnswer = (optionIndex: number) => {
    if (isTransitioning) return;
    const newAnswers = [...answers];
    newAnswers[currentIndex] = optionIndex;
    setAnswers(newAnswers);
    setIsTransitioning(true);

    if (currentIndex < totalQuestions - 1) {
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
        setIsTransitioning(false);
      }, 400);
    } else {
      const scores = calculateScores(newAnswers);
      const result = getRecommendedMentors(scores);
      setPersonalityType(result.personalityType);
      setPrimaryMentor(result.primaryMentorId);
      updateProgress({
        personalityType: result.personalityType,
        primaryMentor: result.primaryMentorId,
        secondaryMentors: result.secondaryMentorIds,
      });
      setTimeout(() => setShowResult(true), 500);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0 && !isTransitioning) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (showResult) {
    const scores = calculateScores(answers);
    const result = getRecommendedMentors(scores);
    const mentor = getMentorById(result.primaryMentorId);

    return (
      <motion.div
        className="quiz-page quiz-result"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="result-container">
          <div className="result-icon">
            <Sparkles size={40} />
          </div>
          <h1 className="result-title">灵魂导师已选定</h1>
          <p className="result-subtitle">根据你的灵魂旅程分析</p>

          <div className="result-mentor-card">
            <div className="mentor-avatar-result" style={{ borderColor: mentor?.colorTheme?.primary }}>
              {mentor?.avatarImage ? (
                <img className="mentor-avatar-img" src={mentor.avatarImage} alt={`${mentor.chineseName}头像`} />
              ) : (
                <span className="avatar-emoji">{mentor?.avatarEmoji}</span>
              )}
            </div>
            <h2 className="mentor-name-result">{mentor?.chineseName}</h2>
            <p className="mentor-title-result">{mentor?.title}</p>
            <p className="mentor-catchphrase">"{mentor?.catchphrase}"</p>
          </div>

          <button className="btn-next" onClick={() => navigate('/mentors')}>
            认识更多导师 →
          </button>
          <button className="btn-ghost" onClick={() => navigate('/')}>
            返回首页
          </button>
        </div>
        <BottomNav />
      </motion.div>
    );
  }

  return (
    <div className="quiz-page">
      <header className="quiz-header">
        <div className="quiz-header-top">
          <button className="back-link" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
          </button>
          <span className="progress-label">Soul Journey</span>
          <span className="progress-count">
            <span className="current">{currentIndex + 1}</span> / {totalQuestions}
          </span>
        </div>
        <div className="progress-track">
          <motion.div
            className="progress-fill"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
      </header>

      <main className="quiz-main">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            className="question-card glass-dark"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
          >
            <div className="question-icon">
              <Sparkles size={32} />
            </div>
            <h2 className="question-text">{currentQuestion.question}</h2>
          </motion.div>
        </AnimatePresence>

        <div className="options-list">
          {currentQuestion.options.map((option, i) => (
            <motion.button
              key={i}
              className={`option-btn ${answers[currentIndex] === i ? 'selected' : ''}`}
              onClick={() => handleAnswer(i)}
              whileTap={{ scale: 0.98 }}
            >
              <span className="option-icon">
                <Sparkles size={18} />
              </span>
              <span className="option-text">{option.text}</span>
            </motion.button>
          ))}
        </div>

        {currentIndex > 0 && (
          <button className="prev-btn" onClick={handlePrev}>
            ← 上一题
          </button>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
