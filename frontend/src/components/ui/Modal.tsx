'use client';
import { useEffect, useRef, ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-stone-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div 
        ref={modalRef}
        className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl shadow-2xl dark:shadow-dark-card overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        role="dialog"
        aria-modal="true"
      >
        <div className="px-6 py-5 flex items-center justify-between border-b border-stone-100 dark:border-stone-800">
          <h3 className="text-lg font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">{title}</h3>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="px-6 py-6 text-stone-600 dark:text-stone-300 font-medium">
          {children}
        </div>
        
        {footer && (
          <div className="px-6 py-4 bg-stone-50 dark:bg-stone-800/50 flex items-center justify-end gap-3 border-t border-stone-100 dark:border-stone-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
