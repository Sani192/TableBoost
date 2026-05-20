'use client';

import Link from 'next/link';
import { VisitDetail } from '@/lib/api';
import { Star, UserCheck, UserX } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface VisitListItemProps {
  visit: VisitDetail | any;
  showTags?: boolean;
  isCard?: boolean;
  isTable?: boolean;
}

export default function VisitListItem({ visit, showTags = true, isCard = false, isTable = false }: VisitListItemProps) {
  const { hasFeatureAccess } = useAuth();
  const name = (visit.customer_name || visit.name || '').trim() || 'Walk-in Customer';
  const initial = name.charAt(0).toUpperCase();
  
  const healthStatus = visit.health_status;
  const clvTier = visit.clv_tier;
  
  // Basic heuristics for fallback
  const daysSinceLastVisit = visit.last_visit ? (Date.now() - new Date(visit.last_visit).getTime()) / (1000 * 3600 * 24) : 0;
  
  const isVip = clvTier === 'high' || (visit.total_visits >= 10 || (visit.total_spent && visit.total_spent > 300));
  const isHealthy = healthStatus === 'healthy' || (!healthStatus && daysSinceLastVisit <= 30 && visit.total_visits > 1);
  const isAtRisk = healthStatus === 'churn_risk' || (!healthStatus && visit.total_visits > 1 && daysSinceLastVisit > 30 && daysSinceLastVisit < 90);
  const isLost = healthStatus === 'lost' || (!healthStatus && daysSinceLastVisit >= 90 && visit.total_visits > 1);
  const isNew = healthStatus === 'new' || (!healthStatus && visit.total_visits <= 1);
  const isCooling = healthStatus === 'cooling';
  const isDeclining = healthStatus === 'declining';
  
  return (
    <Link 
      href={`/customers/${visit.customer_id || visit.id}`} 
      className={isCard 
        ? "flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-xl border border-stone-200 shadow-sm hover:shadow-md hover:border-brand-300 transition-all cursor-pointer group"
        : "flex items-center gap-3 px-5 py-4 sm:px-6 hover:bg-stone-50/80 transition-colors group"
      }
    >
      {!isCard && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-sm font-bold text-brand-700 shadow-sm">
          {initial}
        </div>
      )}
      
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-0.5">
          <p className="truncate text-sm font-bold text-stone-900 group-hover:text-brand-600 transition-colors">
            {name}
          </p>
          {showTags && (
            <div className="flex flex-wrap items-center gap-1 shrink-0">
              {isVip && hasFeatureAccess('smart_segments') && (
                <span className="inline-flex items-center gap-0.5 px-1 py-0.25 rounded text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                  <Star className="w-2.5 h-2.5" /> VIP
                </span>
              )}
              {hasFeatureAccess('intelligence') && (
                <>
                  {clvTier === 'high' && (
                    <span className="inline-flex items-center gap-0.5 px-1 py-0.25 rounded text-[9px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                      HIGH CLV
                    </span>
                  )}
                  {clvTier === 'medium' && (
                    <span className="inline-flex items-center gap-0.5 px-1 py-0.25 rounded text-[9px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                      MEDIUM CLV
                    </span>
                  )}
                  {clvTier === 'low' && (
                    <span className="inline-flex items-center gap-0.5 px-1 py-0.25 rounded text-[9px] font-bold bg-stone-100 text-stone-700 border border-stone-200">
                      LOW CLV
                    </span>
                  )}
                  {isNew && (
                    <span className="inline-flex items-center gap-0.5 px-1 py-0.25 rounded text-[9px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                      <Star className="w-2.5 h-2.5" /> NEW
                    </span>
                  )}
                  {isHealthy && (
                    <span className="inline-flex items-center gap-0.5 px-1 py-0.25 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                      <UserCheck className="w-2.5 h-2.5" /> HEALTHY
                    </span>
                  )}
                  {isCooling && (
                    <span className="inline-flex items-center gap-0.5 px-1 py-0.25 rounded text-[9px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                      COOLING
                    </span>
                  )}
                  {isDeclining && (
                    <span className="inline-flex items-center gap-0.5 px-1 py-0.25 rounded text-[9px] font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">
                      DECLINING
                    </span>
                  )}
                  {isAtRisk && (
                    <span className="inline-flex items-center gap-0.5 px-1 py-0.25 rounded text-[9px] font-bold bg-orange-100 text-orange-700 border border-orange-200">
                      <UserCheck className="w-2.5 h-2.5" /> AT RISK
                    </span>
                  )}
                  {isLost && (
                    <span className="inline-flex items-center gap-0.5 px-1 py-0.25 rounded text-[9px] font-bold bg-red-100 text-red-700 border border-red-200">
                      <UserX className="w-2.5 h-2.5" /> LOST
                    </span>
                  )}
                </>
              )}
            </div>
          )}
        </div>
        <p className="truncate text-xs font-medium text-stone-500 flex items-center gap-2">
          <span>{visit.phone_number}</span>
          {visit.status && (
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              visit.status === 'converted' || visit.status === 'redeemed' 
                ? 'bg-emerald-100 text-emerald-700'
                : visit.status === 'sent'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-stone-100 text-stone-600'
            }`}>
              {visit.status}
            </span>
          )}
        </p>
      </div>

      <div className={isCard 
        ? "flex items-center justify-between sm:justify-end gap-4 mt-3 sm:mt-0"
        : isTable
        ? "flex items-center gap-0 ml-2"
        : "shrink-0 text-right ml-2"
      }>
        <div className={isCard ? "text-left sm:text-right" : isTable ? "w-32 text-right shrink-0" : ""}>
          <p className="text-sm font-bold text-stone-900">
            {visit.amount !== null && visit.amount !== undefined ? `$${Number(visit.amount).toFixed(2)}` : '—'}
          </p>
          {visit.visited_at ? (
            <div className={isTable ? "sm:hidden" : ""}>
              <p className="text-xs font-bold text-stone-500">
                {new Date(visit.visited_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </p>
              <p className="text-[10px] font-medium text-stone-400 hidden sm:block">
                {new Date(visit.visited_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </p>
            </div>
          ) : (
            <p className="text-xs font-bold text-stone-500">—</p>
          )}
        </div>
        
        {isTable && !isCard && (
          <div className="hidden sm:block w-40 text-right shrink-0">
            {visit.visited_at ? (
              <>
                <p className="text-xs font-bold text-stone-500">
                  {new Date(visit.visited_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </p>
                <p className="text-[10px] font-medium text-stone-400">
                  {new Date(visit.visited_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </p>
              </>
            ) : (
              <p className="text-xs font-bold text-stone-500">—</p>
            )}
          </div>
        )}
      </div>
      
      {!isCard && (
        <div className="sm:hidden shrink-0 text-right">
          <p className="text-[10px] font-bold text-stone-400 uppercase">
            {visit.visited_at ? new Date(visit.visited_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '—'}
          </p>
        </div>
      )}
    </Link>
  );
}
