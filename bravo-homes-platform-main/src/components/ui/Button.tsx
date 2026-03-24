import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'gold' | 'ghost' | 'danger';
  size?: 'default' | 'sm' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    
    const variants = {
      default: 'bg-bg-3 text-t-2 border border-border hover:bg-bg-4 hover:text-text',
      gold: 'bg-gold text-bg hover:bg-gold-2 border-transparent',
      ghost: 'bg-transparent text-t-2 border border-border hover:text-text hover:bg-bg-3',
      danger: 'bg-transparent text-danger border border-danger/30 hover:bg-danger/10',
    };

    const sizes = {
      default: 'px-4 py-2 text-[0.8rem]',
      sm: 'px-3 py-1.5 text-[0.72rem]',
      lg: 'px-6 py-3 text-[0.9rem]',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-sans font-semibold rounded-[6px] transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
