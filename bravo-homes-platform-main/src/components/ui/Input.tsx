import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', style, ...props }, ref) => {
    const isDateOrTime = type === 'date' || type === 'time';
    return (
      <input
        type={type}
        className={cn(
          'flex w-full bg-bg-3 border border-border rounded-[6px] px-3 py-[9px] text-[0.82rem] font-sans text-text outline-none transition-colors placeholder:text-t-3 focus:border-gold disabled:opacity-50',
          className
        )}
        style={isDateOrTime ? { paddingRight: '36px', cursor: 'pointer', ...style } : style}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
