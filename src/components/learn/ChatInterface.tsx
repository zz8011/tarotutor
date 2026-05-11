import { useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, Send, Sparkles } from 'lucide-react';
import AiResponse from '../AiResponse';
import type { ChatMessage, StudyStage } from '../../types';

export interface ChatInterfaceProps {
  messages: ChatMessage[];
  stage: StudyStage;
  isStreaming: boolean;
  awaitingRecap: boolean;
  composerValue: string;
  composerPlaceholder: string;
  composerDisabled: boolean;
  sendDisabled: boolean;
  mentorName: string;
  mentorAvatar?: string;
  onComposerChange: (value: string) => void;
  onSend: () => void;
}

export default function ChatInterface({
  messages,
  composerValue,
  composerPlaceholder,
  composerDisabled,
  sendDisabled,
  mentorName,
  mentorAvatar,
  onComposerChange,
  onSend,
}: ChatInterfaceProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);

  return (
    <div className="chat-shell">
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
        <div ref={chatEndRef} />
      </div>

      <div className="chat-composer">
        <MessageCircle size={16} className="composer-icon" />
        <textarea
          value={composerValue}
          onChange={(e) => onComposerChange(e.target.value)}
          placeholder={composerPlaceholder}
          rows={2}
          disabled={composerDisabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
        />
        <button className="send-btn" onClick={onSend} disabled={sendDisabled} aria-label="发送">
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
