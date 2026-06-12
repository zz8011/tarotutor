import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, X } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { CardDisplay, StageProgress, QuizPanel, ChatInterface } from '../components/learn';
import type { ChoiceQuestion } from '../components/learn';
import { tarotCards, getCardById, getCardImagePath } from '../data/tarotCards';
import { getDefaultMentor, getMentorById } from '../data/mentors';
import { streamCardLearningResponse } from '../services/ai';
import {
  stageOrder,
  stageLabels,
  stageToPhase,
  buildOpeningMessage,
  buildSymbolPrompt,
  buildScenario,
  buildChoiceQuiz,
  buildTeachingPrompt,
  buildScenarioFeedbackPrompt,
  buildMasteryMessage,
  buildQuizSubmissionMessage,
  buildQuizReviewMessage,
  getNextReviewDays,
  countDueReviews,
} from '../services/learning/lessonContent';
import { useAppStore } from '../store/useAppStore';
import { localDateString } from '../utils/date';
import { useMagicParticles } from '../hooks/useMagicParticles';
import type {
  ChatMessage,
  LearningPhase,
  Mentor,
  Orientation,
  QuizAnswerMap,
  QuizOutcome,
  StudyStage,
  TarotCard,
} from '../types';
import './LearnPage.scss';

// 兼容旧导入路径；新代码请直接从 src/types 导入
export type { Orientation, QuizAnswerMap } from '../types';

/**
 * 外层组件：只负责解析路由参数和导师，再把确定存在的 card 传给 LearnSession。
 * 用 key 强制在卡牌/导师切换时重挂载内层组件，状态通过 useState 初始化器恢复，
 * 避免旧实现里 useLayoutEffect 同步 setState 造成的级联渲染与条件 Hooks 问题。
 */
export default function LearnPage() {
  const { cardId } = useParams<{ cardId?: string }>();
  const navigate = useNavigate();
  const primaryMentorId = useAppStore((state) => state.primaryMentor);

  useMagicParticles({ color: 'var(--accent-emerald)', count: 6 });

  const card = cardId ? getCardById(Number(cardId)) : tarotCards[0];
  const mentor = (primaryMentorId && getMentorById(primaryMentorId)) || getDefaultMentor();

  if (!card) {
    return (
      <div className="learn-page">
        <div className="error-state">
          <p>卡牌未找到</p>
          <button onClick={() => navigate('/library')}>返回牌库</button>
        </div>
      </div>
    );
  }

  return <LearnSession key={`${card.id}-${mentor.id}`} card={card} mentor={mentor} />;
}

interface LearnSessionProps {
  card: TarotCard;
  mentor: Mentor;
}

function LearnSession({ card, mentor }: LearnSessionProps) {
  const navigate = useNavigate();

  const currentSession = useAppStore((state) => state.currentSession);
  const startSession = useAppStore((state) => state.startSession);
  const updateCurrentSession = useAppStore((state) => state.updateCurrentSession);
  const completeCard = useAppStore((state) => state.completeCard);
  const addDiary = useAppStore((state) => state.addDiary);
  const diaryEntries = useAppStore((state) => state.progress.diaryEntries);
  const setStudyJournal = useAppStore((state) => state.setStudyJournal);
  const upsertStudyRecord = useAppStore((state) => state.upsertStudyRecord);
  const studyJournal = useAppStore((state) => state.studyJournal);
  const cardDeck = useAppStore((state) => state.cardDeck);

  const activeSession = currentSession?.cardId === card.id ? currentSession : null;
  const activeRecord = studyJournal.records[String(card.id)];
  const activeJournalMatchesCard = studyJournal.activeCardId === card.id;

  const [stage, setStage] = useState<StudyStage>(
    () =>
      (activeSession?.lessonStage ||
        activeRecord?.stage ||
        (activeJournalMatchesCard ? studyJournal.activeStage : 'observe')) as StudyStage
  );
  const [orientation, setOrientation] = useState<Orientation>(
    () =>
      activeSession?.orientation ||
      activeRecord?.orientation ||
      (activeJournalMatchesCard ? studyJournal.activeOrientation : 'upright')
  );
  const [reflection, setReflection] = useState(
    () =>
      activeSession?.reflection || activeRecord?.reflection || (activeJournalMatchesCard ? studyJournal.activeReflection : '')
  );
  const [symbolObservation, setSymbolObservation] = useState(
    () =>
      activeSession?.symbolObservation ||
      activeRecord?.symbolObservation ||
      (activeJournalMatchesCard ? studyJournal.activeSymbolObservation : '') ||
      ''
  );
  const [scenarioAnswer, setScenarioAnswer] = useState(
    () =>
      activeSession?.scenarioAnswer ||
      activeRecord?.scenarioAnswer ||
      (activeJournalMatchesCard ? studyJournal.activeScenarioAnswer : '') ||
      ''
  );
  const [followUp, setFollowUp] = useState(
    () => activeSession?.followUp || activeRecord?.followUp || (activeJournalMatchesCard ? studyJournal.activeFollowUp : '')
  );
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswerMap>(
    () =>
      activeSession?.quizAnswers ||
      activeRecord?.quizAnswers ||
      (activeJournalMatchesCard ? studyJournal.activeQuizAnswers : {}) ||
      {}
  );
  const [quizResult, setQuizResult] = useState<QuizOutcome>(
    () => activeSession?.quizResult || activeRecord?.quizResult || null
  );
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() =>
    activeSession?.messages?.length ? activeSession.messages : [buildOpeningMessage(card, mentor.chineseName, orientation)]
  );

  const chatEndRef = useRef<HTMLDivElement>(null);
  const messageCounter = useRef(0);

  const scenario = useMemo(() => buildScenario(card, orientation), [card, orientation]);
  const quizQuestions = useMemo(() => buildChoiceQuiz(card, orientation), [card, orientation]);
  const currentMeaning = orientation === 'upright' ? card.uprightMeaning : card.reversedMeaning;
  const dueReviewCount = countDueReviews(studyJournal.records);
  const answeredChoiceCount = quizQuestions.filter((question) => quizAnswers[question.id]).length;
  const correctChoiceCount = quizQuestions.filter((question) => quizAnswers[question.id] === question.correctAnswer).length;
  const allChoicesAnswered = answeredChoiceCount === quizQuestions.length;
  const choiceQuizPassed = quizResult === 'correct' && correctChoiceCount === quizQuestions.length;
  const awaitingRecap = stage === 'quiz' && choiceQuizPassed && !quizAnswers.recap;

  // 挂载时把恢复出来的进度写回会话/日志（组件按 card+mentor 作为 key 重挂载，
  // 因此这里只需运行一次，不再需要在 effect 里 setState 同步本地状态）
  useEffect(() => {
    if (!activeSession) {
      startSession(card.id, mentor.id);
    }

    setStudyJournal({
      activeCardId: card.id,
      activeStage: stage,
      activeOrientation: orientation,
      activeReflection: reflection,
      activeSymbolObservation: symbolObservation,
      activeScenarioAnswer: scenarioAnswer,
      activeFollowUp: followUp,
      activeQuizQuestion: quizQuestions.map((question) => question.prompt).join('\n'),
      activeQuizOptions: quizQuestions.flatMap((question) => question.options),
      activeQuizAnswer: quizAnswers.recap || '',
      activeQuizAnswers: quizAnswers,
      activeQuizResult: quizResult,
      activeMentorId: mentor.id,
      activeSummary: currentMeaning,
    });

    upsertStudyRecord(card.id, {
      stage,
      orientation,
      mentorId: mentor.id,
      reflection,
      symbolObservation,
      scenarioAnswer,
      followUp,
      quizQuestion: quizQuestions.map((question) => question.prompt).join('\n'),
      quizOptions: quizQuestions.flatMap((question) => question.options),
      quizAnswer: quizAnswers.recap || '',
      quizAnswers,
      quizResult,
    });
    // 仅在挂载时执行一次（key 变化即重挂载）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chatMessages.length, stage, quizAnswers]);

  const createMessage = (role: ChatMessage['role'], content: string, phase?: LearningPhase): ChatMessage => ({
    id: `msg-${Date.now()}-${messageCounter.current++}`,
    role,
    content,
    timestamp: new Date().toISOString(),
    phase: phase || stageToPhase(stage),
    cardId: card.id,
    mentorId: mentor.id,
  });

  const persistSession = (patch: {
    lessonStage?: StudyStage;
    orientation?: Orientation;
    reflection?: string;
    symbolObservation?: string;
    scenarioAnswer?: string;
    followUp?: string;
    quizAnswers?: QuizAnswerMap;
    quizAnswer?: string;
    quizResult?: QuizOutcome;
    summary?: string;
    messages?: ChatMessage[];
  }) => {
    const nextStage = patch.lessonStage ?? stage;
    const nextOrientation = patch.orientation ?? orientation;
    const nextReflection = patch.reflection ?? reflection;
    const nextSymbolObservation = patch.symbolObservation ?? symbolObservation;
    const nextScenarioAnswer = patch.scenarioAnswer ?? scenarioAnswer;
    const nextFollowUp = patch.followUp ?? followUp;
    const nextQuizAnswers = patch.quizAnswers ?? quizAnswers;
    const nextQuizAnswer = patch.quizAnswer ?? nextQuizAnswers.recap ?? '';
    const nextQuizResult = patch.quizResult ?? quizResult;
    const nextMessages = patch.messages ?? chatMessages;
    const nextSummary = patch.summary ?? currentMeaning;
    const isMastered = nextStage === 'mastered';
    const wasMastered = Boolean(activeRecord?.mastered);
    const currentReviewCount = activeRecord?.reviewCount ?? 0;
    const nextReviewCount = isMastered && !wasMastered ? currentReviewCount + 1 : currentReviewCount;

    updateCurrentSession({
      cardId: card.id,
      mentorId: mentor.id,
      lessonStage: nextStage,
      orientation: nextOrientation,
      reflection: nextReflection,
      symbolObservation: nextSymbolObservation,
      scenarioAnswer: nextScenarioAnswer,
      followUp: nextFollowUp,
      quizQuestion: quizQuestions.map((question) => question.prompt).join('\n'),
      quizOptions: quizQuestions.flatMap((question) => question.options),
      quizAnswer: nextQuizAnswer,
      quizAnswers: nextQuizAnswers,
      quizResult: nextQuizResult,
      summary: nextSummary,
      messages: nextMessages,
      phase: stageToPhase(nextStage),
      userFeeling: nextReflection || null,
      knowledgeUnlocked: isMastered || activeSession?.knowledgeUnlocked || false,
      diary: null,
      endedAt: isMastered ? new Date().toISOString() : null,
    });

    setStudyJournal({
      activeCardId: card.id,
      activeStage: nextStage,
      activeOrientation: nextOrientation,
      activeReflection: nextReflection,
      activeSymbolObservation: nextSymbolObservation,
      activeScenarioAnswer: nextScenarioAnswer,
      activeFollowUp: nextFollowUp,
      activeQuizQuestion: quizQuestions.map((question) => question.prompt).join('\n'),
      activeQuizOptions: quizQuestions.flatMap((question) => question.options),
      activeQuizAnswer: nextQuizAnswer,
      activeQuizAnswers: nextQuizAnswers,
      activeQuizResult: nextQuizResult,
      activeMentorId: mentor.id,
      activeSummary: nextSummary,
    });

    upsertStudyRecord(card.id, {
      stage: nextStage,
      orientation: nextOrientation,
      mentorId: mentor.id,
      reflection: nextReflection,
      symbolObservation: nextSymbolObservation,
      scenarioAnswer: nextScenarioAnswer,
      followUp: nextFollowUp,
      quizQuestion: quizQuestions.map((question) => question.prompt).join('\n'),
      quizOptions: quizQuestions.flatMap((question) => question.options),
      quizAnswer: nextQuizAnswer,
      quizAnswers: nextQuizAnswers,
      quizResult: nextQuizResult,
      mastered: isMastered,
      reviewCount: nextReviewCount,
      lastStudiedAt: new Date().toISOString(),
      completedAt: isMastered ? activeRecord?.completedAt ?? new Date().toISOString() : activeRecord?.completedAt ?? null,
      nextReviewAt: isMastered
        ? activeRecord?.nextReviewAt ??
          new Date(Date.now() + getNextReviewDays(currentReviewCount) * 24 * 60 * 60 * 1000).toISOString()
        : activeRecord?.nextReviewAt ?? null,
    });
  };

  const commitMessages = (messages: ChatMessage[], patch: Parameters<typeof persistSession>[0] = {}) => {
    setChatMessages(messages);
    persistSession({ ...patch, messages });
  };

  const handleOrientationChange = (nextOrientation: Orientation) => {
    if (nextOrientation === orientation || isStreaming) return;

    const nextMessages = [buildOpeningMessage(card, mentor.chineseName, nextOrientation)];
    setOrientation(nextOrientation);
    setStage('observe');
    setReflection('');
    setSymbolObservation('');
    setScenarioAnswer('');
    setFollowUp('');
    setQuizAnswers({});
    setQuizResult(null);
    commitMessages(nextMessages, {
      lessonStage: 'observe',
      orientation: nextOrientation,
      reflection: '',
      symbolObservation: '',
      scenarioAnswer: '',
      followUp: '',
      quizAnswers: {},
      quizAnswer: '',
      quizResult: null,
      summary: '',
    });
  };

  const streamMentorMessage = async (
    baseMessages: ChatMessage[],
    pendingMessage: ChatMessage,
    prompt: string,
    nextStage: StudyStage,
    afterMessage?: ChatMessage,
    summary?: string
  ) => {
    setIsStreaming(true);
    setStage('teach');
    commitMessages([...baseMessages, pendingMessage], { lessonStage: 'teach' });

    try {
      let fullContent = '';
      const stream = streamCardLearningResponse(card, orientation, prompt, baseMessages.slice(-8), mentor.id, cardDeck);

      for await (const chunk of stream) {
        fullContent += chunk;
        setChatMessages((prev) =>
          prev.map((message) => (message.id === pendingMessage.id ? { ...message, content: fullContent } : message))
        );
      }

      const completedMentorMessage = { ...pendingMessage, content: fullContent };
      const nextMessages = afterMessage
        ? [...baseMessages, completedMentorMessage, afterMessage]
        : [...baseMessages, completedMentorMessage];

      setStage(nextStage);
      commitMessages(nextMessages, {
        lessonStage: nextStage,
        summary: summary || fullContent,
      });
    } catch (error) {
      console.error('AI stream failed:', error);
      const fallbackMessages = [
        ...baseMessages,
        {
          ...pendingMessage,
          content: '导师暂时连接不上。你刚才的观察已经保存了，我们稍后可以从这里继续。',
        },
      ];
      setStage('symbols');
      commitMessages(fallbackMessages, { lessonStage: 'symbols' });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleObservationSubmit = () => {
    const value = reflection.trim();
    if (!value || isStreaming) return;

    const userMessage = createMessage('user', value, 'perception');
    const mentorMessage = createMessage('assistant', buildSymbolPrompt(card), 'perception');
    const nextMessages = [...chatMessages, userMessage, mentorMessage];

    setStage('symbols');
    commitMessages(nextMessages, {
      lessonStage: 'symbols',
      reflection: value,
      followUp: '',
    });
  };

  const handleSymbolSubmit = async () => {
    const value = symbolObservation.trim();
    if (!value || isStreaming) return;

    const userMessage = createMessage('user', value, 'perception');
    const baseMessages = [...chatMessages, userMessage];
    const pendingMessage = createMessage('assistant', '导师正在把你的观察和标准牌义对齐……', 'understanding');
    const scenarioMessage = createMessage(
      'assistant',
      [
        `现在做第三步：情境应用。`,
        `场景：${scenario.situation}`,
        scenario.question,
        '请像真正解牌一样回答：先说牌面证据，再说判断，最后给建议。',
      ].join('\n\n'),
      'application'
    );

    setSymbolObservation(value);
    await streamMentorMessage(
      baseMessages,
      pendingMessage,
      buildTeachingPrompt(card, orientation, reflection, value),
      'scenario',
      scenarioMessage
    );
  };

  const handleScenarioSubmit = async () => {
    const value = scenarioAnswer.trim();
    if (!value || isStreaming) return;

    const userMessage = createMessage('user', value, 'application');
    const baseMessages = [...chatMessages, userMessage];
    const pendingMessage = createMessage('assistant', '导师正在批改你的情境解读……', 'application');
    const quizIntro = createMessage(
      'assistant',
      [
        '进入最后一步：掌握测试。',
        '下面不是死记硬背，而是确认你能把牌面证据、关键词和情境判断连起来。先完成三道选择题，通过后再用一句话复述这张牌。',
      ].join('\n\n'),
      'application'
    );

    setScenarioAnswer(value);
    await streamMentorMessage(
      baseMessages,
      pendingMessage,
      buildScenarioFeedbackPrompt(card, orientation, scenario, value),
      'quiz',
      quizIntro
    );
  };

  const handleQuizChoice = (question: ChoiceQuestion, answer: string) => {
    if (isStreaming || stage === 'mastered' || choiceQuizPassed) return;

    const nextAnswers = { ...quizAnswers, [question.id]: answer };
    const nextQuizResult = quizResult === 'incorrect' ? 'incorrect' : null;

    setQuizAnswers(nextAnswers);
    setQuizResult(nextQuizResult);
    persistSession({
      lessonStage: 'quiz',
      quizAnswers: nextAnswers,
      quizAnswer: answer,
      quizResult: nextQuizResult,
    });
  };

  const handleQuizSubmit = () => {
    if (!allChoicesAnswered || isStreaming || stage === 'mastered') return;

    const passed = quizQuestions.every((question) => quizAnswers[question.id] === question.correctAnswer);
    const userMessage = createMessage('user', buildQuizSubmissionMessage(quizQuestions, quizAnswers), 'application');
    const reviewMessage = createMessage('assistant', buildQuizReviewMessage(quizQuestions, quizAnswers), 'application');
    const nextMessages = [...chatMessages, userMessage, reviewMessage];
    const nextQuizResult = passed ? 'correct' : 'incorrect';

    setQuizResult(nextQuizResult);
    commitMessages(nextMessages, {
      lessonStage: 'quiz',
      quizAnswers,
      quizAnswer: '',
      quizResult: nextQuizResult,
    });
  };

  const handleRecapSubmit = () => {
    const value = followUp.trim();
    if (!value || isStreaming || !choiceQuizPassed) return;

    const userMessage = createMessage('user', value, 'mastery');

    if (value.length < 12) {
      const mentorMessage = createMessage(
        'assistant',
        '这句太短了，还不能算真正掌握。请补上两个部分：一个牌面细节，一个解读提醒。',
        'application'
      );
      const nextMessages = [...chatMessages, userMessage, mentorMessage];
      setFollowUp('');
      commitMessages(nextMessages, { lessonStage: 'quiz', followUp: '', quizAnswer: value });
      return;
    }

    const nextAnswers = { ...quizAnswers, recap: value };
    const masteryMessage = createMessage('assistant', buildMasteryMessage(card, orientation, value), 'mastery');
    const nextMessages = [...chatMessages, userMessage, masteryMessage];

    completeCard(card.id);

    // 学习闭环：把学员自己的复述沉淀为当天的学习日记（同卡同天只记一次）
    const today = localDateString();
    const alreadyLogged = diaryEntries.some((entry) => entry.cardId === card.id && entry.date === today);
    if (!alreadyLogged) {
      addDiary({
        id: `diary-${card.id}-${Date.now()}`,
        cardId: card.id,
        date: today,
        content: value,
        mood: '',
        tags: [orientation === 'upright' ? '正位' : '逆位', card.chineseName],
      });
    }

    setStage('mastered');
    setQuizAnswers(nextAnswers);
    setQuizResult('correct');
    setFollowUp('');
    commitMessages(nextMessages, {
      lessonStage: 'mastered',
      followUp: '',
      quizAnswers: nextAnswers,
      quizAnswer: value,
      quizResult: 'correct',
      summary: masteryMessage.content,
    });
  };

  const handleFollowUp = async () => {
    const value = followUp.trim();
    if (!value || isStreaming || stage !== 'mastered') return;

    const userMessage = createMessage('user', value, 'mastery');
    const baseMessages = [...chatMessages, userMessage];
    const pendingMessage = createMessage('assistant', '导师正在回应你的追问……', 'mastery');

    setFollowUp('');
    await streamMentorMessage(baseMessages, pendingMessage, value, 'mastered');
  };

  const handleComposerSend = () => {
    if (stage === 'observe') {
      handleObservationSubmit();
      return;
    }
    if (stage === 'symbols') {
      void handleSymbolSubmit();
      return;
    }
    if (stage === 'scenario') {
      void handleScenarioSubmit();
      return;
    }
    if (awaitingRecap) {
      handleRecapSubmit();
      return;
    }
    if (stage === 'mastered') {
      void handleFollowUp();
    }
  };

  const composerValue =
    stage === 'observe'
      ? reflection
      : stage === 'symbols'
        ? symbolObservation
        : stage === 'scenario'
          ? scenarioAnswer
          : followUp;

  const setComposerValue = (value: string) => {
    if (stage === 'observe') {
      setReflection(value);
      persistSession({ reflection: value });
      return;
    }
    if (stage === 'symbols') {
      setSymbolObservation(value);
      persistSession({ symbolObservation: value });
      return;
    }
    if (stage === 'scenario') {
      setScenarioAnswer(value);
      persistSession({ scenarioAnswer: value });
      return;
    }
    setFollowUp(value);
    persistSession({ followUp: value });
  };

  const composerPlaceholder =
    stage === 'observe'
      ? '写下你看到的细节、情绪和第一直觉...'
      : stage === 'symbols'
        ? '挑一个牌面细节，说说它为什么重要...'
        : stage === 'teach'
          ? '导师正在讲解...'
          : stage === 'scenario'
            ? '先说牌面证据，再给出你的情境解读...'
            : awaitingRecap
              ? '用自己的话复述这张牌，不要背原文...'
              : stage === 'quiz'
                ? '先完成上面的导师测试...'
                : '继续向导师追问这张牌...';

  const composerDisabled = isStreaming || stage === 'teach' || (stage === 'quiz' && !awaitingRecap);
  const sendDisabled =
    isStreaming ||
    stage === 'teach' ||
    (stage === 'quiz' && !awaitingRecap) ||
    !composerValue.trim();

  return (
    <div className="learn-page">
      <header className="learn-header">
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="返回">
          <ArrowLeft size={20} />
        </button>
        <div className="header-center">
          <span className="card-arcana">{card.arcana === 'major' ? 'Major Arcana' : card.suit}</span>
          <h1 className="card-title">{card.chineseName}</h1>
        </div>
        <div className="header-spacer" />
      </header>

      <main className="learn-main">
        <section className="card-anchor">
          <div className="fixed-card">
            <CardDisplay
              card={card}
              orientation={orientation}
              cardDeck={cardDeck}
              onOrientationChange={handleOrientationChange}
              onImageOpen={() => setIsImageOpen(true)}
              disabled={isStreaming}
            />
            <StageProgress
              stage={stage}
              stageOrder={stageOrder}
              stageLabels={stageLabels}
              dueReviewCount={dueReviewCount}
            />
          </div>
        </section>

        <ChatInterface
          messages={chatMessages}
          mentorName={mentor.chineseName}
          mentorAvatar={mentor.avatarImage}
          composerValue={composerValue}
          composerPlaceholder={composerPlaceholder}
          composerDisabled={composerDisabled}
          sendDisabled={sendDisabled}
          onComposerChange={setComposerValue}
          onSend={handleComposerSend}
          footer={
            stage === 'mastered' ? (
              <div className="mastery-actions">
                <button className="mastery-btn secondary" onClick={() => navigate('/library')}>
                  返回牌库
                </button>
                <button
                  className="mastery-btn primary"
                  onClick={() => navigate(`/learn/${Math.min(card.id + 1, tarotCards.length - 1)}`)}
                  disabled={card.id >= tarotCards.length - 1}
                >
                  下一张牌
                </button>
              </div>
            ) : null
          }
        >
          {(stage === 'quiz' || stage === 'mastered') && (
            <QuizPanel
              questions={quizQuestions}
              answers={quizAnswers}
              quizResult={quizResult}
              choiceQuizPassed={choiceQuizPassed}
              allChoicesAnswered={allChoicesAnswered}
              correctChoiceCount={correctChoiceCount}
              stage={stage}
              isStreaming={isStreaming}
              onChoice={handleQuizChoice}
              onSubmit={handleQuizSubmit}
            />
          )}
          <div ref={chatEndRef} />
        </ChatInterface>
      </main>

      <AnimatePresence>
        {isImageOpen && (
          <motion.div
            className="card-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={`${card.chineseName} 大图`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsImageOpen(false)}
          >
            <motion.div
              className="card-lightbox-inner"
              initial={{ scale: 0.96, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 8 }}
              onClick={(event) => event.stopPropagation()}
            >
              <button className="lightbox-close" type="button" onClick={() => setIsImageOpen(false)} aria-label="关闭大图">
                <X size={18} />
              </button>
              <img
                src={getCardImagePath(card.id, cardDeck)}
                alt={`${card.chineseName} ${orientation === 'upright' ? '正位' : '逆位'}`}
                className={orientation === 'reversed' ? 'reversed' : ''}
              />
              <div className="lightbox-caption">
                <span>{card.chineseName}</span>
                <span>{orientation === 'upright' ? '正位' : '逆位'}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
