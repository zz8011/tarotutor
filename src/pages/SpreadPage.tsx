import { useState } from 'react';
import BottomNav from '../components/BottomNav';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Shuffle, Sparkles, MessageCircle } from 'lucide-react';
import { spreads } from '../data/spreads';
import { getRandomCard, getCardById } from '../data/tarotCards';
import { useAppStore } from '../store/useAppStore';
import { getSpreadInterpretation } from '../services/ai';
import { showToast } from '../platform/feedback';
import type { CardSpread, SpreadCard } from '../types';
import './SpreadPage.scss';

export default function SpreadPage() {
  const navigate = useNavigate();
  const { addSpread, primaryMentor } = useAppStore();
  const [selectedSpread, setSelectedSpread] = useState(spreads[0]);
  const [drawnCards, setDrawnCards] = useState<SpreadCard[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [interpretation, setInterpretation] = useState('');
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [userQuestion, setUserQuestion] = useState('');
  const [showQuestionInput] = useState(true);
  const [userFeeling, setUserFeeling] = useState('');
  const [showFeelingInput, setShowFeelingInput] = useState(false);
  const [hasSubmittedFeeling, setHasSubmittedFeeling] = useState(false);

  const handleDraw = () => {
    // 验证问题已填写
    if (!userQuestion.trim()) {
      showToast('请先写下你心中想问的问题');
      return;
    }
    
    setIsDrawing(true);
    setDrawnCards([]);
    setShowResult(false);
    setInterpretation('');
    setShowFeelingInput(false);
    setHasSubmittedFeeling(false);
    setUserFeeling('');

    // Simulate drawing animation
    const newCards: SpreadCard[] = [];
    for (let i = 0; i < selectedSpread.cardCount; i++) {
      const card = getRandomCard();
      newCards.push({
        position: i,
        positionIndex: i,
        cardId: card.id,
        orientation: (Math.random() > 0.5 ? 'upright' : 'reversed') as 'upright' | 'reversed',
      });
    }

    setTimeout(() => {
      setDrawnCards(newCards);
      setIsDrawing(false);
      setShowResult(true);
      setShowFeelingInput(true); // 显示感受输入

      // Save spread
      const spread: CardSpread = {
        id: `spread_${Date.now()}`,
        templateId: selectedSpread.id,
        spreadTypeId: selectedSpread.id,
        date: new Date().toISOString(),
        question: userQuestion || '',
        cards: newCards,
        positions: selectedSpread.positions.map((p, i) => ({
          position: i,
          name: p.label,
          meaning: p.meaning,
          cardId: newCards[i]?.cardId || null,
          orientation: newCards[i]?.orientation || 'upright',
        })),
        interpretation: '',
      };
      addSpread(spread);
    }, 2000);
  };

  // AI 解读牌阵
  const handleInterpret = async () => {
    if (drawnCards.length === 0) return;
    
    // 验证感受已填写
    if (!userFeeling.trim()) {
      showToast('请先写下你对这个牌阵的第一感受');
      return;
    }
    
    setIsInterpreting(true);
    
    try {
      // 构建当前牌阵数据
      const currentSpread: CardSpread = {
        id: `spread_${Date.now()}`,
        templateId: selectedSpread.id,
        date: new Date().toISOString(),
        question: userQuestion,
        positions: selectedSpread.positions.map((p, i) => ({
          position: i,
          name: p.label,
          meaning: p.meaning,
          cardId: drawnCards[i]?.cardId || null,
          orientation: drawnCards[i]?.orientation || 'upright',
        })),
        interpretation: '',
      };
      
      const result = await getSpreadInterpretation(
        currentSpread,
        userQuestion,
        primaryMentor || undefined
      );
      
      // 添加一句话总结
      const summary = `\n\n💫 一句话总结：${userQuestion}——这个牌阵提醒你，${result.includes('建议') ? '信任自己的直觉，你已经有答案了' : '保持开放的心态，变化正在发生'}。`;
      
      setInterpretation(result + summary);
      setHasSubmittedFeeling(true);
    } catch (error) {
      console.error('牌阵解读失败:', error);
      setInterpretation('抱歉，暂时无法获取 AI 解读。请根据牌面含义自行感悟，或者稍后再试。');
    } finally {
      setIsInterpreting(false);
    }
  };

  return (
    <div className="spread-page page-container">
      <div className="spread-header">
        <button className="back-btn" aria-label="返回" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <h1>牌阵练习</h1>
      </div>

      {/* Spread Selector */}
      <div className="spread-selector">
        {spreads.map((spread) => (
          <button
            key={spread.id}
            className={`spread-option ${selectedSpread.id === spread.id ? 'active' : ''}`}
            onClick={() => {
              setSelectedSpread(spread);
              setDrawnCards([]);
              setShowResult(false);
            }}
          >
            <span className="spread-name">{spread.chineseName}</span>
            <span className="spread-count">{spread.cardCount}张</span>
          </button>
        ))}
      </div>

      {/* Spread Description */}
      <div className="spread-info card-glass">
        <h3>{selectedSpread.chineseName}</h3>
        <p>{selectedSpread.description}</p>
        <div className="positions">
          {selectedSpread.positions.map((pos) => (
            <div key={pos.index} className="position">
              <span className="position-index">{pos.index + 1}</span>
              <span className="position-label">{pos.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Question Input */}
      {showQuestionInput && (
        <motion.div
          className="question-input-section card-glass"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <label>你心中想问的问题（必填）：</label>
          <input
            type="text"
            value={userQuestion}
            onChange={(e) => setUserQuestion(e.target.value)}
            placeholder="例如：我最近的工作发展如何？"
            aria-label="输入你的问题"
            className="question-input"
            required
          />
          {!userQuestion.trim() && (
            <p className="required-hint">✨ 写下你的问题，让塔罗为你指引方向</p>
          )}
        </motion.div>
      )}

      {/* Draw Button */}
      {!showResult && (
        <motion.button
          className="draw-btn btn-primary"
          onClick={handleDraw}
          disabled={isDrawing}
          whileTap={{ scale: 0.95 }}
        >
          {isDrawing ? (
            <>
              <div className="spinner" />
              正在洗牌...
            </>
          ) : (
            <>
              <Shuffle size={20} />
              开始抽牌
            </>
          )}
        </motion.button>
      )}

      {/* Drawn Cards */}
      {showResult && (
        <motion.div
          className="spread-result"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h3>
            <Sparkles size={18} />
            牌阵结果
          </h3>
          
          {/* 用户问题展示 */}
          <div className="user-question-display card-glass">
            <strong>你的问题：</strong>{userQuestion}
          </div>
          <div className={`spread-layout layout-${selectedSpread.cardCount}`}>
            {drawnCards.map((drawn, index) => {
              const card = getCardById(Number(drawn.cardId));
              if (!card) return null;
              const position = selectedSpread.positions[index];
              
              return (
                <motion.div
                  key={index}
                  className={`spread-card ${drawn.orientation}`}
                  initial={{ opacity: 0, rotateY: 180 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  transition={{ delay: index * 0.3 }}
                >
                  <div className="card-position">{position?.label}</div>
                  <div className="card-image-wrapper">
                    <img
                      src={card.image}
                      alt={card.chineseName}
                      className="card-image"
                      style={{ transform: drawn.orientation === 'reversed' ? 'rotate(180deg)' : 'none' }}
                      loading="lazy"
                    />
                  </div>
                  <div className="card-name">{card.chineseName}</div>
                  <div className="card-orientation">
                    {drawn.orientation === 'upright' ? '正位' : '逆位'}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* AI Interpretation */}
          <AnimatePresence>
            {interpretation && (
              <motion.div
                className="ai-interpretation card-glass"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <div className="interpretation-header">
                  <Sparkles size={18} className="icon-gold" />
                  <h4>AI 导师解读</h4>
                </div>
                <div className="interpretation-content">
                  {interpretation.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 用户感受输入 */}
          {showFeelingInput && !hasSubmittedFeeling && (
            <motion.div
              className="feeling-input-section card-glass"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <label>看到这个牌阵，你的第一感受是什么？</label>
              <textarea
                value={userFeeling}
                onChange={(e) => setUserFeeling(e.target.value)}
                placeholder="例如：我看到第一张牌就感到一种压迫感，好像有什么东西在逼近..."
                aria-label="输入你对牌阵的感受"
                className="feeling-textarea"
                rows={3}
              />
            </motion.div>
          )}

          {/* Interpret Button */}
          {!interpretation && (
            <motion.button
              className="interpret-btn btn-primary"
              onClick={handleInterpret}
              disabled={isInterpreting}
              whileTap={{ scale: 0.95 }}
            >
              {isInterpreting ? (
                <>
                  <div className="spinner" />
                  正在解读...
                </>
              ) : (
                <>
                  <MessageCircle size={18} />
                  获取 AI 解读
                </>
              )}
            </motion.button>
          )}

          <button className="btn-secondary" onClick={handleDraw}>
            <Shuffle size={16} />
            重新抽牌
          </button>
        </motion.div>
      )}
          <BottomNav />
    </div>
  );
}
