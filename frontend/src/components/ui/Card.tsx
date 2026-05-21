import { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export default function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={`rounded-3xl border border-stone-200/60 dark:border-stone-700/60 bg-white dark:bg-stone-800 p-5 shadow-card dark:shadow-dark-card ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
