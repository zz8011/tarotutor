import { useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  CircleCheckBig,
  MessageCircle,
  RotateCcw,
  Send,
  Sparkles,
  WandSparkles,
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import AiResponse from '../components/AiResponse';
import { tarotCards, getCardById, getCardImagePath } from '../data/tarotCards';
import { getDefaultMentor, getMentorById } from '../data/mentors';
import { streamCardLearningResponse } from '../services/ai';
import { useAppStore } from '../store/useAppStore';
import { useMagicParticles } from '../hooks/useMagicParticles';
import type { ChatMessage, TarotCard } from '../types';
import './LearnPage.scss';

type LearningStage = 'observe' | 'teach' | 'quiz' | 'mastered';
type QuizResult = 'correct' | 'incorrect' | null;

interface LearningQuiz {
  question: string;
  options: string[];
  correctAnswer: string;
  hint: string;
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function normalizeMeaning(text: string) {
  return text
    .replace(/[。！？]/g, '，')
    .split('，')
    .map((part) => part.trim())
    .filter(Boolean)[0] ?? '';
}

function buildLearningQuiz(card: TarotCard, orientation: 'upright' | 'reversed'): LearningQuiz {
  const coreKeyword = card.keywords.find(Boolean) || card.chineseName;
  const pool = tarotCards
    .flatMap((item) => item.keywords.slice(0, 2))
    .filter(Boolean)
    .filter((keyword) => keyword !== coreKeyword);

  const distractors = shuffle([...new Set(pool)]).slice(0, 2);
  const options = shuffle([coreKeyword, ...distractors]);
  const reversedAnchor = normalizeMeaning(card.reversedMeaning) || '结构变化';

  return {
    question:
      orientation === 'upright'
        ? '这张牌最该先抓住的核心气质是什么？'
        : '即使是逆位，先回到它的核心提醒。最贴近的一项是什么？',
    options,
    correctAnswer: coreKeyword,
    hint:
      orientation === 'upright'
        ? `正位先记住「${coreKeyword}」，再把它放进情境里理解。`
        : `逆位先看「${reversedAnchor}」这类偏移，再回到核心关键词。`,
  };
}

function buildMasteryMessage(card: TarotCard, orientation: 'upright' | 'reversed', quiz: LearningQuiz) {
  const meaning = orientation === 'upright' ? card.uprightMeaning : card.reversedMeaning;
  const anchor = normalizeMeaning(meaning) || quiz.correctAnswer;

  return [
    '很好，你已经抓到这张牌的第一层核心了。',
    `${card.chineseName} 的学习重点不是只背答案，而是先看见 ${quiz.correctAnswer}，再把它和牌面细节、当下情境连起来。`,
    orientation === 'upright'
      ? `正位里，导师希望你记住的是：${anchor}。`
      : `逆位里，导师希望你先看见：${anchor}。`,
    '下一次遇到这张牌时，先说出你在牌面里看到的东西，再说出你会怎么读。',
  ].join('\n\n');
}

export default function LearnPage() {
  const { cardId } = useParams<{ cardId?: string }>();
  const navigate = useNavigate();
  const primaryMentor = useAppStore((state) => state.primaryMentor);
  const completeCard = useAppStore((state) => state.completeCard);
  const cardDeck = useAppStore((state) => state.cardDeck);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const nextMessageId = useRef(2);

  useMagicParticles({ color: 'var(--accent-emerald)', count: 6 });

  const card = cardId ? getCardById(Number(cardId)) : tarotCards[0];
  const mentor = (primaryMentor && getMentorById(primaryMentor)) || getDefaultMentor();

  const [orientation, setOrientation] = useState<'upright' | 'reversed'>('upright');
  const [reflection, setReflection] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [stage, setStage] = useState<LearningStage>('observe');
  const [quizResult, setQuizResult] = useState<QuizResult>(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: '先看牌，不急着找标准答案。你先说出第一眼看到的画面、情绪，或者身体里的直觉反应。',
      timestamp: new Date().toISOString(),
      phase: 'perception',
    },
  ]);

  const quiz = useMemo(() => (card ? buildLearningQuiz(card, orientation) : null), [card, orientation]);
  const currentMeaning = orientation === 'upright' ? card?.uprightMeaning ?? '' : card?.reversedMeaning ?? '';
  const learnedLabel =
    stage === 'mastered' ? '已掌握' : stage === 'quiz' ? '小测中' : stage === 'teach' ? '导师讲解' : '观察牌面';

  if (!card) {
    return (
      <div className="learn-page">
        <div className="error-state">
          <p>卡牌未找到</p>
          <button onClick={() => navigate('/library')}>返回牌库</button>
        </div>
      </div>
    );
  }

  const toggleOrientation = () => {
    setOrientation((prev) => (prev === 'upright' ? 'reversed' : 'upright'));
    setQuizResult(null);
    setSelectedAnswer('');
    if (stage === 'quiz') {
      setStage('observe');
    }
  };

  const appendAssistantMessage = (content: string) => {
    const assistantId = `msg-${nextMessageId.current++}`;
    setChatMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: 'assistant',
        content,
        timestamp: new Date().toISOString(),
        phase: stage === 'quiz' ? 'application' : 'understanding',
      },
    ]);
    return assistantId;
  };

  const handleStartLearning = async () => {
    if (!reflection.trim() || isStreaming) return;

    const userMsg: ChatMessage = {
      id: `msg-${nextMessageId.current++}`,
      role: 'user',
      content: reflection.trim(),
      timestamp: new Date().toISOString(),
      phase: 'perception',
    };

    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setReflection('');
    setStage('teach');
    setIsStreaming(true);

    const assistantId = appendAssistantMessage('导师正在整理你的观察……');

    try {
      let fullContent = '';
      const stream = streamCardLearningResponse(
        card,
        orientation,
        userMsg.content,
        updatedMessages.slice(-6),
        primaryMentor || undefined
      );

      for await (const chunk of stream) {
        fullContent += chunk;
        setChatMessages((prev) =>
          prev.map((message) => (message.id === assistantId ? { ...message, content: fullContent } : message))
        );
      }

      setStage('quiz');
      appendAssistantMessage('很好，我们先停一下。现在做一个小测，确认你有没有抓住这张牌的核心。');
    } catch (error) {
      console.error('AI stream failed:', error);
      setChatMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId ? { ...message, content: '暂时无法连接导师，请稍后再试。' } : message
        )
      );
      setStage('observe');
    } finally {
      setIsStreaming(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 120);
    }
  };

  const handleQuizAnswer = (answer: string) => {
    if (!quiz || isStreaming || stage === 'mastered') return;

    setSelectedAnswer(answer);
    const correct = answer === quiz.correctAnswer;
    setQuizResult(correct ? 'correct' : 'incorrect');

    const userMsg: ChatMessage = {
      id: `msg-${nextMessageId.current++}`,
      role: 'user',
      content: `我的答案是：${answer}`,
      timestamp: new Date().toISOString(),
      phase: 'application',
    };
    setChatMessages((prev) => [...prev, userMsg]);

    if (correct) {
      completeCard(card.id);
      setStage('mastered');
      appendAssistantMessage(buildMasteryMessage(card, orientation, quiz));
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 120);
      return;
    }

    appendAssistantMessage(`还差一点，先别急着改答案。${quiz.hint}`);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 120);
  };

  const handleFollowUp = async () => {
    if (!followUp.trim() || isStreaming || stage === 'observe') return;

    const userMsg: ChatMessage = {
      id: `msg-${nextMessageId.current++}`,
      role: 'user',
      content: followUp.trim(),
      timestamp: new Date().toISOString(),
      phase: stage === 'mastered' ? 'mastery' : 'application',
    };

    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setFollowUp('');
    setIsStreaming(true);

    const assistantId = appendAssistantMessage('导师在想一下你的这个追问……');

    try {
      let fullContent = '';
      const stream = streamCardLearningResponse(
        card,
        orientation,
        userMsg.content,
        updatedMessages.slice(-6),
        primaryMentor || undefined
      );

      for await (const chunk of stream) {
        fullContent += chunk;
        setChatMessages((prev) =>
          prev.map((message) => (message.id === assistantId ? { ...message, content: fullContent } : message))
        );
      }
    } catch (error) {
      console.error('Follow-up stream failed:', error);
      setChatMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId ? { ...message, content: '这部分我们可以稍后再接着聊。' } : message
        )
      );
    } finally {
      setIsStreaming(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 120);
    }
  };

  return (
    <div className="learn-page">
      <header className="learn-header">
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="返回">
          <ArrowLeft size={20} />
        </button>
        <div className="header-center">
          <span className="card-arcana">{card.arcana === 'major' ? 'Major Arcana' : card.suit}</span>
          <h1 className="card-title">{card.chineseName}</h1>
        </div>
        <div style={{ width: 40 }} />
      </header>

      <main className="learn-main">
        <section className="learning-hero glass-panel">
          <div className="hero-top">
            <div className="hero-copy">
              <p className="hero-kicker">牌面常驻 · 先观察再下结论</p>
              <h2 className="hero-title">{card.chineseName}</h2>
              <p className="hero-subtitle">{card.name}</p>
            </div>

            <div className="hero-state">
              <span className={`state-chip stage-${stage}`}>{learnedLabel}</span>
              <span className="state-chip">导师陪学</span>
            </div>
          </div>

          <div className="learning-stages" aria-label="学习阶段">
            {[
              { key: 'observe', label: '观察' },
              { key: 'teach', label: '讲解' },
              { key: 'quiz', label: '小测' },
              { key: 'mastered', label: '掌握' },
            ].map((item) => (
              <span key={item.key} className={`stage-pill stage-${item.key} ${stage === item.key ? 'active' : ''}`}>
                {item.label}
              </span>
            ))}
          </div>

          <div className="card-stage">
            <motion.div
              className="card-visual"
              animate={{ rotate: orientation === 'reversed' ? 180 : 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="card-front">
                <img
                  src={getCardImagePath(card.id, cardDeck)}
                  alt={card.chineseName}
                  className="card-image"
                  key={`${card.id}-${cardDeck}`}
                />
              </div>
            </motion.div>

            <div className="orientation-row">
              <button
                className={`orient-btn ${orientation === 'upright' ? 'active' : ''}`}
                onClick={() => setOrientation('upright')}
              >
                正位
              </button>
              <button className="flip-btn" onClick={toggleOrientation} aria-label="翻转牌面">
                <RotateCcw size={14} />
              </button>
              <button
                className={`orient-btn ${orientation === 'reversed' ? 'active' : ''}`}
                onClick={() => setOrientation('reversed')}
              >
                逆位
              </button>
            </div>

            <div className="card-notes">
              <span>{card.arcana === 'major' ? '大阿卡纳' : card.suit}</span>
              <span>{orientation === 'upright' ? '先看显性信息' : '先看偏移与阻滞'}</span>
            </div>
          </div>

          <div className="hero-tip">
            <MessageCircle size={14} />
            <span>学习时牌面会一直留在这里，下面的导师对话和测试都围绕同一张牌展开。</span>
          </div>
        </section>

        <section className="lesson-scroll">
          {stage === 'observe' && (
            <div className="reflection-form glass-panel">
              <div className="reflection-head">
                <MessageCircle size={16} />
                <span>先看牌，再说感受</span>
              </div>
              <p className="reflection-copy">把你第一眼看到的画面、情绪、联想写下来。导师会先听你说，再给出标准讲解。</p>
              <textarea
                className="reflection-input"
                placeholder="例如：这张牌让我觉得……"
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                rows={4}
              />
              <button className="reflection-btn" onClick={handleStartLearning} disabled={isStreaming || !reflection.trim()}>
                {isStreaming ? '导师整理中...' : '请导师开始讲解'}
              </button>
            </div>
          )}

          <section className="chat-section">
            <div className="mentor-header">
              <div className="mentor-avatar">
                {mentor.avatarImage ? <img src={mentor.avatarImage} alt={mentor.chineseName} /> : <Sparkles size={18} />}
              </div>
              <div>
                <div className="mentor-name">{mentor.chineseName}</div>
                <div className="mentor-status">AI 导师 · 在线陪学</div>
              </div>
            </div>

            <div className="chat-messages">
              <AnimatePresence initial={false}>
                {chatMessages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    className={`chat-bubble ${msg.role}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <AiResponse text={msg.content} />
                    {!msg.content && msg.role === 'assistant' && <p>...</p>}
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={chatEndRef} />
            </div>
          </section>

          {stage !== 'observe' && (
            <section className="lesson-panel glass-panel">
              <div className="panel-head">
                <BookOpen size={16} />
                <span>导师标准解读</span>
              </div>
              <AiResponse text={currentMeaning} className="meaning-text" />
            </section>
          )}

          {(stage === 'quiz' || stage === 'mastered') && quiz && (
            <section className="quiz-panel glass-panel">
              <div className="panel-head">
                <WandSparkles size={16} />
                <span>导师小测</span>
              </div>
              <h3 className="quiz-title">{quiz.question}</h3>
              <div className="quiz-options">
                {quiz.options.map((option) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrect = option === quiz.correctAnswer;
                  const stateClass =
                    quizResult === 'correct' && isCorrect
                      ? 'correct'
                      : quizResult === 'incorrect' && isSelected
                        ? 'wrong'
                        : isSelected
                          ? 'selected'
                          : '';

                  return (
                    <button
                      key={option}
                      className={`quiz-option ${stateClass}`}
                      onClick={() => handleQuizAnswer(option)}
                      disabled={stage === 'mastered'}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>

              {quizResult === 'incorrect' && <p className="quiz-hint">{quiz.hint}</p>}
              {quizResult === 'correct' && (
                <p className="quiz-hint quiz-hint--success">
                  <CircleCheckBig size={14} />
                  你已经抓住了这张牌的核心。
                </p>
              )}
            </section>
          )}

          {stage === 'mastered' && (
            <section className="mastery-panel glass-panel">
              <div className="panel-head">
                <CircleCheckBig size={16} />
                <span>本节完成</span>
              </div>
              <p className="mastery-copy">
                现在你已经完成“看牌 - 说感受 - 导师讲解 - 小测”这一轮。继续学下一张，或者回到牌库复习这张牌。
              </p>
              <div className="mastery-actions">
                <button className="mastery-btn secondary" onClick={() => navigate('/library')}>
                  返回牌库
                </button>
                <button
                  className="mastery-btn primary"
                  onClick={() => navigate(`/learn/${Math.min(card.id + 1, tarotCards.length - 1)}`)}
                  disabled={card.id >= tarotCards.length - 1}
                >
                  下一张牌
                </button>
              </div>
            </section>
          )}

          {stage !== 'observe' && (
            <div className="follow-up-row">
              <input
                type="text"
                placeholder="继续问导师：这张牌在某个场景里怎么读？"
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFollowUp()}
                className="chat-input"
                disabled={isStreaming}
              />
              <button className="send-btn" onClick={handleFollowUp} disabled={isStreaming || !followUp.trim()}>
                <Send size={18} />
              </button>
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
