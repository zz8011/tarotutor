// ============================================================
// 轻量复习模式：把到期的卡直接出成快速测验。
// 与完整学习流（LearnPage 五阶段）不同，复习只做「掌握测试」，
// 全对 → 按间隔重复曲线推迟下次复习；有错 → 1 天后再来。
// ============================================================

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { useAppStore } from '../store/useAppStore';
import { getCardById, getCardImagePath } from '../data/tarotCards';
import { resolveCardBackAsset } from '../data/assetManifest';
import { buildChoiceQuiz, getNextReviewDays, type ChoiceQuestion } from '../services/learning/lessonContent';
import type { QuizAnswerMap, StudyRecord } from '../types';
import './ReviewPage.scss';

function addDaysIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export default function ReviewPage() {
  const navigate = useNavigate();
  const studyJournal = useAppStore((state) => state.studyJournal);
  const upsertStudyRecord = useAppStore((state) => state.upsertStudyRecord);
  const markStudyActivity = useAppStore((state) => state.markStudyActivity);
  const cardDeck = useAppStore((state) => state.cardDeck);

  // 进入页面时取一次快照，避免复习过程中队列因记录更新而变化
  const [dueQueue] = useState<StudyRecord[]>(() => {
    const now = Date.now();
    return Object.values(studyJournal.records).filter(
      (record) => record.nextReviewAt && new Date(record.nextReviewAt).getTime() <= now
    );
  });

  const [queueIndex, setQueueIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswerMap>({});
  const [submitted, setSubmitted] = useState(false);
  const [passedCount, setPassedCount] = useState(0);

  const currentRecord = dueQueue[queueIndex] ?? null;
  const card = currentRecord ? getCardById(currentRecord.cardId) : null;

  // 同一张卡复习期间题目保持稳定（仅在卡切换时重新生成）
  const questions = useMemo<ChoiceQuestion[]>(() => {
    if (!card || !currentRecord) return [];
    return buildChoiceQuiz(card, currentRecord.orientation);
  }, [card, currentRecord]);

  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id]);
  const allCorrect = questions.every((q) => answers[q.id] === q.correctAnswer);
  const finished = dueQueue.length > 0 && queueIndex >= dueQueue.length;

  const handleSubmit = () => {
    if (!allAnswered || !currentRecord) return;
    setSubmitted(true);

    if (allCorrect) {
      const nextCount = currentRecord.reviewCount + 1;
      upsertStudyRecord(currentRecord.cardId, {
        reviewCount: nextCount,
        nextReviewAt: addDaysIso(getNextReviewDays(nextCount)),
      });
      setPassedCount((n) => n + 1);
    } else {
      // 有错：明天再复习一次，复习计数不前进
      upsertStudyRecord(currentRecord.cardId, { nextReviewAt: addDaysIso(1) });
    }
    markStudyActivity();
  };

  const handleNext = () => {
    setQueueIndex((i) => i + 1);
    setAnswers({});
    setSubmitted(false);
  };

  return (
    <div className="review-page">
      <header className="review-header">
        <button className="back-btn" onClick={() => navigate('/')} aria-label="返回首页">
          <ArrowLeft size={18} />
        </button>
        <h1>快速复习</h1>
        {dueQueue.length > 0 && !finished && (
          <span className="review-progress">{queueIndex + 1}/{dueQueue.length}</span>
        )}
      </header>

      <main className="review-main">
        {dueQueue.length === 0 && (
          <div className="review-empty glass-panel">
            <Sparkles size={28} />
            <h2>暂时没有到期的卡</h2>
            <p>学完的牌会按 1 → 3 → 7 → 14 → 30 天的节奏进入复习队列，到期后来这里巩固。</p>
            <button onClick={() => navigate('/library')}>去学新牌</button>
          </div>
        )}

        {finished && (
          <motion.div className="review-empty glass-panel" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <CheckCircle2 size={28} />
            <h2>今天的复习完成了</h2>
            <p>共复习 {dueQueue.length} 张，通过 {passedCount} 张。没通过的明天会再次出现。</p>
            <button onClick={() => navigate('/')}>回到首页</button>
          </motion.div>
        )}

        {card && currentRecord && !finished && (
          <motion.div
            key={card.id}
            className="review-card-block"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="review-card-head glass-panel">
              <img
                src={getCardImagePath(card.id, cardDeck)}
                alt={card.chineseName}
                className={currentRecord.orientation === 'reversed' ? 'reversed' : ''}
                onError={(e) => { (e.target as HTMLImageElement).src = resolveCardBackAsset(cardDeck); }}
              />
              <div>
                <h2>{card.chineseName}</h2>
                <span className="orientation-tag">
                  {currentRecord.orientation === 'upright' ? '正位' : '逆位'} · 第 {currentRecord.reviewCount + 1} 次复习
                </span>
              </div>
            </div>

            <div className="review-questions">
              {questions.map((question) => {
                const chosen = answers[question.id];
                return (
                  <div key={question.id} className="review-question glass-panel">
                    <p className="question-prompt">{question.prompt}</p>
                    <div className="question-options">
                      {question.options.map((option) => {
                        const isChosen = chosen === option;
                        const isCorrect = option === question.correctAnswer;
                        const stateClass = submitted
                          ? isCorrect ? 'correct' : isChosen ? 'wrong' : ''
                          : isChosen ? 'chosen' : '';
                        return (
                          <button
                            key={option}
                            className={`option-btn ${stateClass}`}
                            disabled={submitted}
                            onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: option }))}
                          >
                            {option}
                            {submitted && isCorrect && <CheckCircle2 size={14} />}
                            {submitted && isChosen && !isCorrect && <XCircle size={14} />}
                          </button>
                        );
                      })}
                    </div>
                    {submitted && chosen !== question.correctAnswer && (
                      <p className="question-explain">{question.explanation}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {!submitted ? (
              <button className="review-submit" disabled={!allAnswered} onClick={handleSubmit}>
                提交答案
              </button>
            ) : (
              <div className="review-result">
                <p className={allCorrect ? 'pass' : 'fail'}>
                  {allCorrect
                    ? `全对！这张牌 ${getNextReviewDays(currentRecord.reviewCount + 1)} 天后再见。`
                    : '有偏差的地方已标出，这张牌明天会再来一次。'}
                </p>
                <button className="review-submit" onClick={handleNext}>
                  {queueIndex + 1 < dueQueue.length ? (
                    <>下一张 <RotateCcw size={14} /></>
                  ) : '完成复习'}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
