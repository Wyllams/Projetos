import React from 'react';
import { cn } from '../../lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          'flex w-full bg-bg-3 border border-border rounded-[6px] px-3 py-[9px] text-[0.82rem] font-sans text-text outline-none transition-colors focus:border-gold disabled:opacity-50 appearance-none',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';
