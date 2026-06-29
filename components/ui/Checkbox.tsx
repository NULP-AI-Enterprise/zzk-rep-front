'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ label, checked, onChange, className }) => {
  return (
    <label className={cn("flex items-center gap-3 cursor-pointer group", className)}>
      <div 
        onClick={() => onChange(!checked)}
        className={cn(
          "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
          checked 
            ? "bg-brand border-brand" 
            : "bg-white border-gray-300 group-hover:border-brand"
        )}
      >
        {checked && <Check size={14} className="text-white stroke-[4]" />}
      </div>
      <span className={cn("text-sm transition-colors", checked ? "text-brand font-medium" : "text-gray-600")}>
        {label}
      </span>
    </label>
  );
};
