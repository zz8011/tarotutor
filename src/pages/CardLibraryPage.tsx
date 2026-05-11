import { useState } from 'react';
import BottomNav from '../components/BottomNav';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { tarotCards, getCardImagePath } from '../data/tarotCards';
import { useMagicParticles } from '../hooks/useMagicParticles';
import { useAppStore } from '../store/useAppStore';
import type { TarotCard } from '../types';
import LazyImage from '../components/common/LazyImage';
import './CardLibraryPage.scss';

type FilterType = 'all' | 'major' | 'wands' | 'cups' | 'swords' | 'pentacles';

export default function CardLibraryPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const cardDeck = useAppStore((state) => state.cardDeck);

  // Initialize magic particles with gold color for library page
  useMagicParticles({ color: 'var(--accent-gold)', count: 6 });

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'major', label: '大阿卡纳' },
    { key: 'wands', label: '权杖' },
    { key: 'cups', label: '圣杯' },
    { key: 'swords', label: '宝剑' },
    { key: 'pentacles', label: '星币' },
  ];

  const filteredCards = tarotCards.filter((card: TarotCard) => {
    if (activeFilter !== 'all') {
      if (activeFilter === 'major' && card.arcana !== 'major') return false;
      if (activeFilter !== 'major' && card.suit !== activeFilter) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        card.chineseName.toLowerCase().includes(q) ||
        card.name.toLowerCase().includes(q) ||
        card.keywords.some(k => k.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="library-page">
      <header className="library-header">
        <h1 className="header-title">Arcanum</h1>
        <div className="search-bar">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="搜索卡牌..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>

        <nav className="filter-tabs">
          {filters.map(f => (
            <button
              key={f.key}
              className={`filter-tab ${activeFilter === f.key ? 'active' : ''}`}
              onClick={() => setActiveFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="library-main">
        <div className="card-count">{filteredCards.length} 张卡牌</div>

        <div className="card-grid">
          {filteredCards.map((card: TarotCard) => (
            <motion.div
              key={card.id}
              className="card-tile"
              onClick={() => navigate(`/learn/${card.id}`)}
              whileTap={{ scale: 0.95 }}
              layout
            >
              <div className="tile-arcana-badge">
                {card.arcana === 'major' ? '大阿' : card.suit?.slice(0, 1).toUpperCase()}
              </div>
              <LazyImage
                src={getCardImagePath(card.id, cardDeck)}
                alt={card.chineseName}
                className="tile-card-image"
                placeholder="skeleton"
              />
              <div className="tile-info">
                <span className="tile-name">{card.chineseName}</span>
                <span className="tile-number">
                  {card.arcana === 'major' ? `${card.number}` : `${card.number}`}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredCards.length === 0 && (
          <div className="empty-state">
            <span className="empty-emoji">🔍</span>
            <p>未找到匹配的卡牌</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
