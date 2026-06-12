import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { getCardImagePath } from '../../data/tarotCards';
import type { Orientation, TarotCard } from '../../types';

export interface CardDisplayProps {
  card: TarotCard;
  orientation: Orientation;
  cardDeck: 'eastern' | 'chinese-ink';
  onOrientationChange: (orientation: Orientation) => void;
  onImageOpen: () => void;
  disabled?: boolean;
}

export default function CardDisplay({
  card,
  orientation,
  cardDeck,
  onOrientationChange,
  onImageOpen,
  disabled = false,
}: CardDisplayProps) {
  const cardImagePath = getCardImagePath(card.id, cardDeck);

  return (
    <div className="card-study-info">
      <div className="study-kicker">牌面常驻 · 导师陪练</div>
      <h2>{card.chineseName}</h2>
      <p>{card.name}</p>

      <motion.div
        className="card-visual"
        animate={{ rotate: orientation === 'reversed' ? 180 : 0 }}
        transition={{ duration: 0.4 }}
      >
        <button className="card-zoom-trigger" type="button" onClick={onImageOpen}>
          <img src={cardImagePath} alt={card.chineseName} className="card-image" />
        </button>
      </motion.div>

      <div className="orientation-row">
        <button
          className={`orient-btn ${orientation === 'upright' ? 'active' : ''}`}
          onClick={() => onOrientationChange('upright')}
          disabled={disabled}
        >
          正位
        </button>
        <button
          className="flip-btn"
          onClick={() => onOrientationChange(orientation === 'upright' ? 'reversed' : 'upright')}
          disabled={disabled}
          aria-label="翻转牌面"
        >
          <RotateCcw size={14} />
        </button>
        <button
          className={`orient-btn ${orientation === 'reversed' ? 'active' : ''}`}
          onClick={() => onOrientationChange('reversed')}
          disabled={disabled}
        >
          逆位
        </button>
      </div>
    </div>
  );
}
