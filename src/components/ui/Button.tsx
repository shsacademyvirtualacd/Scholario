import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  isLoading,
  disabled,
  children,
  className = '',
  ...props
}) => {
  return (
    <button
      disabled={disabled || isLoading}
      className={`relative inline-flex items-center justify-center gap-1.5 transition-all ${className}`}
      {...props}
    >
      {isLoading && (
        <Loader2 size={14} className="animate-spin shrink-0" />
      )}
      {children}
    </button>
  );
};

export default Button;
