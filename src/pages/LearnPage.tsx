import { useParams, useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Sparkles, BookOpen, RotateCcw, MessageCircle } from 'lucide-react';
import { tarotCards, getCardById, getCardImagePath } from '../data/tarotCards';
import { getDefaultMentor, getMentorById } from '../data/mentors';
import { useAppStore } from '../store/useAppStore';
import { streamCardLearningResponse } from '../services/ai';
import { useMagicParticles } from '../hooks/useMagicParticles';
import AiResponse from '../components/AiResponse';
import type { ChatMessage } from '../types';
import './LearnPage.scss';

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
  const [hasOpenedReflection, setHasOpenedReflection] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `先别急着找标准答案，认真看看这张牌。告诉我你第一眼看到的画面、情绪，或者身体里最先浮现的感受。`,
      timestamp: new Date().toISOString(),
      phase: 'perception',
    },
  ]);

  const cardMeaning = orientation === 'upright'
    ? (card?.uprightMeaning ?? '')
    : (card?.reversedMeaning ?? '');

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
  };

  const appendAssistantPlaceholder = () => {
    const assistantId = `msg-${nextMessageId.current++}`;
    setChatMessages((prev) => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '', timestamp: new Date().toISOString(), phase: 'understanding' },
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
    setHasOpenedReflection(true);
    setIsStreaming(true);

    const assistantId = appendAssistantPlaceholder();

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

      completeCard(card.id);
    } catch (error) {
      console.error('AI stream failed:', error);
      setChatMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId
            ? { ...message, content: '暂时无法连接导师，请稍后再试。' }
            : message
        )
      );
    } finally {
      setIsStreaming(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 120);
    }
  };

  const handleFollowUp = async () => {
    if (!followUp.trim() || isStreaming || !hasOpenedReflection) return;

    const userMsg: ChatMessage = {
      id: `msg-${nextMessageId.current++}`,
      role: 'user',
      content: followUp.trim(),
      timestamp: new Date().toISOString(),
      phase: 'application',
    };

    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setFollowUp('');
    setIsStreaming(true);

    const assistantId = appendAssistantPlaceholder();

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
          message.id === assistantId
            ? { ...message, content: '这部分我们可以稍后再接着聊。' }
            : message
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
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <div className="header-center">
          <span className="card-arcana">{card.arcana === 'major' ? 'Major Arcana' : card.suit}</span>
          <h1 className="card-title">{card.chineseName}</h1>
        </div>
        <div style={{ width: 40 }} />
      </header>

      <main className="learn-main">
        <section className="card-display">
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

          {!hasOpenedReflection && (
            <div className="reflection-callout glass-panel">
              <div className="reflection-title">
                <MessageCircle size={14} />
                先看牌，再说感受
              </div>
              <p className="reflection-copy">把你第一眼看到的画面、情绪或联想到的经历写下来，导师会在你之后给出标准牌义和学习交流。</p>
              <div className="reflection-chips">
                <span>画面</span>
                <span>情绪</span>
                <span>联想</span>
              </div>
            </div>
          )}
        </section>

        <section className="chat-section">
          <div className="mentor-header">
            <div className="mentor-avatar">
              {mentor.avatarImage ? (
                <img src={mentor.avatarImage} alt={mentor.chineseName} />
              ) : (
                <Sparkles size={18} />
              )}
            </div>
            <div>
              <div className="mentor-name">{mentor.chineseName}</div>
              <div className="mentor-status">AI 导师 · 在线</div>
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

          {!hasOpenedReflection && (
            <div className="reflection-form glass-panel">
              <label className="reflection-label" htmlFor="reflection-input">
                你的第一感受
              </label>
              <textarea
                id="reflection-input"
                className="reflection-input"
                placeholder="例如：这张牌让我想到一个转折点，心里有点紧，也有一点期待。"
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                rows={4}
              />
              <button
                className="reflection-btn"
                onClick={handleStartLearning}
                disabled={isStreaming || !reflection.trim()}
              >
                {isStreaming ? '导师正在整理答案...' : '请导师给出答案'}
              </button>
            </div>
          )}

          {hasOpenedReflection && (
            <>
              <div className="meaning-preview">
                <div className="meaning-label">
                  <BookOpen size={14} />
                  {orientation === 'upright' ? '正位标准牌义' : '逆位标准牌义'}
                </div>
                <AiResponse text={cardMeaning} className="meaning-text" />
              </div>

              <div className="chat-input-row">
                <input
                  type="text"
                  placeholder="继续和导师交流..."
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFollowUp()}
                  className="chat-input"
                  disabled={isStreaming}
                />
                <button
                  className="send-btn"
                  onClick={handleFollowUp}
                  disabled={isStreaming || !followUp.trim()}
                >
                  <Send size={18} />
                </button>
              </div>
            </>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
