import { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-600 text-white shadow-lift hover:bg-brand-700 active:scale-[0.98] disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none',
  secondary:
    'border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 active:scale-[0.98] disabled:bg-slate-100 disabled:text-slate-400',
  ghost:
    'bg-transparent text-slate-600 hover:bg-slate-100 active:bg-slate-200 disabled:text-slate-400',
};

export default function Button({
  children,
  variant = 'primary',
  fullWidth = false,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-[52px] items-center justify-center rounded-2xl px-5 py-3 text-base font-extrabold tracking-tight transition-all focus:outline-none focus:ring-4 focus:ring-brand-200 disabled:cursor-not-allowed ${
        fullWidth ? 'w-full' : ''
      } ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
