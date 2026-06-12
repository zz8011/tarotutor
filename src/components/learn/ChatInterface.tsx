import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import AiResponse from '../AiResponse';
import ReflectionInput from './ReflectionInput';
import type { ChatMessage } from '../../types';

export interface ChatInterfaceProps {
  messages: ChatMessage[];
  mentorName: string;
  mentorAvatar?: string;
  composerValue: string;
  composerPlaceholder: string;
  composerDisabled?: boolean;
  sendDisabled?: boolean;
  /** 渲染在消息流之后（如测验面板、滚动锚点） */
  children?: ReactNode;
  /** 渲染在输入框之后（如掌握后的操作按钮） */
  footer?: ReactNode;
  onComposerChange: (value: string) => void;
  onSend: () => void;
}

export default function ChatInterface({
  messages,
  mentorName,
  mentorAvatar,
  composerValue,
  composerPlaceholder,
  composerDisabled = false,
  sendDisabled = false,
  children,
  footer,
  onComposerChange,
  onSend,
}: ChatInterfaceProps) {
  return (
    <section className="chat-shell">
      <div className="mentor-header">
        <div className="mentor-avatar">
          {mentorAvatar ? <img src={mentorAvatar} alt={mentorName} /> : <Sparkles size={18} />}
        </div>
        <div>
          <div className="mentor-name">{mentorName}</div>
          <div className="mentor-status">导师会按观察、证据、应用、测试来带你学会</div>
        </div>
      </div>

      <div className="chat-messages">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
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
        {children}
      </div>

      <ReflectionInput
        value={composerValue}
        placeholder={composerPlaceholder}
        disabled={composerDisabled}
        sendDisabled={sendDisabled}
        onChange={onComposerChange}
        onSend={onSend}
      />

      {footer}
    </section>
  );
}
