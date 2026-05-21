'use client';
import { useEffect, useRef, ReactNode } from 'react';
import { X } from 'lucide-react';

type DrawerSize = 'narrow' | 'default' | 'wide';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: DrawerSize;
}

const sizeClasses: Record<DrawerSize, string> = {
  narrow: 'max-w-sm',
  default: 'max-w-md',
  wide: 'max-w-lg',
};

export default function Drawer({ isOpen, onClose, title, subtitle, children, footer, size = 'default' }: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      // Focus the close button when drawer opens for a11y
      setTimeout(() => closeButtonRef.current?.focus(), 100);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-stone-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose}
      />
      
      {/* Drawer Content */}
      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div 
          ref={drawerRef}
          className={`relative w-screen ${sizeClasses[size]} bg-white dark:bg-stone-900 shadow-2xl dark:shadow-dark-card flex flex-col animate-in slide-in-from-right duration-300`}
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="px-6 py-5 flex items-center justify-between border-b border-stone-100 dark:border-stone-800">
            <div>
              <h3 className="text-lg font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">{title}</h3>
              {subtitle && <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mt-0.5">{subtitle}</p>}
            </div>
            <button 
              ref={closeButtonRef}
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all"
              aria-label="Close drawer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Body */}
          <div className="flex-1 px-6 py-6 text-stone-600 dark:text-stone-300 font-medium overflow-y-auto">
            {children}
          </div>
          
          {/* Footer */}
          {footer && (
            <div className="px-6 py-4 bg-stone-50 dark:bg-stone-800/50 flex items-center justify-end gap-3 border-t border-stone-100 dark:border-stone-800">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
