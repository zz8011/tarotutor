import BottomNav from '../components/BottomNav';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, BookOpen, Sparkles, Flame } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { getCardById } from '../data/tarotCards';
import { localDateString } from '../utils/date';
import './DiaryPage.scss';

export default function DiaryPage() {
  const { progress } = useAppStore();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = `${year}年${month + 1}月`;

  // 日历真实映射：把日记条目的日期（YYYY-MM-DD）收进集合，按天点亮
  const entryDates = useMemo(
    () => new Set(progress.diaryEntries.map((entry) => entry.date)),
    [progress.diaryEntries]
  );

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: { day: number; isCurrentMonth: boolean; hasEntry: boolean; isStreak: boolean; isToday: boolean }[] = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
        hasEntry: false,
        isStreak: false,
        isToday: false,
      });
    }

    const todayStr = localDateString();

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = localDateString(new Date(year, month, d));
      const isToday = dateStr === todayStr;
      days.push({
        day: d,
        isCurrentMonth: true,
        hasEntry: entryDates.has(dateStr),
        // 火苗标记：今天已学习（lastStudyDate 命中今天）
        isStreak: isToday && progress.lastStudyDate === todayStr,
        isToday,
      });
    }

    return days;
  }, [year, month, entryDates, progress.lastStudyDate]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="diary-page">
      <header className="diary-header">
        <div className="header-info">
          <h2 className="header-subtitle">Learning Journey</h2>
          <div className="month-nav">
            <button onClick={prevMonth} className="nav-arrow"><ChevronLeft size={16} /></button>
            <h1 className="header-month">{monthName}</h1>
            <button onClick={nextMonth} className="nav-arrow"><ChevronRight size={16} /></button>
          </div>
        </div>
        <div className="header-streak">
          <Flame size={16} className="streak-icon" />
          <span className="streak-count">{progress.streak}</span>
        </div>
      </header>

      <main className="diary-main">
        <section className="calendar-section">
          <div className="week-header">
            {weekDays.map(d => <span key={d} className="week-day">{d}</span>)}
          </div>
          <div className="calendar-grid">
            {calendarDays.map((day, i) => (
              <div
                key={i}
                className={`cal-cell ${!day.isCurrentMonth ? 'other-month' : ''} ${day.hasEntry ? 'has-entry' : ''} ${day.isStreak ? 'streak' : ''} ${day.isToday ? 'today' : ''}`}
              >
                <span className="cal-day">{day.day}</span>
                {day.hasEntry && <Sparkles size={10} className="cal-icon" />}
                {day.isStreak && !day.hasEntry && <Flame size={10} className="cal-icon streak-icon" />}
              </div>
            ))}
          </div>
        </section>

        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{progress.diaryEntries.length}</span>
            <span className="stat-label">学习记录</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{progress.learnedCards.length}</span>
            <span className="stat-label">已学卡牌</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{progress.longestStreak}</span>
            <span className="stat-label">最长连续</span>
          </div>
        </div>

        <section className="entries-section">
          <h3 className="section-title">最近记录</h3>
          {progress.diaryEntries.length === 0 ? (
            <div className="empty-state">
              <BookOpen size={32} className="empty-icon" />
              <p>还没有学习日记</p>
              <span>完成一次学习后，可以记录你的感受</span>
            </div>
          ) : (
            <div className="entries-list">
              {/* diaryEntries 写入时新条目在最前，直接顺序展示即为最新优先 */}
              {progress.diaryEntries.slice(0, 30).map((entry, i) => {
                const card = getCardById(entry.cardId);
                const preview = entry.content?.slice(0, 60) || '无笔记';
                return (
                  <motion.div
                    key={entry.id}
                    className="entry-card"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i, 8) * 0.05 }}
                  >
                    <span className="entry-symbol">{card?.imageSymbol || '🃏'}</span>
                    <div className="entry-info">
                      <h4>{card?.chineseName || '未知卡牌'}</h4>
                      <p>{preview}{(entry.content?.length || 0) > 60 ? '…' : ''}</p>
                      {entry.tags.length > 0 && (
                        <div className="entry-tags">
                          {entry.tags.map((tag) => (
                            <span key={tag} className="entry-tag">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="entry-date">
                      {entry.date}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
