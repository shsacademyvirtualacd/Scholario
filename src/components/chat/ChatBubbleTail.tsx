import React from 'react';

interface ChatBubbleTailProps {
  isMe: boolean;
  className?: string;
}

export const ChatBubbleTail: React.FC<ChatBubbleTailProps> = ({ isMe, className = '' }) => {
  if (isMe) {
    // WhatsApp-style sent message tail on the bottom-right corner
    return (
      <span
        className={`absolute -right-[7px] bottom-0 w-[8px] h-[13px] pointer-events-none z-1 overflow-hidden select-none ${className}`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 8 13" width="8" height="13" className="fill-[#111111] overflow-visible">
          <path d="M0 0C0 4 2 11 8 13H0V0Z" />
        </svg>
      </span>
    );
  }

  // WhatsApp-style received message tail on the bottom-left corner
  return (
    <span
      className={`absolute -left-[7px] -bottom-[1px] w-[8px] h-[14px] pointer-events-none z-1 overflow-hidden select-none ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 8 14" width="8" height="14" fill="none" className="overflow-visible">
        <path d="M8 0C8 4.5 6 12 0 14H8V0Z" fill="#FFFFFF" />
        <path d="M8 0C8 4.5 6 12 0 14H8" stroke="#E5E5E5" strokeWidth="1" />
      </svg>
    </span>
  );
};
