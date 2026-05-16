'use client';
import React from 'react';

interface CustomerHealthBadgeProps {
  status: string;
}

export default function CustomerHealthBadge({ status }: CustomerHealthBadgeProps) {
  const getStyles = () => {
    switch (status) {
      case 'healthy':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'cooling':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'declining':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'churn_risk':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'new':
        return 'bg-stone-50 text-stone-600 border-stone-200';
      default:
        return 'bg-stone-50 text-stone-600 border-stone-200';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'healthy': return 'Healthy';
      case 'cooling': return 'Cooling';
      case 'declining': return 'Declining';
      case 'churn_risk': return 'At Risk';
      case 'new': return 'New';
      default: return status;
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${getStyles()}`}>
      {getLabel()}
    </span>
  );
}
