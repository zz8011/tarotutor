import { BookOpen, CircleCheckBig, WandSparkles } from 'lucide-react';
import type { QuizAnswerMap, QuizOutcome } from '../../types';
import type { ChoiceQuestion } from '../../services/learning/lessonContent';

export type { ChoiceQuestion };

export interface QuizPanelProps {
  questions: ChoiceQuestion[];
  answers: QuizAnswerMap;
  quizResult: QuizOutcome;
  choiceQuizPassed: boolean;
  allChoicesAnswered: boolean;
  correctChoiceCount: number;
  stage: string;
  isStreaming: boolean;
  onChoice: (question: ChoiceQuestion, answer: string) => void;
  onSubmit: () => void;
}

export default function QuizPanel({
  questions,
  answers,
  quizResult,
  choiceQuizPassed,
  allChoicesAnswered,
  correctChoiceCount,
  stage,
  isStreaming,
  onChoice,
  onSubmit,
}: QuizPanelProps) {
  return (
    <div className="chat-bubble assistant challenge-bubble">
      <div className="challenge-head">
        <WandSparkles size={16} />
        <span>导师掌握测试</span>
      </div>

      <div className="quiz-progress">
        <span>
          选择题 {correctChoiceCount}/{questions.length}
        </span>
        <span>
          {quizResult === 'correct'
            ? '合格'
            : quizResult === 'incorrect'
              ? '需重学'
              : allChoicesAnswered
                ? '待点评'
                : '进行中'}
        </span>
      </div>

      {questions.map((question) => {
        const answer = answers[question.id];

        return (
          <div className="quiz-question" key={question.id}>
            <div className="quiz-label">{question.label}</div>
            <p>{question.prompt}</p>
            <div className="quiz-options">
              {question.options.map((option) => {
                const isSelected = answer === option;
                const isCorrect = option === question.correctAnswer;
                const stateClass =
                  choiceQuizPassed && isSelected && isCorrect
                    ? 'correct'
                    : quizResult === 'incorrect' && isSelected && !isCorrect
                      ? 'wrong'
                      : quizResult === 'incorrect' && isCorrect
                        ? 'revealed'
                        : isSelected
                          ? 'selected'
                          : '';

                return (
                  <button
                    key={option}
                    className={`quiz-option ${stateClass}`}
                    onClick={() => onChoice(question, option)}
                    disabled={isStreaming || stage === 'mastered' || choiceQuizPassed}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {allChoicesAnswered && !choiceQuizPassed && (
        <button className="quiz-submit-btn" onClick={onSubmit} disabled={isStreaming}>
          {quizResult === 'incorrect' ? '重新提交导师点评' : '提交给导师点评'}
        </button>
      )}

      {quizResult === 'incorrect' && (
        <div className="recap-callout retry">
          <BookOpen size={15} />
          <span>导师已指出不合格点。请重选薄弱题目，再提交点评。</span>
        </div>
      )}

      {choiceQuizPassed && stage !== 'mastered' && (
        <div className="recap-callout">
          <BookOpen size={15} />
          <span>导师点评合格。现在在输入框里用自己的话完成一句话复述。</span>
        </div>
      )}

      {stage === 'mastered' && (
        <div className="recap-callout success">
          <CircleCheckBig size={15} />
          <span>这张牌已进入复习队列。</span>
        </div>
      )}
    </div>
  );
}
