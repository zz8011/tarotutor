import { useState } from 'react';
import BottomNav from '../components/BottomNav';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, BookOpen } from 'lucide-react';
import { tarotCards, majorArcana, minorArcana } from '../data/tarotCards';
import { useAppStore } from '../store/useAppStore';
import './CardLibraryPage.scss';

export default function CardLibraryPage() {
  const navigate = useNavigate();
  const { progress } = useAppStore();
  const [filter, setFilter] = useState<'all' | 'major' | 'minor'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCards = tarotCards.filter((card) => {
    const matchesFilter = filter === 'all' || (filter === 'major' ? card.arcana === 'major' : card.arcana !== 'major');
    const matchesSearch = card.chineseName.includes(searchQuery) || card.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="library-page page-container">
      <div className="library-header">
        <button className="back-btn" aria-label="返回" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <h1>卡牌百科</h1>
      </div>

      <div className="search-bar">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="搜索卡牌名称..."
          aria-label="搜索卡牌名称"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="filter-tabs">
        {(['all', 'major', 'minor'] as const).map((f) => (
          <button
            key={f}
            className={`filter-tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
            aria-label={`筛选${f === 'all' ? '全部' : f === 'major' ? '大阿卡纳' : '小阿卡纳'}卡牌`}
            aria-pressed={filter === f}
          >
            {f === 'all' ? '全部' : f === 'major' ? '大阿卡纳' : '小阿卡纳'}
            <span className="count">
              {f === 'all' ? tarotCards.length : f === 'major' ? majorArcana.length : minorArcana.length}
            </span>
          </button>
        ))}
      </div>

      <div className="cards-grid">
        {filteredCards.map((card, index) => {
          const isLearned = progress.learnedCards.includes(card.id);
          return (
            <motion.div
              key={card.id}
              className={`card-item ${isLearned ? 'learned' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => navigate(`/learn/${card.id}`)}
            >
              <div className="card-image-wrapper">
                <img
                  src={card.image}
                  alt={card.chineseName}
                  loading="lazy"
                  className="card-image"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/cards/00-the-fool.jpg'; }}
                />
              </div>
              <div className="card-info">
                <h4>{card.chineseName}</h4>
                <p className="card-suit">{card.arcana === 'major' ? '大阿卡纳' : card.suit}</p>
              </div>
              {isLearned && (
                <div className="learned-badge">
                  <BookOpen size={14} />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
          <BottomNav />
    </div>
  );
}
