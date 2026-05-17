import Link from 'next/link';
import { CustomerListResponse } from '@/lib/api';
import { Trophy, UserCheck, UserX, Star } from 'lucide-react';

interface CustomerListItemProps {
  customer: CustomerListResponse | any;
  showTags?: boolean;
}

export default function CustomerListItem({ customer, showTags = true }: CustomerListItemProps) {
  // Use API-provided intelligence tags if available, fallback to basic heuristics only if completely missing
  const healthStatus = customer.health_status;
  const clvTier = customer.clv_tier;
  
  // Basic heuristics for fallback
  const daysSinceLastVisit = customer.last_visit ? (Date.now() - new Date(customer.last_visit).getTime()) / (1000 * 3600 * 24) : 0;
  
  const isVip = clvTier === 'high' || (customer.total_visits >= 10 || (customer.total_spent && customer.total_spent > 300));
  const isHealthy = healthStatus === 'healthy' || (!healthStatus && daysSinceLastVisit <= 30 && customer.total_visits > 1);
  const isAtRisk = healthStatus === 'churn_risk' || (!healthStatus && customer.total_visits > 1 && daysSinceLastVisit > 30 && daysSinceLastVisit < 90);
  const isLost = healthStatus === 'lost' || (!healthStatus && daysSinceLastVisit >= 90 && customer.total_visits > 1);
  const isNew = healthStatus === 'new' || (!healthStatus && customer.total_visits <= 1);
  const isCooling = healthStatus === 'cooling';
  const isDeclining = healthStatus === 'declining';

  return (
    <Link 
      href={`/customers/${customer.id}`} 
      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-xl border border-stone-200 shadow-sm hover:shadow-md hover:border-brand-300 transition-all cursor-pointer group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-bold text-stone-900 group-hover:text-brand-600 transition-colors truncate">
            {customer.name || 'Unknown'}
          </p>
          {showTags && (
            <div className="flex flex-wrap items-center gap-1 shrink-0">
              {isVip && (
                <span className="inline-flex items-center gap-0.5 px-1 py-0.25 rounded text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                  <Star className="w-2.5 h-2.5" /> VIP
                </span>
              )}
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
            </div>
          )}
        </div>
        <p className="text-xs text-stone-500 font-medium">{customer.phone_number}</p>
      </div>
      
      <div className="flex items-center justify-between sm:justify-end gap-4 mt-3 sm:mt-0">
        <div className="text-left sm:text-right">
          <p className="text-sm font-bold text-stone-900">{customer.total_visits || 0} visits</p>
          {customer.total_spent !== undefined && customer.total_spent !== null && (
            <p className="text-xs font-bold text-emerald-600">${Number(customer.total_spent).toFixed(2)} spent</p>
          )}
        </div>
      </div>
    </Link>
  );
}
