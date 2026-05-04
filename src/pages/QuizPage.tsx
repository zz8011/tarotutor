import { useState } from 'react';
import BottomNav from '../components/BottomNav';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { quizQuestions, calculateScores, getRecommendedMentors, buildPersonalityType } from '../data/quizQuestions';
import { useAppStore } from '../store/useAppStore';
import './QuizPage.scss';

export default function QuizPage() {
  const navigate = useNavigate();
  const { setPersonalityType, setPrimaryMentor, updateProgress } = useAppStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>(new Array(10).fill(-1));
  const [showResult, setShowResult] = useState(false);

  const currentQuestion = quizQuestions[currentIndex];
  const totalQuestions = quizQuestions.length;
  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = optionIndex;
    setAnswers(newAnswers);

    if (currentIndex < totalQuestions - 1) {
      setTimeout(() => setCurrentIndex(currentIndex + 1), 400);
    } else {
      // Calculate results
      const scores = calculateScores(newAnswers);
      const result = getRecommendedMentors(scores);
      const personalityType = buildPersonalityType(scores);
      
      setPersonalityType(personalityType);
      setPrimaryMentor(result.primaryMentorId);
      updateProgress({
        personalityType: personalityType,
        primaryMentor: result.primaryMentorId,
        secondaryMentors: result.secondaryMentorIds,
      });
      
      setTimeout(() => setShowResult(true), 500);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  if (showResult) {
    const scores = calculateScores(answers);
    const result = getRecommendedMentors(scores);
    
    return (
      <motion.div
        className="quiz-page page-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="quiz-result">
          <div className="result-icon">✨</div>
          <h2>测试完成！</h2>
          <p className="result-type">你的学习人格：<span>{result.personalityType}</span></p>
          <p className="result-reason">{result.matchReason}</p>
          <div className="mentor-preview">
            <p>推荐导师</p>
            <div className="mentor-tags">
              <span className="mentor-tag primary">{result.primaryMentorId}</span>
              {result.secondaryMentorIds.map((id) => (
                <span key={id} className="mentor-tag secondary">{id}</span>
              ))}
            </div>
          </div>
          <button className="btn-primary" onClick={() => navigate('/mentors')}>
            查看导师详情
            <ArrowRight size={18} />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="quiz-page page-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="quiz-header">
        <button className="back-btn" aria-label="返回" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <div className="quiz-progress">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="progress-text">{currentIndex + 1} / {totalQuestions}</span>
        </div>
      </div>

      <motion.div
        key={currentQuestion.id}
        className="question-card card-glass"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.4 }}
      >
        <div className="question-number">
          <Sparkles size={16} />
          第 {currentIndex + 1} 题
        </div>

        <h3 className="question-text">{currentQuestion.question}</h3>

        <div className="options">
          {currentQuestion.options.map((option, index) => (
            <motion.button
              key={index}
              className={`option-btn ${answers[currentIndex] === index ? 'selected' : ''}`}
              onClick={() => handleAnswer(index)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="option-label">{['A', 'B'][index]}</span>
              <span className="option-text">{option.text}</span>
            </motion.button>
          ))}
              <BottomNav />
    </div>
      </motion.div>

      {currentIndex > 0 && (
        <button className="btn-secondary prev-btn" onClick={handlePrev}>
          <ArrowLeft size={16} />
          上一题
        </button>
      )}
    </motion.div>
  );
}
