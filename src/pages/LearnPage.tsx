import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, BookOpen, Sparkles } from 'lucide-react';
import { getCardById, getRandomCard } from '../data/tarotCards';
import { getMentorById } from '../data/mentors';
import { useAppStore } from '../store/useAppStore';
import type { ChatMessage } from '../types';
import { streamCardLearningResponse } from '../services/ai';
import './LearnPage.scss';

export default function LearnPage() {
  const { cardId } = useParams<{ cardId?: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentSession, startSession, addMessage, endSession, primaryMentor, completeCard, updateProgress } = useAppStore();
  
  const [inputMessage, setInputMessage] = useState('');
  const [phase, setPhase] = useState<'showing' | 'feeling' | 'dialogue' | 'knowledge' | 'closing'>('showing');
  const [knowledgeUnlocked, setKnowledgeUnlocked] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const cardIdNum = cardId ? parseInt(cardId) : null;
  const card = cardIdNum ? getCardById(cardIdNum) : getRandomCard();
  const mentor = getMentorById(primaryMentor || 'luna');

  // 单张学习固定正位，不显示逆位
  const orientation: 'upright' = 'upright';

  // 生成初始问候话术
  const generateGreeting = useCallback(() => {
    if (!card || !mentor) return;

    const isDirectMode = searchParams.get('mode') === 'interpret';
    
    let content = '';
    
    if (isDirectMode) {
      // 直接解读模式：简洁展示牌意
      content = `${card.chineseName}（${card.name}）

${card.uprightMeaning}

关键词：${card.keywords?.join('、') || '暂无'}
元素：${card.element || '无'} | 行星：${card.planet || '暂无'}

想深入了解这张牌，还是聊聊你的感受？`;
      setPhase('knowledge');
      setKnowledgeUnlocked(true);
    } else {
      // 标准学习模式：引导用户表达感受
      const greetings: Record<string, string> = {
        luna: `这是${card.chineseName}。看着这张牌，你第一眼感受到什么？不用想太多，说出你的直觉。`,
        sol: `今天我们来认识${card.chineseName}。观察牌面，什么元素最吸引你？`,
        mira: `欢迎来到${card.chineseName}的世界。如果这张牌是一个人，你觉得TA是什么性格？`,
        orion: `这是${card.chineseName}。牌面上最让你好奇的细节是什么？`,
        seren: `${card.chineseName}出现在你面前。此刻，这张牌带给你什么情绪？`,
        kai: `看看${card.chineseName}。如果这张牌在给你讲故事，开头会是什么？`,
      };
      content = greetings[mentor.id] || greetings.luna;
    }

    const greeting: ChatMessage = {
      id: Date.now().toString(),
      role: 'mentor',
      content,
      timestamp: new Date().toISOString(),
      phase: 'perception',
      mentorId: mentor.id,
    };
    addMessage(greeting);
    setIsAiTyping(false);
  }, [card, mentor, searchParams, addMessage]);

  // 当 cardId 改变时，完全重置状态
  const prevCardIdRef = useRef<number | null>(null);
  const hasGreeted = useRef(false);
  
  useEffect(() => {
    if (cardIdNum !== prevCardIdRef.current) {
      prevCardIdRef.current = cardIdNum;
      hasGreeted.current = false;
      
      // 强制清理旧会话和所有消息
      if (currentSession) {
        endSession();
      }
      
      // 重置所有本地状态
      setPhase('showing');
      setKnowledgeUnlocked(false);
      setInputMessage('');
      setIsAiTyping(false);
      
      // 创建新会话
      if (card) {
        startSession(card.id, primaryMentor || 'luna');
      }
    }
  }, [cardIdNum, card, currentSession, endSession, startSession, primaryMentor]);

  // 会话创建后发送问候
  useEffect(() => {
    if (currentSession && !hasGreeted.current && card) {
      hasGreeted.current = true;
      setIsAiTyping(true);
      // 短暂延迟让loading状态可见
      setTimeout(() => generateGreeting(), 300);
    }
  }, [currentSession, card, generateGreeting]);

  // 自动滚动
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages, isAiTyping]);

  // 生成AI回复话术
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const generateResponse = useCallback((_userInput: string) => {
    if (!card || !mentor) return '';
    
    const responses: Record<string, string[]> = {
      luna: [
        `你的感受很珍贵。${card.chineseName}正位的核心含义是：${card.uprightMeaning.substring(0, 60)}...`,
        `我听到了。这张牌的关键词是${card.keywords?.slice(0, 3).join('、')}，它们和你感受到的有共鸣吗？`,
        `很好的觉察。${card.chineseName}提醒我们：${card.uprightMeaning.substring(0, 50)}... 你在生活中有过类似的体验吗？`,
      ],
      sol: [
        `观察得很细致。${card.chineseName}正位代表：${card.uprightMeaning.substring(0, 60)}...`,
        `没错。这张牌的核心能量是${card.keywords?.[0]}，它在你当下的生活中如何体现？`,
        `正是如此。${card.chineseName}告诉我们：${card.uprightMeaning.substring(0, 50)}...`,
      ],
      mira: [
        `很有趣的联想！${card.chineseName}正位的含义正是：${card.uprightMeaning.substring(0, 60)}...`,
        `你的直觉很准。这张牌和${card.element || '未知'}元素相关，象征着${card.keywords?.[0]}。`,
        `很好的解读角度。${card.chineseName}的核心信息是：${card.uprightMeaning.substring(0, 50)}...`,
      ],
      orion: [
        `敏锐的观察。${card.chineseName}正位含义：${card.uprightMeaning.substring(0, 60)}...`,
        `这个细节很重要。${card.chineseName}与${card.planet || '未知'}相关，代表${card.keywords?.[0]}。`,
        `深入得很好。这张牌的核心是：${card.uprightMeaning.substring(0, 50)}...`,
      ],
      seren: [
        `我感受到了你的情绪。${card.chineseName}正位含义：${card.uprightMeaning.substring(0, 60)}...`,
        `这种情绪很正常。${card.chineseName}提醒我们接纳${card.keywords?.[0]}。`,
        `你的感受就是答案的一部分。${card.chineseName}的核心：${card.uprightMeaning.substring(0, 50)}...`,
      ],
      kai: [
        `很有创意的解读！${card.chineseName}正位含义：${card.uprightMeaning.substring(0, 60)}...`,
        `这个故事的下一章可能是：${card.keywords?.slice(0, 2).join('、')}。`,
        `想象力很棒。${card.chineseName}的核心信息：${card.uprightMeaning.substring(0, 50)}...`,
      ],
    };
    
    const mentorResponses = responses[mentor.id] || responses.luna;
    // 根据消息长度选择不同回复
    const msgLength = currentSession?.messages?.length || 0;
    const index = Math.min(msgLength / 2, mentorResponses.length - 1);
    return mentorResponses[Math.floor(index)];
  }, [card, mentor, currentSession?.messages?.length]);

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

    // 阶段推进
    const msgCount = (currentSession?.messages?.length || 0) + 1;
    if (msgCount <= 2) {
      setPhase('feeling');
    } else if (msgCount <= 4) {
      setPhase('dialogue');
    } else {
      setPhase('knowledge');
      setKnowledgeUnlocked(true);
      completeCard(cardIdNum || card.id);
    }

    // AI回复
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
        // 通过 getState() 获取最新状态，避免闭包捕获过期引用
        useAppStore.setState((state) => {
          if (!state.currentSession) return state;
          const msgs = [...state.currentSession.messages];
          const lastIdx = msgs.length - 1;
          if (lastIdx >= 0 && msgs[lastIdx].id === responseId) {
            msgs[lastIdx] = { ...msgs[lastIdx], content: fullContent };
          }
          return { currentSession: { ...state.currentSession, messages: msgs } };
        });
      }
    } catch (error) {
      // 降级到本地话术
      const fallbackContent = generateResponse(inputMessage);
      const fallbackResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'mentor',
        content: fallbackContent || '你的感受很重要。继续说说看？',
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
          <span className="phase-badge">{phase === 'showing' ? '初识' : phase === 'feeling' ? '感受' : phase === 'dialogue' ? '探索' : '领悟'}</span>
        </div>
      </div>

      {/* Card Display - 固定正位 */}
      <motion.div
        className="card-display"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="tarot-card upright">
          <div className="card-inner">
            <div className="card-front">
              <div className="card-image-wrapper">
                <img
                  src={card.image}
                  alt={card.chineseName}
                  className="card-image"
                  loading="eager"
                />
              </div>
              <h3>{card.chineseName}</h3>
              <p className="card-name-en">{card.name}</p>
              <div className="card-meta">
                <span>{card.arcana === 'major' ? '大阿卡纳' : card.suit}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Knowledge Card */}
      <AnimatePresence>
        {knowledgeUnlocked && (
          <motion.div
            className="knowledge-card card-glass"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="knowledge-header">
              <Sparkles size={18} />
              <span>知识卡牌已解锁</span>
            </div>
            <div className="knowledge-content">
              <p className="meaning">
                <strong>核心含义：</strong>
                {card.uprightMeaning}
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
        
        {/* AI typing indicator */}
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
            placeholder={phase === 'showing' ? '说说你对这张牌的第一感受...' : '继续和导师聊聊...'}
            aria-label={phase === 'showing' ? '输入你对这张牌的感受' : '继续对话'}
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
