export { default as CardDisplay } from './CardDisplay';
export type { CardDisplayProps } from './CardDisplay';

export { default as ChatInterface } from './ChatInterface';
export type { ChatInterfaceProps } from './ChatInterface';

export { default as StageProgress } from './StageProgress';
export type { StageProgressProps } from './StageProgress';

export { default as QuizPanel } from './QuizPanel';
export type { QuizPanelProps, ChoiceQuestion } from './QuizPanel';

export { default as ReflectionInput } from './ReflectionInput';
export type { ReflectionInputProps } from './ReflectionInput';

// Orientation 现统一定义在 src/types，这里转发以兼容旧导入
export type { Orientation } from '../../types';
