'use client';
import React from 'react';

interface TrendSparklineProps {
  data: number[];
  labels?: string[];
  title: string;
  prefix?: string;
}

export default function TrendSparkline({ data, labels, title, prefix = '' }: TrendSparklineProps) {
  const max = Math.max(...data, 1);
  
  return (
    <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-sm">
      <h3 className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">{title}</h3>
      <div className="h-16 flex items-end justify-between gap-1 mt-2">
        {data.map((val, i) => (
          <div key={i} className="flex-1 h-full flex flex-col justify-end items-center gap-1 group">
            <div 
              className="w-full bg-brand-500/20 hover:bg-brand-500 rounded-t-sm transition-all duration-300 relative min-h-[2px]"
              style={{ height: `${(val / max) * 100}%` }}
            >
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[10px] py-1 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                {prefix}{val}
              </div>
            </div>
            {labels && labels[i] && (
              <span className="text-[8px] font-bold text-stone-400 truncate w-full text-center">
                {labels[i]}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
