import { useState } from 'react';
import BottomNav from '../components/BottomNav';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, History, MoonStar } from 'lucide-react';
import { spreads } from '../data/spreads';
import { getRandomCard, getCardById, getCardImagePath } from '../data/tarotCards';
import { useAppStore } from '../store/useAppStore';
import { getSpreadInterpretation } from '../services/ai';
import type { SpreadCard, CardSpread } from '../types';
import './SpreadPage.scss';

function getRandomOrientation(): 'upright' | 'reversed' {
  return Math.random() > 0.5 ? 'upright' : 'reversed';
}

export default function SpreadPage() {
  const addSpread = useAppStore((state) => state.addSpread);
  const cardDeck = useAppStore((state) => state.cardDeck);
  const [selectedSpread, setSelectedSpread] = useState(spreads[0]);
  const [drawnCards, setDrawnCards] = useState<SpreadCard[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [interpretation, setInterpretation] = useState('');
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [userQuestion, setUserQuestion] = useState('');

  const handleDraw = () => {
    if (!userQuestion.trim()) return;

    setIsDrawing(true);
    setDrawnCards([]);
    setShowResult(false);
    setInterpretation('');

    const newCards: SpreadCard[] = [];
    for (let i = 0; i < selectedSpread.cardCount; i++) {
      const card = getRandomCard();
      newCards.push({
        position: i,
        positionIndex: i,
        cardId: card.id,
        orientation: getRandomOrientation(),
      });
    }

    newCards.forEach((c, i) => {
      setTimeout(() => {
        setDrawnCards(prev => [...prev, c]);
        if (i === newCards.length - 1) {
          setIsDrawing(false);
          setShowResult(true);
          handleInterpret(newCards);
        }
      }, 400 * (i + 1));
    });
  };

  const handleInterpret = async (cards: SpreadCard[]) => {
    setIsInterpreting(true);
    try {
      const spreadObj: CardSpread = {
        id: Date.now().toString(),
        templateId: selectedSpread.id,
        date: new Date().toISOString(),
        question: userQuestion,
        positions: cards.map((c, i) => ({
          position: i,
          name: selectedSpread.positions[i]?.label || `位置${i + 1}`,
          meaning: selectedSpread.positions[i]?.meaning || '',
          cardId: c.cardId,
          orientation: c.orientation,
        })),
        cards,
        interpretation: '',
      };
      const result = await getSpreadInterpretation(spreadObj, userQuestion);
      setInterpretation(result);
      addSpread({ ...spreadObj, interpretation: result });
    } catch (error) {
      console.error('Interpretation failed:', error);
      setInterpretation('解读暂时不可用，请稍后再试。');
    } finally {
      setIsInterpreting(false);
    }
  };

  const resetSpread = () => {
    setDrawnCards([]);
    setShowResult(false);
    setInterpretation('');
    setUserQuestion('');
  };

  const particles = [
    { top: '80%', left: '15%', size: 4, delay: 0 },
    { top: '85%', left: '45%', size: 6, delay: 1.5 },
    { top: '75%', left: '80%', size: 4, delay: 3 },
    { top: '90%', left: '30%', size: 5, delay: 0.8 },
  ];

  return (
    <div className="spread-page">
      <div className="particles-bg">
        {particles.map((p, i) => (
          <div
            key={i}
            className="particle"
            style={{
              top: p.top, left: p.left,
              width: p.size, height: p.size,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
        <div className="radial-glow" />
      </div>

      <header className="spread-header">
        <div className="header-row">
          <h1 className="header-title">命理占卜</h1>
          <button className="history-btn">
            <History size={14} />
            历史
          </button>
        </div>
        <nav className="spread-tabs">
          {spreads.slice(0, 4).map((s) => (
            <button
              key={s.id}
              className={`spread-tab ${selectedSpread.id === s.id ? 'active' : ''}`}
              onClick={() => { setSelectedSpread(s); resetSpread(); }}
            >
              {s.chineseName}
            </button>
          ))}
        </nav>
      </header>

      <main className="spread-main">
        {!showResult && (
          <div className="question-area">
            <input
              type="text"
              placeholder="写下你心中的问题..."
              value={userQuestion}
              onChange={(e) => setUserQuestion(e.target.value)}
              className="question-input"
            />
          </div>
        )}

        <div className={`card-slots count-${selectedSpread.cardCount}`}>
          {selectedSpread.positions.map((pos, i) => {
            const drawnCard = drawnCards[i];
            const cardData = drawnCard ? getCardById(drawnCard.cardId) : null;

            return (
              <motion.div key={i} className={`card-slot ${drawnCard ? 'dealt' : ''}`}>
                {cardData ? (
                  <motion.div
                    className="dealt-card"
                    initial={{ y: 300, scale: 0.5, rotate: 45, opacity: 0 }}
                    animate={{ y: 0, scale: 1, rotate: 0, opacity: 1 }}
                    transition={{ duration: 0.8, ease: [0.175, 0.885, 0.32, 1.275] }}
                  >
                    <div className="dealt-card-inner">
                      <img
                        src={getCardImagePath(cardData.id, cardDeck)}
                        alt={cardData.chineseName}
                        className={`dealt-card-image ${drawnCard.orientation === 'reversed' ? 'reversed' : ''}`}
                        key={`${cardData.id}-${cardDeck}`}
                        onError={(e) => { (e.target as HTMLImageElement).src = '/cards/back.png'; }}
                      />
                      <span className="dealt-name">{cardData.chineseName}</span>
                      {drawnCard.orientation === 'reversed' && <span className="reversed-badge">逆位</span>}
                    </div>
                  </motion.div>
                ) : (
                  <div className="slot-placeholder">
                    <Sparkles size={28} className="slot-icon" />
                    <span className="slot-label">{pos.label}</span>
                  </div>
                )}
                <span className="position-label">{pos.label}</span>
              </motion.div>
            );
          })}
        </div>

        {!showResult && (
          <motion.button
            className="draw-btn"
            onClick={handleDraw}
            disabled={isDrawing}
            whileTap={{ scale: 0.96 }}
          >
            {isDrawing ? (
              <span className="draw-loading">抽牌中...</span>
            ) : (
              <>
                <MoonStar size={18} />
                开始占卜
              </>
            )}
          </motion.button>
        )}

        <AnimatePresence>
          {showResult && (
            <motion.div
              className="interpretation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="interp-title">
                <Sparkles size={16} />
                AI 解读
              </h3>

              {isInterpreting ? (
                <div className="interp-loading">
                  <div className="loading-spinner" />
                  <p>正在解读牌意...</p>
                </div>
              ) : interpretation ? (
                <div className="interp-content">
                  <p>{interpretation}</p>
                </div>
              ) : null}

              <button className="redo-btn" onClick={resetSpread}>
                重新占卜
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav />
    </div>
  );
}
