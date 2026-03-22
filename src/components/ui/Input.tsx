import { type InputHTMLAttributes } from 'react';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label?: string;
  error?: string;
  className?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-[#8E8E93]">{label}</label>
      )}
      <input
        className={`
          w-full bg-[#2C2C2E] text-white rounded-xl
          border ${error ? 'border-[#FF453A]' : 'border-[#3C3C3E]'}
          px-4 py-2.5 text-sm
          placeholder:text-[#636366]
          outline-none
          hover:bg-[#3C3C3E] transition-colors
          focus:ring-1 focus:ring-[#7BFF00]/40 focus:border-[#7BFF00]/40
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        {...props}
      />
      {error && <p className="text-xs text-[#FF453A]">{error}</p>}
    </div>
  );
}

interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  label?: string;
  error?: string;
  className?: string;
}

export function Textarea({ label, error, className = '', ...props }: TextareaProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-[#8E8E93]">{label}</label>
      )}
      <textarea
        className={`
          w-full bg-[#2C2C2E] text-white rounded-xl
          border ${error ? 'border-[#FF453A]' : 'border-[#3C3C3E]'}
          px-4 py-2.5 text-sm
          placeholder:text-[#636366]
          outline-none resize-none
          hover:bg-[#3C3C3E] transition-colors
          focus:ring-1 focus:ring-[#7BFF00]/40 focus:border-[#7BFF00]/40
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        rows={3}
        {...props}
      />
      {error && <p className="text-xs text-[#FF453A]">{error}</p>}
    </div>
  );
}
