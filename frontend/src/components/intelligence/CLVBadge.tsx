'use client';
import React from 'react';

interface CLVBadgeProps {
  tier: string;
}

export default function CLVBadge({ tier }: CLVBadgeProps) {
  const getStyles = () => {
    switch (tier) {
      case 'high':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'medium':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'low':
        return 'bg-stone-50 text-stone-600 border-stone-200';
      default:
        return 'bg-stone-50 text-stone-600 border-stone-200';
    }
  };

  const getLabel = () => {
    switch (tier) {
      case 'high': return 'VIP (High CLV)';
      case 'medium': return 'Medium CLV';
      case 'low': return 'Low CLV';
      default: return tier;
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${getStyles()}`}>
      {getLabel()}
    </span>
  );
}
