import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, History, MoonStar, Lock } from 'lucide-react';
import { spreads } from '../data/spreads';
import { tarotCards, getRandomCard, getCardById, getCardImagePath } from '../data/tarotCards';
import { resolveCardBackAsset } from '../data/assetManifest';
import { useAppStore } from '../store/useAppStore';
import { getSpreadInterpretation } from '../services/ai';
import type { SpreadCard, CardSpread } from '../types';
import AiResponse from '../components/AiResponse';
import './SpreadPage.scss';

type SpreadPhase = 'idle' | 'drawing' | 'awaiting-reflection' | 'interpreting' | 'done';

function getRandomOrientation(): 'upright' | 'reversed' {
  return Math.random() > 0.5 ? 'upright' : 'reversed';
}

export default function SpreadPage() {
  const navigate = useNavigate();
  const addSpread = useAppStore((state) => state.addSpread);
  const cardDeck = useAppStore((state) => state.cardDeck);
  const learnedCount = useAppStore((state) => state.progress.learnedCards.length);
  const isSpreadUnlocked = learnedCount >= tarotCards.length;

  const [selectedSpread, setSelectedSpread] = useState(spreads[0]);
  const [drawnCards, setDrawnCards] = useState<SpreadCard[]>([]);
  const [phase, setPhase] = useState<SpreadPhase>('idle');
  const [interpretation, setInterpretation] = useState('');
  const [userQuestion, setUserQuestion] = useState('');
  const [userReflection, setUserReflection] = useState('');

  const handleDraw = () => {
    if (!isSpreadUnlocked || !userQuestion.trim() || phase === 'drawing' || phase === 'interpreting') return;

    setPhase('drawing');
    setDrawnCards([]);
    setInterpretation('');
    setUserReflection('');

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
        setDrawnCards((prev) => [...prev, c]);
        if (i === newCards.length - 1) {
          setPhase('awaiting-reflection');
        }
      }, 400 * (i + 1));
    });
  };

  const handleInterpret = async () => {
    if (phase !== 'awaiting-reflection' || !userReflection.trim()) return;

    setPhase('interpreting');
    try {
      const spreadObj: CardSpread = {
        id: Date.now().toString(),
        templateId: selectedSpread.id,
        cardDeck,
        date: new Date().toISOString(),
        question: userQuestion,
        positions: drawnCards.map((c, i) => ({
          position: i,
          name: selectedSpread.positions[i]?.label || `位置${i + 1}`,
          meaning: selectedSpread.positions[i]?.meaning || '',
          cardId: c.cardId,
          orientation: c.orientation,
        })),
        cards: drawnCards,
        interpretation: '',
      };

      const combinedContext = `${userQuestion}\n\n用户第一感受：${userReflection.trim()}`;
      const result = await getSpreadInterpretation(spreadObj, combinedContext, undefined, cardDeck);
      setInterpretation(result);
      addSpread({ ...spreadObj, interpretation: result });
      setPhase('done');
    } catch (error) {
      console.error('Interpretation failed:', error);
      setInterpretation('解读暂时不可用，请稍后再试。');
      setPhase('done');
    }
  };

  const resetSpread = () => {
    setDrawnCards([]);
    setInterpretation('');
    setUserQuestion('');
    setUserReflection('');
    setPhase('idle');
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
              top: p.top,
              left: p.left,
              width: p.size,
              height: p.size,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
        <div className="radial-glow" />
      </div>

      <header className="spread-header">
        <div className="header-row">
          <h1 className="header-title">塔罗占卜</h1>
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
        {!isSpreadUnlocked && (
          <div className="spread-lock glass-panel">
            <Lock size={18} />
            <div>
              <h2>牌阵学习尚未解锁</h2>
              <p>先把全部 78 张牌学完，牌阵占卜才会开放。你现在已经学了 {learnedCount} 张。</p>
            </div>
            <button onClick={() => navigate('/learn')}>继续学习</button>
          </div>
        )}

        {isSpreadUnlocked && phase === 'idle' && (
          <div className="question-area">
            <input
              type="text"
              placeholder="写下你现在最想知道的问题..."
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
                        onError={(e) => { (e.target as HTMLImageElement).src = resolveCardBackAsset(cardDeck); }}
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

        {isSpreadUnlocked && phase === 'idle' && (
          <motion.button
            className="draw-btn"
            onClick={handleDraw}
            disabled={!userQuestion.trim()}
            whileTap={{ scale: 0.96 }}
          >
            <MoonStar size={18} />
            开始占卜
          </motion.button>
        )}

        <AnimatePresence>
          {phase === 'awaiting-reflection' && (
            <motion.div
              className="interpretation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="interp-title">
                <Sparkles size={16} />
                先说说你的感受
              </h3>

              <div className="reflection-box">
                <textarea
                  className="reflection-input"
                  placeholder="看完这组牌之后，你的第一感觉是什么？你觉得哪一张最刺中你？"
                  value={userReflection}
                  onChange={(e) => setUserReflection(e.target.value)}
                  rows={4}
                />
                <button className="reflection-btn" onClick={handleInterpret} disabled={!userReflection.trim()}>
                  请导师开始解读
                </button>
              </div>
            </motion.div>
          )}

          {phase === 'interpreting' && (
            <motion.div
              className="interpretation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <h3 className="interp-title">
                <Sparkles size={16} />
                AI 解读
              </h3>
              <div className="interp-loading">
                <div className="loading-spinner" />
                <p>正在整理牌意...</p>
              </div>
            </motion.div>
          )}

          {phase === 'done' && (
            <motion.div
              className="interpretation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <h3 className="interp-title">
                <Sparkles size={16} />
                AI 解读
              </h3>

              {interpretation ? (
                <div className="interp-content">
                  <AiResponse text={interpretation} />
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
