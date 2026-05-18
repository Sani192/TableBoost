'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import AddVisitForm from '@/components/AddVisitForm';
import { useAuth } from '@/context/AuthContext';

export default function AddVisitPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isStaff = user?.role === 'STAFF';

  return (
    <div className="animate-fade-in space-y-5 pb-6 sm:space-y-6">
      {/* Header */}
      <header className="flex items-center gap-3">
        {!isStaff && (
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 shadow-soft transition-all hover:bg-stone-50 hover:text-stone-700 active:scale-95"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">
            Add Visit
          </p>
          <h1 className="text-xl font-extrabold tracking-tight text-stone-900 sm:text-2xl">
            Save in seconds
          </h1>
        </div>
      </header>

      {/* Form */}
      <AddVisitForm 
        onSuccess={isStaff ? undefined : () => router.push('/')} 
        onCancel={isStaff ? undefined : () => router.push('/')} 
      />
    </div>
  );
}
