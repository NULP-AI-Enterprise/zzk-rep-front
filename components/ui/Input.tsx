'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 w-full group">
        <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide group-focus-within:text-brand transition-colors">
          {label}
        </label>
        <input
          ref={ref}
          className={cn(
            'border-b border-gray-300 bg-transparent py-1.5 outline-none focus:border-brand transition-all text-black text-[15px] placeholder:text-gray-300',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';
