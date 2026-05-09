import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  CircleCheckBig,
  MessageCircle,
  RotateCcw,
  Send,
  Sparkles,
  WandSparkles,
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import AiResponse from '../components/AiResponse';
import { tarotCards, getCardById, getCardImagePath } from '../data/tarotCards';
import { getDefaultMentor, getMentorById } from '../data/mentors';
import { streamCardLearningResponse } from '../services/ai';
import { useAppStore } from '../store/useAppStore';
import { useMagicParticles } from '../hooks/useMagicParticles';
import type { ChatMessage, LearningPhase, StudyStage, TarotCard } from '../types';
import './LearnPage.scss';

type Orientation = 'upright' | 'reversed';
type QuizAnswerMap = Record<string, string>;

interface ChoiceQuestion {
  id: string;
  label: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface ScenarioPrompt {
  topic: string;
  situation: string;
  question: string;
}

const stageOrder: StudyStage[] = ['observe', 'symbols', 'teach', 'scenario', 'quiz', 'mastered'];

const stageLabels: Record<StudyStage, string> = {
  observe: '观察牌面',
  symbols: '提取符号',
  teach: '导师讲解',
  scenario: '情境练习',
  quiz: '掌握测试',
  mastered: '已掌握',
};

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function uniqueList(items: string[]) {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}

function buildOptions(correctAnswer: string, candidates: string[], limit = 4) {
  const distractors = shuffle(uniqueList(candidates).filter((item) => item !== correctAnswer)).slice(0, limit - 1);
  return shuffle([correctAnswer, ...distractors]);
}

function normalizeMeaning(text: string) {
  return (
    text
      .replace(/[。！？]/g, '，')
      .split('，')
      .map((part) => part.trim())
      .filter(Boolean)[0] || ''
  );
}

function stageToPhase(stage: StudyStage): LearningPhase {
  if (stage === 'mastered') return 'mastery';
  if (stage === 'scenario' || stage === 'quiz') return 'application';
  if (stage === 'teach') return 'understanding';
  return 'perception';
}

function buildOpeningMessage(card: TarotCard, mentorName: string, orientation: Orientation): ChatMessage {
  return {
    id: `opening-${card.id}-${orientation}`,
    role: 'assistant',
    content: [
      `${mentorName}会带你按真正读牌的方式学习这张牌。`,
      `今天先学习 ${card.chineseName} 的${orientation === 'upright' ? '正位' : '逆位'}。请先盯着牌面看一会儿，不急着背答案。`,
      '第一步只做观察：写下三个东西。你最先注意到的画面细节、它带来的情绪、它像在提醒一个人什么。',
    ].join('\n\n'),
    timestamp: new Date().toISOString(),
    phase: 'perception',
  };
}

function buildSymbolPrompt(card: TarotCard): string {
  return [
    '很好，我们进入第二步：只看牌面证据。',
    `请从 ${card.chineseName} 的人物、姿态、背景、光线、道具里挑一个最有信息量的细节。`,
    '告诉我：你看见了什么？你为什么觉得它重要？它支持了你刚才的直觉，还是和你的直觉有冲突？',
  ].join('\n\n');
}

function buildScenario(card: TarotCard, orientation: Orientation): ScenarioPrompt {
  const scenarioPool: ScenarioPrompt[] = [
    {
      topic: '关系沟通',
      situation: `一个人问：我和对方最近明明在联系，却总觉得距离变远了。抽到 ${card.chineseName}${orientation === 'upright' ? '正位' : '逆位'}。`,
      question: '请你试着读这张牌：这段关系正在发生什么？当事人最需要注意什么？',
    },
    {
      topic: '事业选择',
      situation: `一个人正在考虑要不要换方向，内心既期待又害怕。抽到 ${card.chineseName}${orientation === 'upright' ? '正位' : '逆位'}。`,
      question: '请你用这张牌给出判断：它支持行动、等待、调整，还是先看清问题？为什么？',
    },
    {
      topic: '自我成长',
      situation: `一个人觉得自己卡住了，不知道真正的问题在哪里。抽到 ${card.chineseName}${orientation === 'upright' ? '正位' : '逆位'}。`,
      question: '请你结合牌面，说出这张牌指出的内在课题，以及一个具体建议。',
    },
    {
      topic: '日常决策',
      situation: `一个人面对一个不算巨大、但让他反复犹豫的决定。抽到 ${card.chineseName}${orientation === 'upright' ? '正位' : '逆位'}。`,
      question: '请你解释：这张牌提醒他先处理什么？这个提醒来自牌面的哪个细节？',
    },
  ];

  return scenarioPool[card.id % scenarioPool.length];
}

function buildChoiceQuiz(card: TarotCard, orientation: Orientation): ChoiceQuestion[] {
  const coreKeyword = card.keywords.find(Boolean) || card.chineseName;
  const keywordDistractors = uniqueList(
    tarotCards.flatMap((item) => item.keywords.slice(0, 2)).filter((keyword) => keyword !== coreKeyword)
  ).slice(0, 5);
  const meaning = orientation === 'upright' ? card.uprightMeaning : card.reversedMeaning;
  const correctMeaning = normalizeMeaning(meaning) || coreKeyword;
  const meaningDistractors = uniqueList(
    tarotCards
      .filter((item) => item.id !== card.id)
      .map((item) => normalizeMeaning(orientation === 'upright' ? item.uprightMeaning : item.reversedMeaning))
      .filter((item) => item && item !== correctMeaning)
  ).slice(0, 5);

  return [
    {
      id: 'keyword',
      label: '核心关键词',
      prompt: '如果只能先抓一个关键词，哪一个最贴近这张牌？',
      options: buildOptions(coreKeyword, keywordDistractors),
      correctAnswer: coreKeyword,
      explanation: `先抓住“${coreKeyword}”，再回到牌面细节和具体情境里展开。`,
    },
    {
      id: 'orientation',
      label: orientation === 'upright' ? '正位含义' : '逆位含义',
      prompt: `${orientation === 'upright' ? '正位' : '逆位'}时，下面哪一句最像这张牌的主要提醒？`,
      options: buildOptions(correctMeaning, meaningDistractors),
      correctAnswer: correctMeaning,
      explanation: `这张牌在${orientation === 'upright' ? '正位' : '逆位'}里要先读出：${correctMeaning}。`,
    },
    {
      id: 'method',
      label: '读牌方法',
      prompt: '真正读这张牌时，最稳的顺序是什么？',
      options: shuffle([
        '先说牌面证据，再进入关键词和情境判断',
        '先判断好坏，再找一句能支持结论的话',
        '只背关键词，不需要看画面细节',
        '只看自己第一感觉，不需要校正',
      ]),
      correctAnswer: '先说牌面证据，再进入关键词和情境判断',
      explanation: '塔罗学习要把直觉和证据连起来。先看见，再解释，最后放进问题里判断。',
    },
  ];
}

function buildTeachingPrompt(
  card: TarotCard,
  orientation: Orientation,
  firstObservation: string,
  symbolObservation: string
) {
  return [
    `学员正在学习 ${card.chineseName}${orientation === 'upright' ? '正位' : '逆位'}。`,
    `学员第一观察：${firstObservation}`,
    `学员牌面细节观察：${symbolObservation}`,
    '请你作为导师，按照这个顺序带学：',
    '1. 先回应学员观察中准确的地方。',
    '2. 指出一个需要校正或补充的地方，但语气要温和。',
    '3. 用牌面证据讲清核心关键词，不要只给结论。',
    `4. 专门解释${orientation === 'upright' ? '正位' : '逆位'}时该怎么读。`,
    '5. 给一个常见误区和一个记忆钩子。',
    '6. 最后用一句话引导学员进入情境练习。',
    '请自然分段，不要使用星号。',
  ].join('\n');
}

function buildScenarioFeedbackPrompt(
  card: TarotCard,
  orientation: Orientation,
  scenario: ScenarioPrompt,
  scenarioAnswer: string
) {
  return [
    `学员正在学习 ${card.chineseName}${orientation === 'upright' ? '正位' : '逆位'}，刚完成情境练习。`,
    `练习场景：${scenario.situation}`,
    `练习问题：${scenario.question}`,
    `学员回答：${scenarioAnswer}`,
    '请你像导师批改作业一样反馈：',
    '1. 先指出回答里已经抓到的点。',
    '2. 再指出遗漏或偏差。',
    '3. 给出一版更标准、更完整的解读示范。',
    '4. 最后告诉学员接下来要完成掌握测试。',
    '请自然分段，不要使用星号。',
  ].join('\n');
}

function buildMasteryMessage(card: TarotCard, orientation: Orientation, recap: string) {
  const meaning = orientation === 'upright' ? card.uprightMeaning : card.reversedMeaning;
  const anchor = normalizeMeaning(meaning) || card.keywords[0] || card.chineseName;

  return [
    '这一轮通过了。',
    `你已经完成了 ${card.chineseName} 的观察、符号提取、标准牌义、情境应用和掌握测试。`,
    `这张牌下次再出现时，先记住这个锚点：${anchor}。`,
    `你的复述是：“${recap}”`,
    '这张牌会进入复习队列，下一次我们会用更快的问答来巩固它。',
  ].join('\n\n');
}

function getNextReviewDays(reviewCount: number) {
  if (reviewCount <= 0) return 1;
  if (reviewCount === 1) return 3;
  if (reviewCount === 2) return 7;
  if (reviewCount === 3) return 14;
  return 30;
}

export default function LearnPage() {
  const { cardId } = useParams<{ cardId?: string }>();
  const navigate = useNavigate();

  const currentSession = useAppStore((state) => state.currentSession);
  const startSession = useAppStore((state) => state.startSession);
  const updateCurrentSession = useAppStore((state) => state.updateCurrentSession);
  const completeCard = useAppStore((state) => state.completeCard);
  const setStudyJournal = useAppStore((state) => state.setStudyJournal);
  const upsertStudyRecord = useAppStore((state) => state.upsertStudyRecord);
  const studyJournal = useAppStore((state) => state.studyJournal);
  const cardDeck = useAppStore((state) => state.cardDeck);
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

  const activeSession = currentSession?.cardId === card.id ? currentSession : null;
  const activeRecord = studyJournal.records[String(card.id)];
  const initialStage = (activeSession?.lessonStage || activeRecord?.stage || 'observe') as StudyStage;
  const initialOrientation: Orientation =
    activeSession?.orientation || activeRecord?.orientation || studyJournal.activeOrientation || 'upright';

  const [stage, setStage] = useState<StudyStage>(initialStage);
  const [orientation, setOrientation] = useState<Orientation>(initialOrientation);
  const [reflection, setReflection] = useState(activeSession?.reflection || activeRecord?.reflection || '');
  const [symbolObservation, setSymbolObservation] = useState(
    activeSession?.symbolObservation || activeRecord?.symbolObservation || studyJournal.activeSymbolObservation || ''
  );
  const [scenarioAnswer, setScenarioAnswer] = useState(
    activeSession?.scenarioAnswer || activeRecord?.scenarioAnswer || studyJournal.activeScenarioAnswer || ''
  );
  const [followUp, setFollowUp] = useState(activeSession?.followUp || activeRecord?.followUp || '');
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswerMap>(
    activeSession?.quizAnswers || activeRecord?.quizAnswers || studyJournal.activeQuizAnswers || {}
  );
  const [quizResult, setQuizResult] = useState<'correct' | 'incorrect' | null>(
    activeSession?.quizResult || activeRecord?.quizResult || null
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(
    activeSession?.messages?.length ? activeSession.messages : [buildOpeningMessage(card, mentor.chineseName, initialOrientation)]
  );

  const chatEndRef = useRef<HTMLDivElement>(null);
  const messageCounter = useRef(0);

  const scenario = useMemo(() => buildScenario(card, orientation), [card, orientation]);
  const quizQuestions = useMemo(() => buildChoiceQuiz(card, orientation), [card, orientation]);
  const currentMeaning = orientation === 'upright' ? card.uprightMeaning : card.reversedMeaning;
  const dueReviewCount = Object.values(studyJournal.records).filter((record) => {
    if (!record.nextReviewAt) return false;
    return new Date(record.nextReviewAt).getTime() <= Date.now();
  }).length;
  const answeredChoiceCount = quizQuestions.filter((question) => quizAnswers[question.id]).length;
  const correctChoiceCount = quizQuestions.filter((question) => quizAnswers[question.id] === question.correctAnswer).length;
  const choiceQuizPassed = correctChoiceCount === quizQuestions.length;
  const awaitingRecap = stage === 'quiz' && choiceQuizPassed && !quizAnswers.recap;
  const progressIndex = Math.max(stageOrder.indexOf(stage), 0);

  useEffect(() => {
    if (!currentSession || currentSession.cardId !== card.id) {
      startSession(card.id, mentor.id);
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id, mentor.id]);

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
    quizResult?: 'correct' | 'incorrect' | null;
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
      const stream = streamCardLearningResponse(card, orientation, prompt, baseMessages.slice(-8), mentor.id);

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
    if (isStreaming || stage === 'mastered') return;

    const nextAnswers = { ...quizAnswers, [question.id]: answer };
    const isCorrect = answer === question.correctAnswer;
    const answeredQuestions = quizQuestions.filter((item) => nextAnswers[item.id]);
    const passedQuestions = quizQuestions.filter((item) => nextAnswers[item.id] === item.correctAnswer);
    const allChoicesCorrect = passedQuestions.length === quizQuestions.length;

    const userMessage = createMessage('user', `${question.label}：${answer}`, 'application');
    const feedbackMessage = createMessage(
      'assistant',
      isCorrect
        ? `这题对了。${question.explanation}`
        : `这题还需要调整。\n\n导师提示：${question.explanation}\n\n你可以直接重新选择这一题。`,
      'application'
    );
    const nextMessages = [...chatMessages, userMessage, feedbackMessage];

    if (allChoicesCorrect && !choiceQuizPassed && !quizAnswers.recap) {
      nextMessages.push(
        createMessage(
          'assistant',
          '三道选择题都通过了。最后一步，用你自己的话复述这张牌：它在牌面上让你看见什么？在解读里通常提醒什么？',
          'application'
        )
      );
    }

    setQuizAnswers(nextAnswers);
    setQuizResult(allChoicesCorrect ? 'correct' : answeredQuestions.length === quizQuestions.length ? 'incorrect' : null);
    commitMessages(nextMessages, {
      lessonStage: 'quiz',
      quizAnswers: nextAnswers,
      quizAnswer: answer,
      quizResult: allChoicesCorrect ? 'correct' : answeredQuestions.length === quizQuestions.length ? 'incorrect' : null,
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
            <motion.div
              className="card-visual"
              animate={{ rotate: orientation === 'reversed' ? 180 : 0 }}
              transition={{ duration: 0.4 }}
            >
              <img src={getCardImagePath(card.id, cardDeck)} alt={card.chineseName} className="card-image" />
            </motion.div>

            <div className="card-study-info">
              <div className="study-kicker">牌面常驻 · 导师陪练</div>
              <h2>{card.chineseName}</h2>
              <p>{card.name}</p>

              <div className="stage-track" aria-label="学习阶段">
                {stageOrder.map((item, index) => (
                  <span
                    key={item}
                    className={`stage-dot ${stage === item ? 'active' : ''} ${index < progressIndex ? 'done' : ''}`}
                    title={stageLabels[item]}
                  />
                ))}
              </div>

              <div className="study-meta">
                <span>{stageLabels[stage]}</span>
                <span>待复习 {dueReviewCount}</span>
                <span>本地已保存</span>
              </div>

              <div className="orientation-row">
                <button
                  className={`orient-btn ${orientation === 'upright' ? 'active' : ''}`}
                  onClick={() => handleOrientationChange('upright')}
                  disabled={isStreaming}
                >
                  正位
                </button>
                <button
                  className="flip-btn"
                  onClick={() => handleOrientationChange(orientation === 'upright' ? 'reversed' : 'upright')}
                  disabled={isStreaming}
                  aria-label="翻转牌面"
                >
                  <RotateCcw size={14} />
                </button>
                <button
                  className={`orient-btn ${orientation === 'reversed' ? 'active' : ''}`}
                  onClick={() => handleOrientationChange('reversed')}
                  disabled={isStreaming}
                >
                  逆位
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="chat-shell">
          <div className="mentor-header">
            <div className="mentor-avatar">
              {mentor.avatarImage ? <img src={mentor.avatarImage} alt={mentor.chineseName} /> : <Sparkles size={18} />}
            </div>
            <div>
              <div className="mentor-name">{mentor.chineseName}</div>
              <div className="mentor-status">导师会按观察、证据、应用、测试来带你学会</div>
            </div>
          </div>

          <div className="chat-messages">
            <AnimatePresence initial={false}>
              {chatMessages.map((message) => (
                <motion.div
                  key={message.id}
                  className={`chat-bubble ${message.role}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  {message.role === 'user' ? <p>{message.content}</p> : <AiResponse text={message.content} />}
                </motion.div>
              ))}
            </AnimatePresence>

            {(stage === 'quiz' || stage === 'mastered') && (
              <div className="chat-bubble assistant challenge-bubble">
                <div className="challenge-head">
                  <WandSparkles size={16} />
                  <span>导师掌握测试</span>
                </div>

                <div className="quiz-progress">
                  <span>
                    选择题 {correctChoiceCount}/{quizQuestions.length}
                  </span>
                  <span>{choiceQuizPassed ? '等待复述' : answeredChoiceCount === quizQuestions.length ? '需要修正' : '进行中'}</span>
                </div>

                {quizQuestions.map((question) => {
                  const answer = quizAnswers[question.id];

                  return (
                    <div className="quiz-question" key={question.id}>
                      <div className="quiz-label">{question.label}</div>
                      <p>{question.prompt}</p>
                      <div className="quiz-options">
                        {question.options.map((option) => {
                          const isSelected = answer === option;
                          const isCorrect = option === question.correctAnswer;
                          const stateClass =
                            isSelected && isCorrect
                              ? 'correct'
                              : isSelected
                                ? 'wrong'
                                : answer && isCorrect
                                  ? 'revealed'
                                  : '';

                          return (
                            <button
                              key={option}
                              className={`quiz-option ${stateClass}`}
                              onClick={() => handleQuizChoice(question, option)}
                              disabled={isStreaming || stage === 'mastered'}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {choiceQuizPassed && stage !== 'mastered' && (
                  <div className="recap-callout">
                    <BookOpen size={15} />
                    <span>选择题已通过。现在在输入框里用自己的话完成一句话复述。</span>
                  </div>
                )}

                {stage === 'mastered' && (
                  <div className="recap-callout success">
                    <CircleCheckBig size={15} />
                    <span>这张牌已进入复习队列。</span>
                  </div>
                )}
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          <div className="chat-composer">
            <MessageCircle size={16} className="composer-icon" />
            <textarea
              value={composerValue}
              onChange={(event) => setComposerValue(event.target.value)}
              placeholder={composerPlaceholder}
              rows={2}
              disabled={composerDisabled}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  handleComposerSend();
                }
              }}
            />
            <button className="send-btn" onClick={handleComposerSend} disabled={sendDisabled} aria-label="发送">
              <Send size={18} />
            </button>
          </div>

          {stage === 'mastered' && (
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
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
