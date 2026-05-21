"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service if we had one
    console.error("Global Error Boundary caught an error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-stone-900 rounded-2xl shadow-sm dark:shadow-dark-card border border-stone-200 dark:border-stone-700 p-8 text-center">
        <div className="w-20 h-20 bg-red-50 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500 dark:text-red-400" />
        </div>
        
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-3">Application Error</h1>
        
        <p className="text-stone-600 dark:text-stone-400 mb-8">
          TableBoost encountered an unexpected operational error. 
          The issue has been logged and we&apos;re working to restore stability.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 rounded-xl font-medium transition-colors"
          >
            <RefreshCcw className="w-5 h-5" />
            Try to Recover
          </button>
          
          <Link 
            href="/"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl font-medium transition-colors"
          >
            <Home className="w-5 h-5" />
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
