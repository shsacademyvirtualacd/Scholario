import React from 'react';

interface ChatBubbleTailProps {
  isMe: boolean;
  className?: string;
  fillColor?: string;
}

/**
 * WhatsApp-style distinct, sharp triangular corner flick tail.
 * Sent messages: attaches to bottom-right corner, flicking outward.
 * Received messages: attaches to bottom-left corner with subtle border stroke.
 */
export const ChatBubbleTail: React.FC<ChatBubbleTailProps> = ({
  isMe,
  className = '',
  fillColor,
}) => {
  if (isMe) {
    const fill = fillColor || '#11161D';
    return (
      <span
        className={`absolute -right-[11px] -bottom-[0.5px] w-[12px] h-[19px] pointer-events-none z-10 select-none overflow-visible ${className}`}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 12 19"
          width="12"
          height="19"
          className="overflow-visible"
          style={{ fill }}
        >
          {/* Distinct, sharper triangular flick pointing outward */}
          <path d="M 0 0 C 0.5 4, 3 11, 11.5 17.5 C 7.5 18.2, 2.5 18.8, 0 19 Z" />
        </svg>
      </span>
    );
  }

  // WhatsApp-style received message tail on bottom-left corner
  return (
    <span
      className={`absolute -left-[11px] -bottom-[0.5px] w-[12px] h-[19px] pointer-events-none z-10 select-none overflow-visible ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 12 19"
        width="12"
        height="19"
        fill="none"
        className="overflow-visible"
      >
        <path
          d="M 12 0 C 11.5 4, 9 11, 0.5 17.5 C 4.5 18.2, 9.5 18.8, 12 19 Z"
          fill="#FFFFFF"
        />
        <path
          d="M 12 0 C 11.5 4, 9 11, 0.5 17.5 C 4.5 18.2, 9.5 18.8, 12 19"
          stroke="#E5E5E5"
          strokeWidth="1"
        />
      </svg>
    </span>
  );
};

