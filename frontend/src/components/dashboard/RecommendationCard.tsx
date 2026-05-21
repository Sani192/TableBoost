'use client';
import React from 'react';
import { X, Sparkles, AlertTriangle, Lightbulb } from 'lucide-react';
import Button from '@/components/ui/Button';

interface RecommendationCardProps {
  id: number;
  rule_id: string;
  message: string;
  priority: string;
  action_type?: string;
  action_params?: Record<string, any>;
  onDismiss: (id: number) => void;
  onAction?: (type: string, params?: Record<string, any>) => void;
}

export default function RecommendationCard({
  id,
  rule_id,
  message,
  priority,
  action_type,
  action_params,
  onDismiss,
  onAction
}: RecommendationCardProps) {
  
  const getPriorityStyles = () => {
    switch (priority) {
      case 'high':
        return 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      case 'medium':
        return 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300';
      case 'positive':
        return 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300';
      default:
        return 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300';
    }
  };

  const getPriorityIcon = () => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'medium':
        return <Lightbulb className="h-5 w-5 text-orange-600" />;
      case 'positive':
        return <Sparkles className="h-5 w-5 text-emerald-600" />;
      default:
        return <Lightbulb className="h-5 w-5 text-stone-600" />;
    }
  };

  return (
    <div className={`relative p-4 rounded-xl border ${getPriorityStyles()} transition-all shadow-sm`}>
      <button 
        onClick={() => onDismiss(id)}
        className="absolute top-3 right-3 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
      
      <div className="flex items-start gap-3 pr-6">
        <div className="mt-0.5 shrink-0">
          {getPriorityIcon()}
        </div>
        <div className="flex-1 space-y-2">
          <p className="text-sm font-semibold leading-snug">{message}</p>
          
          {action_type && (
            <div className="pt-1">
              <Button 
                variant="secondary" 
                className="text-xs font-bold h-7 px-3 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 border-stone-200 dark:border-stone-600 rounded-lg"
                onClick={() => onAction && onAction(action_type, action_params)}
              >
                {action_type === 'view_customers' ? 'View Customers' : 
                 action_type === 'review_settings' ? 'Review Settings' : 
                 action_type === 'create_campaign' ? 'Create Campaign' : 'Take Action'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
