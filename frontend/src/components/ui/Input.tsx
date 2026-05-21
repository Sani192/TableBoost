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
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-semibold text-stone-700 dark:text-stone-300">
        {label}
        {props.required && <span className="ml-1 text-brand-600" aria-hidden="true">*</span>}
      </label>
      <div className="relative">
        {leading && (
          <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-base font-semibold text-stone-400 dark:text-stone-500">
            {leading}
          </div>
        )}
        <input
          id={inputId}
          className={`block min-h-[56px] w-full rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-4 py-3.5 text-lg font-semibold text-stone-900 dark:text-stone-100 outline-none transition-all duration-150 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 ${
            leading ? 'pl-9' : ''
          } ${className}`}
          {...props}
        />
      </div>
      {helperText && <p className="text-xs font-medium text-stone-500 dark:text-stone-400">{helperText}</p>}
    </div>
  );
}
