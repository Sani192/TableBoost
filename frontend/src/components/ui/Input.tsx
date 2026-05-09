import { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
  leading?: ReactNode;
}

export default function Input({
  label,
  helperText,
  leading,
  id,
  className = '',
  ...props
}: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-sm font-bold text-slate-800">
        {label}
      </label>
      <div className="relative">
        {leading && (
          <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-lg font-bold text-slate-400">
            {leading}
          </div>
        )}
        <input
          id={inputId}
          className={`block min-h-[58px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-lg font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100 ${
            leading ? 'pl-9' : ''
          } ${className}`}
          {...props}
        />
      </div>
      {helperText && <p className="text-xs font-medium text-slate-500">{helperText}</p>}
    </div>
  );
}
