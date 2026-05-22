'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getAutomationConfigs,
  updateAutomationConfig,
  AutomationConfig 
} from '@/lib/api';
import { 
  Rocket,
  Cake,
  Heart,
  Calendar,
  Sparkles,
  Lightbulb,
  Target,
  Trophy,
  ToggleLeft, 
  ToggleRight,
  Lock,
  ChevronRight
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

const AUTOMATION_METADATA: Record<string, { label: string; icon: any; description: string }> = {
  birthday: {
    label: 'Birthday SMS',
    icon: Cake,
    description: 'Sent on customer birthdays'
  },
  anniversary: {
    label: 'Anniversary SMS',
    icon: Heart,
    description: 'Sent on signup anniversaries'
  },
  inactivity: {
    label: 'Inactivity Recovery',
    icon: Calendar,
    description: 'Targets quiet customers'
  },
  reward_unlocked: {
    label: 'Reward Unlocked SMS',
    icon: Trophy,
    description: 'Instant win notifications'
  },
  daily_intelligence: {
    label: 'Daily Intelligence',
    icon: Sparkles,
    description: 'System: Daily intelligence computation'
  },
  daily_recommendations: {
    label: 'Daily Recommendations',
    icon: Lightbulb,
    description: 'System: Daily recommendations evaluation'
  },
  weekly_summary: {
    label: 'Weekly Summary',
    icon: Target,
    description: 'System: Weekly business summary'
  },
  monthly_summary: {
    label: 'Monthly Summary',
    icon: Trophy,
    description: 'System: Monthly business summary'
  }
};

export default function AutomationsPage() {
  const { user, hasFeatureAccess } = useAuth();
  const router = useRouter();
  
  // Secure route guard - Automations only for OWNER
  useEffect(() => {
    if (user && user.role !== 'OWNER') {
      router.replace('/');
    }
  }, [user, router]);

  const [automations, setAutomations] = useState<AutomationConfig[]>([]);
  const [editingAuto, setEditingAuto] = useState<string | null>(null);
  const [editTemplate, setEditTemplate] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      if (hasFeatureAccess('automation')) {
        const data = await getAutomationConfigs();
        setAutomations(data);
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError('Failed to load automations');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleAutomation = async (type: string, isEnabled: boolean) => {
    try {
      await updateAutomationConfig({ automation_type: type, is_enabled: !isEnabled });
      fetchData();
    } catch (err) {
      alert('Failed to update automation');
    }
  };

  const handleUpdateAutoTemplate = async (type: string) => {
    try {
      await updateAutomationConfig({ automation_type: type, message_template: editTemplate });
      setEditingAuto(null);
      fetchData();
    } catch (err) {
      alert('Failed to update template');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse max-w-2xl mx-auto">
        <div className="h-8 w-48 bg-stone-200 rounded-lg"></div>
        <div className="h-64 bg-stone-100 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-20">
      <header>
        <h1 className="text-2xl font-extrabold text-stone-900">Automation Engine</h1>
        <p className="text-stone-500">Manage auto-pilot campaigns and system operations.</p>
      </header>

      <section className="space-y-4">
        {hasFeatureAccess('automation') ? (
          <div className="grid grid-cols-1 gap-3">
            {automations
              .filter(a => a.automation_type !== 'campaign_scheduler')
              .map(auto => {
                const meta = AUTOMATION_METADATA[auto.automation_type] || { label: auto.automation_type, icon: Rocket, description: 'Auto-pilot engagement' };
                const Icon = meta.icon;
                
                return (
                  <Card key={auto.automation_type} className={`p-4 transition-all ${!auto.is_enabled ? 'opacity-60 bg-stone-50' : 'hover:border-brand-200 shadow-sm'}`}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${auto.is_enabled ? 'bg-brand-50 text-brand-600' : 'bg-stone-200 text-stone-500'}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-stone-900">{meta.label}</h3>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-stone-500 font-medium">{meta.description}</p>
                            {auto.is_enabled && auto.schedule && (
                              <span className="text-[9px] font-extrabold bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                {auto.schedule.replace('cron:', '').replace('interval:', 'Every ' + (auto.schedule.split(':')[1] === '1' ? 'Hour' : auto.schedule.split(':')[1] + ' Hours'))}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => toggleAutomation(auto.automation_type, auto.is_enabled)}
                        className={`p-2 rounded-lg transition-colors ${auto.is_enabled ? 'text-brand-600 hover:bg-brand-50' : 'text-stone-400 hover:bg-stone-100'}`}
                      >
                        {auto.is_enabled ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                      </button>
                    </div>

                    {auto.is_enabled && (
                      <div className="mt-3 pt-3 border-t border-stone-100 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                           <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Active Template</p>
                           <button 
                              onClick={() => {
                                 if (editingAuto === auto.automation_type) {
                                    setEditingAuto(null);
                                 } else {
                                    setEditingAuto(auto.automation_type);
                                    setEditTemplate(auto.message_template);
                                 }
                              }}
                              className="text-xs font-bold text-brand-600 hover:underline"
                           >
                              {editingAuto === auto.automation_type ? 'Cancel' : 'Customize'}
                           </button>
                        </div>
                        
                        {editingAuto === auto.automation_type ? (
                           <div className="space-y-3">
                              <textarea
                                 value={editTemplate}
                                 onChange={e => setEditTemplate(e.target.value)}
                                 className="w-full rounded-xl border border-stone-200 p-3 text-xs font-medium outline-none focus:border-brand-500 transition-all bg-stone-50"
                                 rows={3}
                              />
                              <Button onClick={() => handleUpdateAutoTemplate(auto.automation_type)} fullWidth>
                                 Save Template
                              </Button>
                           </div>
                        ) : (
                           <p className="text-xs text-stone-600 font-medium italic">&quot;{auto.message_template}&quot;</p>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })
            }
            {automations.length === 0 && (
              <div className="text-center py-6 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                 <p className="text-xs font-bold text-stone-400">Initialize automations to begin.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 text-center bg-stone-50 rounded-2xl border border-stone-200 flex flex-col items-center justify-center gap-2">
            <Lock className="h-6 w-6 text-stone-400" />
            <h3 className="text-sm font-bold text-stone-900">Automation Engine is Gated</h3>
            <p className="text-xs text-stone-500 max-w-sm">Upgrade to the Pro plan to configure birthday SMS, anniversary SMS, and inactivity recovery campaigns.</p>
          </div>
        )}
      </section>
    </div>
  );
}
