'use client';
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import PlanDetailsModal from '@/components/PlanDetailsModal';
import { X, CheckCircle2 } from 'lucide-react';
import subscriptionRules from '../../../sentinel/registry/subscription_rules.json';

const PLAN_TIERS = [
  { 
    name: 'STARTER', 
    price: '$49/mo', 
    desc: 'Core visit entry & tracking', 
    features: subscriptionRules.plans.STARTER.features.map((f: string) => subscriptionRules.features[f].name), 
    tier: 1 
  },
  { 
    name: 'GROWTH', 
    price: '$99 - $149/mo', 
    desc: 'Loyalty programs & messaging campaigns', 
    features: subscriptionRules.plans.GROWTH.features.map((f: string) => subscriptionRules.features[f].name), 
    tier: 2 
  },
  { 
    name: 'PRO', 
    price: '$249 - $299/mo', 
    desc: 'Predictive churn intelligence & automation', 
    features: subscriptionRules.plans.PRO.features.map((f: string) => subscriptionRules.features[f].name), 
    tier: 3 
  },
  { 
    name: 'ENTERPRISE_READY', 
    price: 'Custom', 
    desc: 'Multi-location, fine-grained access control', 
    features: subscriptionRules.plans.ENTERPRISE_READY.features.map((f: string) => subscriptionRules.features[f].name), 
    tier: 4 
  },
];

interface SubscriptionPlansModalProps {
  onClose: () => void;
}

export default function SubscriptionPlansModal({ onClose }: SubscriptionPlansModalProps) {
  const { user } = useAuth();
  const currentPlan = user?.plan || 'STARTER';
  
  const [selectedPlanDetails, setSelectedPlanDetails] = useState<any | null>(null);

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-in fade-in">
        <div className="w-full max-w-2xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-150 dark:border-stone-700 overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-6 py-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-800">
            <div>
              <h3 className="text-lg font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
                Subscription Plans
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium mt-0.5">
                Explore plans and request upgrades to unlock premium features.
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-full text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content - Grid of plans */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PLAN_TIERS.map((p) => {
                const isCurrent = currentPlan === p.name;
                
                return (
                  <div 
                    key={p.name} 
                    onClick={() => setSelectedPlanDetails(p)}
                    className={`p-5 rounded-2xl border transition-all flex flex-col gap-3 relative overflow-hidden group cursor-pointer ${
                      isCurrent 
                        ? 'border-brand-500 bg-brand-50/40 dark:bg-brand-900/20 ring-2 ring-brand-500/10' 
                        : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:border-brand-400 hover:shadow-soft active:scale-[0.98]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-black text-stone-900 dark:text-stone-100 uppercase tracking-wide">
                            {p.name.replace('_', ' ')}
                          </span>
                          {isCurrent && (
                            <span className="bg-brand-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-500 dark:text-stone-400 font-medium mt-1 leading-snug pr-4">
                          {p.desc}
                        </p>
                      </div>
                      <span className="text-sm font-black text-stone-900 dark:text-stone-100 bg-stone-100 dark:bg-stone-700/50 px-2.5 py-1 rounded-lg">
                        {p.price}
                      </span>
                    </div>
                    
                    <div className="flex flex-col gap-1.5 mt-2 border-t border-dashed border-stone-150 dark:border-stone-700 pt-3">
                      {p.features.map(f => (
                        <span key={f} className="text-[11px] text-stone-600 dark:text-stone-400 font-bold flex items-center gap-1.5">
                          <span className="text-brand-500 dark:text-brand-400">✓</span> {f}
                        </span>
                      ))}
                    </div>
                    
                    <div className="mt-2 pt-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button className="w-full text-[10px] font-black uppercase tracking-wider text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 py-2 rounded-xl">
                        View Plan Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 p-4 bg-stone-50 dark:bg-stone-800/50 border border-stone-150 dark:border-stone-700 rounded-2xl flex items-start gap-3">
              <div className="text-stone-400 mt-0.5">ℹ️</div>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium leading-relaxed">
                If you are a Manager or Staff member, requesting a plan upgrade will automatically notify your workspace Owner.
              </p>
            </div>
          </div>
        </div>
      </div>

      {selectedPlanDetails && (
        <PlanDetailsModal 
          plan={selectedPlanDetails} 
          currentPlan={currentPlan} 
          onClose={() => setSelectedPlanDetails(null)} 
        />
      )}
    </>
  );
}
