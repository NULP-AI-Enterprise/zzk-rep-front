'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { label: string; value: string | number }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 w-full group">
        <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide group-focus-within:text-brand transition-colors">
          {label}
        </label>
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              'w-full border-b border-gray-300 bg-transparent py-1.5 outline-none focus:border-brand transition-all text-black text-[15px] appearance-none cursor-pointer',
              className
            )}
            {...props}
          >
            <option value="" disabled>
              Оберіть значення
            </option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <ChevronDown size={14} strokeWidth={2.5} />
          </div>
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';
