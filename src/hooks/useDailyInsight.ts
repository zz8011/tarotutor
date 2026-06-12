import { useMemo, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { getDailyCardGuidance } from '../services/ai';
import { getCardById } from '../data/tarotCards';

export function useDailyInsight() {
  const {
    dailyCard,
    dailyGuidance: savedDailyGuidance,
    cardDeck,
    drawDailyCard,
    setDailyGuidance,
  } = useAppStore();
  const [isLoadingGuidance, setIsLoadingGuidance] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showGuidance, setShowGuidance] = useState(false);

  const dailyCardData = useMemo(() => {
    if (!dailyCard) return null;
    return getCardById(dailyCard.cardId);
  }, [dailyCard]);

  const currentDailyGuidance = useMemo(() => {
    if (!dailyCard || !savedDailyGuidance) return '';
    const matchesCard = savedDailyGuidance.cardId === dailyCard.cardId;
    const matchesDate = savedDailyGuidance.date === dailyCard.date;
    const matchesOrientation = savedDailyGuidance.orientation === dailyCard.orientation;
    const matchesDeck = savedDailyGuidance.deck === dailyCard.deck;
    return matchesCard && matchesDate && matchesOrientation && matchesDeck ? savedDailyGuidance.content : '';
  }, [dailyCard, savedDailyGuidance]);

  const handleDrawDaily = async () => {
    if (dailyCard) {
      setIsFlipped(true);
      setShowGuidance(true);
      if (!currentDailyGuidance && dailyCardData && !isLoadingGuidance) {
        setIsLoadingGuidance(true);
        try {
          const guidance = await getDailyCardGuidance(dailyCardData, dailyCard.orientation, dailyCard.deck);
          setDailyGuidance({
            cardId: dailyCard.cardId,
            date: dailyCard.date,
            orientation: dailyCard.orientation,
            deck: dailyCard.deck,
            content: guidance,
          });
        } catch (error) {
          console.error('今日启示获取失败:', error);
        } finally {
          setIsLoadingGuidance(false);
        }
      }
      return;
    }

    const nextDailyCard = await drawDailyCard();
    const card = getCardById(nextDailyCard.cardId);
    if (!card) return;
    setIsFlipped(true);
    setShowGuidance(true);
    setIsLoadingGuidance(true);
    try {
      const guidance = await getDailyCardGuidance(card, nextDailyCard.orientation, nextDailyCard.deck);
      setDailyGuidance({
        cardId: nextDailyCard.cardId,
        date: nextDailyCard.date,
        orientation: nextDailyCard.orientation,
        deck: nextDailyCard.deck,
        content: guidance,
      });
    } catch (error) {
      console.error('今日启示获取失败:', error);
    } finally {
      setIsLoadingGuidance(false);
    }
  };

  return {
    dailyCardData,
    dailyCardDeck: dailyCard?.deck || cardDeck,
    currentDailyGuidance,
    handleDrawDaily,
    isFlipped,
    isLoadingGuidance,
    showGuidance,
  };
}
