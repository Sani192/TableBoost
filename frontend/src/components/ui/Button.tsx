import { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-600 text-white shadow-lift hover:bg-brand-700 hover:shadow-lg active:scale-[0.97] disabled:bg-stone-300 disabled:text-stone-500 disabled:shadow-none disabled:cursor-not-allowed',
  secondary:
    'border border-stone-200 bg-white text-stone-700 shadow-soft hover:bg-stone-50 active:scale-[0.97] disabled:bg-stone-100 disabled:text-stone-400 disabled:cursor-not-allowed',
  ghost:
    'bg-transparent text-stone-600 hover:bg-stone-100 active:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed',
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
      className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl px-5 py-3 text-[0.938rem] font-bold tracking-tight transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:ring-offset-2 ${
        fullWidth ? 'w-full' : ''
      } ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
