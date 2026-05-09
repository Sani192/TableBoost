import { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export default function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={`rounded-[1.75rem] border border-white/80 bg-white/90 p-5 shadow-soft backdrop-blur ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
