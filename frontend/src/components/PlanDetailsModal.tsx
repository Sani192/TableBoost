'use client';
import subscriptionRules from '../../../sentinel/registry/subscription_rules.json';

interface PlanInfo {
  name: string;
  price: string;
  desc: string;
  features: string[];
  tier: number;
}

interface PlanDetailsModalProps {
  plan: PlanInfo;
  currentPlan: string;
  onClose: () => void;
}

const planDetails: Record<string, { desc: string; list: string[] }> = {
  STARTER: {
    desc: 'Best for new venues starting to build their customer records.',
    list: subscriptionRules.plans.STARTER.features.map((f: string) => `⚡ ${subscriptionRules.features[f].name}`),
  },
  GROWTH: {
    desc: 'For growing venues focused on guest loyalty & basic segment marketing.',
    list: subscriptionRules.plans.GROWTH.features.map((f: string) => `🎁 ${subscriptionRules.features[f].name}`),
  },
  PRO: {
    desc: 'Advanced predictive insights, churn detection, and AI recommendations.',
    list: subscriptionRules.plans.PRO.features.map((f: string) => `🔮 ${subscriptionRules.features[f].name}`),
  },
  ENTERPRISE_READY: {
    desc: 'Enterprise multi-location workspace support and advanced workspace controls.',
    list: subscriptionRules.plans.ENTERPRISE_READY.features.map((f: string) => `🏢 ${subscriptionRules.features[f].name}`),
  },
};

export default function PlanDetailsModal({ plan, currentPlan, onClose }: PlanDetailsModalProps) {
  const details = planDetails[plan.name] || { desc: '', list: [] };
  const isCurrent = currentPlan === plan.name;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-150 dark:border-stone-700 overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-800">
          <div>
            <h3 className="text-sm font-extrabold text-stone-900 dark:text-stone-100 uppercase tracking-wide">
              {plan.name.replace('_', ' ')} Plan
            </h3>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 font-semibold mt-0.5">Feature breakdown & access overview</p>
          </div>
          <button 
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 font-black text-sm"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Plan Price & Status Badge */}
          <div className="p-4 bg-stone-50 dark:bg-stone-800 border border-stone-150 dark:border-stone-700 rounded-2xl flex justify-between items-center">
            <div>
              <span className="text-[10px] uppercase font-black text-stone-400 dark:text-stone-500 tracking-wider">Plan Pricing</span>
              <p className="text-base font-black text-stone-900 dark:text-stone-100 mt-0.5">{plan.price}</p>
            </div>
            {isCurrent ? (
              <span className="bg-brand-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
                Currently Active
              </span>
            ) : (
              <span className="bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
                Available Tier
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-xs text-stone-600 dark:text-stone-400 font-medium leading-relaxed">
            {details.desc}
          </p>

          {/* Checklist */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">{"What's Included"}</h4>
            <ul className="space-y-2">
              {details.list.map((item, idx) => (
                <li key={idx} className="text-xs text-stone-700 dark:text-stone-300 font-semibold flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Notice */}
          <div className="p-3 bg-brand-50/30 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800 rounded-xl">
            <p className="text-[10px] text-brand-800 dark:text-brand-300 font-bold leading-normal">
              💡 Plan upgrades are securely managed via the workspace administration panel. To request an upgrade or switch tiers, please reach out to your venue manager or workspace owner.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold py-2.5 rounded-xl text-xs transition-all active:scale-95"
            >
              Close
            </button>
            <a
              href={`mailto:nexra.dev@gmail.com?subject=TableBoost Subscription Upgrade Request - ${plan.name}`}
              className="flex-1 bg-brand-600 hover:bg-brand-700 text-white text-center font-bold py-2.5 rounded-xl text-xs transition-all active:scale-95 flex items-center justify-center"
            >
              Request Upgrade
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
