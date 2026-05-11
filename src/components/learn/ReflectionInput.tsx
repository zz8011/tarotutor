import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, Send } from 'lucide-react';

export interface ReflectionInputProps {
  value: string;
  placeholder: string;
  disabled?: boolean;
  sendDisabled?: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
}

export default function ReflectionInput({
  value,
  placeholder,
  disabled = false,
  sendDisabled = false,
  onChange,
  onSend,
}: ReflectionInputProps) {
  return (
    <div className="chat-composer">
      <MessageCircle size={16} className="composer-icon" />
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        disabled={disabled}
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
  );
}
