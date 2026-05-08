import { useParams, useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Sparkles, BookOpen, RotateCcw } from 'lucide-react';
import { tarotCards, getCardById, getCardImagePath } from '../data/tarotCards';
import { getDefaultMentor, getMentorById } from '../data/mentors';
import { useAppStore } from '../store/useAppStore';
import { streamCardLearningResponse } from '../services/ai';
import { useMagicParticles } from '../hooks/useMagicParticles';
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

  // Initialize magic particles with emerald color for learning page
  useMagicParticles({ color: 'var(--accent-emerald)', count: 6 });

  const card = cardId ? getCardById(Number(cardId)) : tarotCards[0];
  const [orientation, setOrientation] = useState<'upright' | 'reversed'>('upright');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `欢迎来到「${card?.chineseName || '未知'}」的学习之旅。你有什么想了解的吗？`,
      timestamp: new Date().toISOString(),
      phase: 'perception',
    },
  ]);
  const [userInput, setUserInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const mentor = (primaryMentor && getMentorById(primaryMentor)) || getDefaultMentor();

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

  const handleSend = async () => {
    if (!userInput.trim() || isStreaming) return;

    const userMsg: ChatMessage = {
      id: `msg-${nextMessageId.current++}`,
      role: 'user',
      content: userInput.trim(),
      timestamp: new Date().toISOString(),
      phase: 'perception',
    };

    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setUserInput('');
    setIsStreaming(true);

    const assistantId = `msg-${nextMessageId.current++}`;
    setChatMessages(prev => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '', timestamp: new Date().toISOString(), phase: 'perception' },
    ]);

    try {
      let fullContent = '';
      const stream = streamCardLearningResponse(
        card,
        orientation,
        userMsg.content,
        chatMessages.slice(-6),
        primaryMentor || undefined
      );
      for await (const chunk of stream) {
        fullContent += chunk;
        setChatMessages(prev =>
          prev.map(m => m.id === assistantId ? { ...m, content: fullContent } : m)
        );
      }
      completeCard(card.id);
    } catch (error) {
      console.error('AI stream failed:', error);
      setChatMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, content: '暂时无法连接导师，请稍后再试。' }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const toggleOrientation = () => {
    setOrientation(prev => prev === 'upright' ? 'reversed' : 'upright');
  };

  return (
    <div className="learn-page">
      {/* Header */}
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
        {/* Card Display */}
        <section className="card-display">
          <motion.div
            className="card-visual"
            animate={{ rotate: orientation === 'reversed' ? 180 : 0 }}
            transition={{ duration: 0.6 }}
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
            <button className="flip-btn" onClick={toggleOrientation}>
              <RotateCcw size={14} />
            </button>
            <button
              className={`orient-btn ${orientation === 'reversed' ? 'active' : ''}`}
              onClick={() => setOrientation('reversed')}
            >
              逆位
            </button>
          </div>

          <div className="meaning-preview">
            <div className="meaning-label">
              <BookOpen size={14} />
              {orientation === 'upright' ? '正位含义' : '逆位含义'}
            </div>
            <p className="meaning-text">
              {orientation === 'upright' ? card.uprightMeaning : card.reversedMeaning}
            </p>
          </div>
        </section>

        {/* Chat */}
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
            <AnimatePresence>
              {chatMessages.map(msg => (
                <motion.div
                  key={msg.id}
                  className={`chat-bubble ${msg.role}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p>{msg.content || '...'}</p>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>

          <div className="chat-input-row">
            <input
              type="text"
              placeholder="向导师提问..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="chat-input"
              disabled={isStreaming}
            />
            <button
              className="send-btn"
              onClick={handleSend}
              disabled={isStreaming || !userInput.trim()}
            >
              <Send size={18} />
            </button>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
