// ============================================================
// 学习流程内容构建器（纯函数层）
// 从 LearnPage 抽离：负责生成开场白、情境练习、测验题、
// 导师 prompt 与复习调度等与 UI 无关的领域逻辑，便于单测与复用。
// ============================================================

import { tarotCards } from '../../data/tarotCards';
import type {
  ChatMessage,
  LearningPhase,
  Orientation,
  QuizAnswerMap,
  StudyJournal,
  StudyStage,
  TarotCard,
} from '../../types';

export interface ChoiceQuestion {
  id: string;
  label: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface ScenarioPrompt {
  topic: string;
  situation: string;
  question: string;
}

export const stageOrder: StudyStage[] = ['observe', 'symbols', 'teach', 'scenario', 'quiz', 'mastered'];

export const stageLabels: Record<StudyStage, string> = {
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

export function stageToPhase(stage: StudyStage): LearningPhase {
  if (stage === 'mastered') return 'mastery';
  if (stage === 'scenario' || stage === 'quiz') return 'application';
  if (stage === 'teach') return 'understanding';
  return 'perception';
}

export function buildOpeningMessage(card: TarotCard, mentorName: string, orientation: Orientation): ChatMessage {
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

export function buildSymbolPrompt(card: TarotCard): string {
  return [
    '很好，我们进入第二步：只看牌面证据。',
    `请从 ${card.chineseName} 的人物、姿态、背景、光线、道具里挑一个最有信息量的细节。`,
    '告诉我：你看见了什么？你为什么觉得它重要？它支持了你刚才的直觉，还是和你的直觉有冲突？',
  ].join('\n\n');
}

export function buildScenario(card: TarotCard, orientation: Orientation): ScenarioPrompt {
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

export function buildChoiceQuiz(card: TarotCard, orientation: Orientation): ChoiceQuestion[] {
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

function sanitizeUserInput(input: string): string {
  // 移除潜在的 prompt 注入标记
  return input
    .replace(/\[\/system\]/gi, '')
    .replace(/\[system\]/gi, '')
    .replace(/ignore previous instructions/gi, '[已过滤]')
    .replace(/ignore all previous/gi, '[已过滤]')
    .replace(/you are now/gi, '[已过滤]')
    .slice(0, 500); // 限制长度
}

export function buildTeachingPrompt(
  card: TarotCard,
  orientation: Orientation,
  firstObservation: string,
  symbolObservation: string
) {
  const safeFirst = sanitizeUserInput(firstObservation);
  const safeSymbol = sanitizeUserInput(symbolObservation);
  return [
    `学员正在学习 ${card.chineseName}${orientation === 'upright' ? '正位' : '逆位'}。`,
    `学员第一观察：${safeFirst}`,
    `学员牌面细节观察：${safeSymbol}`,
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

export function buildScenarioFeedbackPrompt(
  card: TarotCard,
  orientation: Orientation,
  scenario: ScenarioPrompt,
  scenarioAnswer: string
) {
  const safeAnswer = sanitizeUserInput(scenarioAnswer);
  return [
    `学员正在学习 ${card.chineseName}${orientation === 'upright' ? '正位' : '逆位'}，刚完成情境练习。`,
    `练习场景：${scenario.situation}`,
    `练习问题：${scenario.question}`,
    `学员回答：${safeAnswer}`,
    '请你像导师批改作业一样反馈：',
    '1. 先指出回答里已经抓到的点。',
    '2. 再指出遗漏或偏差。',
    '3. 给出一版更标准、更完整的解读示范。',
    '4. 最后告诉学员接下来要完成掌握测试。',
    '请自然分段，不要使用星号。',
  ].join('\n');
}

export function buildMasteryMessage(card: TarotCard, orientation: Orientation, recap: string) {
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

export function buildQuizSubmissionMessage(quizQuestions: ChoiceQuestion[], answers: QuizAnswerMap) {
  return [
    '我完成了掌握测试，请导师点评。',
    ...quizQuestions.map((question) => `${question.label}：${answers[question.id] || '未作答'}`),
  ].join('\n');
}

export function buildQuizReviewMessage(quizQuestions: ChoiceQuestion[], answers: QuizAnswerMap) {
  const failedQuestions = quizQuestions.filter((question) => answers[question.id] !== question.correctAnswer);

  if (!failedQuestions.length) {
    return [
      '合格，可以进入下一步。',
      '这组三题说明你已经抓住了核心关键词、正逆位方向和读牌方法。现在不要急着学下一张，最后用你自己的话复述一遍，让这张牌真正变成你的理解。',
      '复述时请包含两个部分：一个牌面细节，一个解读提醒。',
    ].join('\n\n');
  }

  return [
    '这次还不算合格，我们先把不稳的地方补回来。',
    ...failedQuestions.map(
      (question) =>
        `不合格点：${question.label}\n你的答案：${answers[question.id] || '未作答'}\n需要重学：${question.explanation}`
    ),
    '我已经把正确选项露出来。请回到这些题，重新选择。通过后我们再进入复述。真正学会不是一次答对，而是能把偏掉的地方拉回来。',
  ].join('\n\n');
}

/** 间隔重复：根据已复习次数返回下次复习间隔（天） */
export function getNextReviewDays(reviewCount: number) {
  if (reviewCount <= 0) return 1;
  if (reviewCount === 1) return 3;
  if (reviewCount === 2) return 7;
  if (reviewCount === 3) return 14;
  return 30;
}

/**
 * 统计到期待复习的卡牌数量。
 * now 参数默认取当前时间；封装在函数内以保持组件渲染层纯净。
 */
export function countDueReviews(records: StudyJournal['records'], now: number = Date.now()) {
  return Object.values(records).filter((record) => {
    if (!record.nextReviewAt) return false;
    return new Date(record.nextReviewAt).getTime() <= now;
  }).length;
}
