import { useParams, useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, BookOpen, Unlock, Sparkles } from 'lucide-react';
import { getCardById, getRandomCard } from '../data/tarotCards';
import { getMentorById } from '../data/mentors';
import { useAppStore } from '../store/useAppStore';
import type { ChatMessage } from '../types';
import { streamCardLearningResponse } from '../services/ai';
import './LearnPage.scss';

export default function LearnPage() {
  const { cardId } = useParams<{ cardId?: string }>();
  const navigate = useNavigate();
  const { currentSession, startSession, addMessage, endSession, primaryMentor, completeCard, updateProgress } = useAppStore();
  
  const [inputMessage, setInputMessage] = useState('');
  const [phase, setPhase] = useState<'showing' | 'feeling' | 'dialogue' | 'knowledge' | 'closing' | 'interpretation'>('showing');
  const [showDirectInterpretation, setShowDirectInterpretation] = useState(false);
  const [knowledgeUnlocked, setKnowledgeUnlocked] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 惰性初始化 orientation，避免渲染期间调用 Math.random()（React purity 规则）
  const [orientation] = useState<'upright' | 'reversed'>(() =>
    Math.random() > 0.5 ? 'upright' : 'reversed'
  );

  const cardIdNum = cardId ? parseInt(cardId) : null;
  const card = cardIdNum ? getCardById(cardIdNum) : getRandomCard();
  const mentor = getMentorById(primaryMentor || 'luna');

  // AI 生成初始问候或直接解读
  const generateAiGreeting = useCallback(async () => {
    if (!card) return;

    // 如果是直接解读模式（从首页"开始体验"进入），直接显示牌意
    const isDirectInterpretation = window.location.search.includes('mode=interpret');
    
    if (isDirectInterpretation) {
      setShowDirectInterpretation(true);
      setPhase('interpretation');
      setKnowledgeUnlocked(true);
      
      // 直接显示牌意，不需要AI生成
      const directContent = `**${card.chineseName}**（${orientation === 'upright' ? '正位' : '逆位'}）

${orientation === 'upright' ? card.uprightMeaning : card.reversedMeaning}

**关键词**：${card.keywords?.join('、') || '暂无'}

**元素**：${card.element || '无'} | **行星**：${card.planet || '暂无'}

你想深入了解这张牌的更多含义，还是与AI导师探讨你的感受？`;

      const greeting: ChatMessage = {
        id: Date.now().toString(),
        role: 'mentor',
        content: directContent,
        timestamp: new Date().toISOString(),
        phase: 'perception',
        mentorId: primaryMentor || 'luna',
      };
      addMessage(greeting);
      setIsAiTyping(false);
      return;
    }

    const chatHistory: ChatMessage[] = [];
    const userMessage = '你好，我今天想学习这张牌';

    try {
      const stream = streamCardLearningResponse(
        card,
        orientation,
        userMessage,
        chatHistory,
        primaryMentor || 'luna'
      );

      let fullContent = '';
      for await (const chunk of stream) {
        fullContent += chunk;
      }

      const greeting: ChatMessage = {
        id: Date.now().toString(),
        role: 'mentor',
        content: fullContent || `今天让我带你探索${card.chineseName}的智慧。看到这张牌，你第一眼想到什么？`,
        timestamp: new Date().toISOString(),
        phase: 'perception',
        mentorId: primaryMentor || 'luna',
      };
      addMessage(greeting);
    } catch (error) {
      console.error('AI 问候生成失败:', error);
      // 降级到本地生成
      const fallbackGreeting: ChatMessage = {
        id: Date.now().toString(),
        role: 'mentor',
        content: `今天让我带你探索${card.chineseName}的智慧。看到这张牌，你第一眼想到什么？`,
        timestamp: new Date().toISOString(),
        phase: 'perception',
        mentorId: primaryMentor || 'luna',
      };
      addMessage(fallbackGreeting);
    } finally {
      setIsAiTyping(false);
    }
  }, [card, orientation, primaryMentor, addMessage]);

  // 初始化学习会话：先创建 session，再异步生成问候
  useEffect(() => {
    if (!currentSession && card) {
      startSession(card.id, primaryMentor || 'luna');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅在首次挂载时初始化
  }, []);

  // session 创建后异步生成 AI 问候（避免 effect 中同步 setState）
  const hasGreeted = useRef(false);
  useEffect(() => {
    if (currentSession && !hasGreeted.current && card) {
      hasGreeted.current = true;
      setIsAiTyping(true);
      generateAiGreeting();
    }
  }, [currentSession, card, generateAiGreeting]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages, isAiTyping]);

  const handleSend = async () => {
    if (!inputMessage.trim() || !card) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
      phase: 'perception',
      mentorId: primaryMentor || 'luna',
    };
    addMessage(userMsg);
    setInputMessage('');

    // Progress phase
    if (phase === 'showing') {
      setPhase('feeling');
    } else if (phase === 'feeling' && (currentSession?.messages?.length || 0) > 3) {
      setPhase('dialogue');
    } else if (phase === 'dialogue' && (currentSession?.messages?.length || 0) > 6) {
      setPhase('knowledge');
      setKnowledgeUnlocked(true);
      completeCard(cardIdNum || card.id);
    }

    // AI 生成导师回复（流式）
    setIsAiTyping(true);
    
    try {
      const chatHistory = currentSession?.messages || [];
      const stream = streamCardLearningResponse(
        card,
        orientation,
        inputMessage,
        chatHistory,
        primaryMentor || 'luna'
      );

      // 先创建一条空消息，然后流式填充
      const responseId = (Date.now() + 1).toString();
      const tempResponse: ChatMessage = {
        id: responseId,
        role: 'mentor',
        content: '',
        timestamp: new Date().toISOString(),
        phase: phase as 'perception' | 'understanding' | 'application' | 'mastery',
        mentorId: primaryMentor || 'luna',
      };
      addMessage(tempResponse);

      let fullContent = '';
      for await (const chunk of stream) {
        fullContent += chunk;
        // 更新消息内容（通过替换最后一条消息）
        const updatedMessages = [...(currentSession?.messages || [])];
        const lastIndex = updatedMessages.length - 1;
        if (lastIndex >= 0 && updatedMessages[lastIndex].id === responseId) {
          updatedMessages[lastIndex] = {
            ...updatedMessages[lastIndex],
            content: fullContent,
          };
          // 直接修改 store 中的消息
          useAppStore.setState((state) => ({
            currentSession: state.currentSession
              ? { ...state.currentSession, messages: updatedMessages }
              : null,
          }));
        }
      }
    } catch (error) {
      console.error('AI 回复生成失败:', error);
      // 降级：添加错误提示
      const fallbackResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'mentor',
        content: '抱歉，我暂时无法连接智慧之源。请稍后再试，或者继续探索这张牌的含义...',
        timestamp: new Date().toISOString(),
        phase: phase as 'perception' | 'understanding' | 'application' | 'mastery',
        mentorId: primaryMentor || 'luna',
      };
      addMessage(fallbackResponse);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleEndSession = () => {
    endSession();
    updateProgress({ streak: 1 });
    navigate('/');
  };

  if (!card) return null;

  return (
    <div className="learn-page page-container">
      <div className="learn-header">
        <button className="back-btn" aria-label="返回" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <div className="learn-meta">
          <span className="mentor-badge">{mentor?.avatarEmoji} {mentor?.chineseName}</span>
          <span className="phase-badge">{phase === 'showing' ? '展示' : phase === 'feeling' ? '感受' : phase === 'dialogue' ? '对话' : '知识'}</span>
        </div>
      </div>

      {/* Card Display */}
      <motion.div
        className="card-display"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className={`tarot-card ${orientation}`}>
          <div className="card-inner">
            <div className="card-front">
              <div className="card-symbol">{card.imageSymbol}</div>
              <h3>{card.chineseName}</h3>
              <p className="card-name-en">{card.name}</p>
              <div className="card-meta">
                <span>{card.arcana === 'major' ? '大阿卡纳' : card.suit}</span>
                <span className="orientation">{orientation === 'upright' ? '正位' : '逆位'}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Knowledge Card (unlocked after dialogue) */}
      <AnimatePresence>
        {knowledgeUnlocked && (
          <motion.div
            className="knowledge-card card-glass"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="knowledge-header">
              <Unlock size={18} />
              <span>知识卡牌已解锁</span>
            </div>
            <div className="knowledge-content">
              <p className="meaning">
                <strong>{orientation === 'upright' ? '正位含义：' : '逆位含义：'}</strong>
                {orientation === 'upright' ? card.uprightMeaning : card.reversedMeaning}
              </p>
              <div className="keywords">
                {card.keywords.map((k) => (
                  <span key={k} className="keyword-tag">{k}</span>
                ))}
              </div>
              <div className="correspondences">
                <span>元素：{card.element}</span>
                <span>行星：{card.planet}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Messages */}
      <div className="chat-messages">
        {currentSession?.messages.map((msg, index) => (
          <motion.div
            key={msg.id || index}
            className={`message ${msg.role}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {msg.role === 'mentor' && (
              <div className="message-avatar">{mentor?.avatarEmoji}</div>
            )}
            <div className="message-bubble">
              <p>{msg.content || (isAiTyping && index === currentSession.messages.length - 1 ? '...' : '')}</p>
            </div>
          </motion.div>
        ))}
        
        {/* AI 输入指示器 */}
        {isAiTyping && (
          <motion.div
            className="message mentor typing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="message-avatar">{mentor?.avatarEmoji}</div>
            <div className="message-bubble typing-bubble">
              <Sparkles size={14} className="typing-icon" />
              <span>正在连接神秘力量...</span>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="chat-input-area">
        <div className="input-wrapper">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={phase === 'showing' ? '写下你看到牌的第一感受...' : '继续与导师对话...'}
            aria-label={phase === 'showing' ? '写下你看到牌的第一感受' : '继续与导师对话'}
            className="chat-input"
          />
          <button className="send-btn" aria-label="发送" onClick={handleSend}>
            <Send size={18} />
          </button>
        </div>
        
        {knowledgeUnlocked && (
          <button className="btn-secondary end-btn" onClick={handleEndSession}>
            <BookOpen size={16} />
            结束学习
          </button>
        )}
      </div>
          <BottomNav />
    </div>
  );
}
