import { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export default function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={`rounded-3xl border border-stone-200/60 bg-white p-5 shadow-card ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
