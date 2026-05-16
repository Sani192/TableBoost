'use client';
import { useEffect, useState } from 'react';
import { 
  getSettings, 
  updateSettings, 
  getLoyaltyRewards, 
  createLoyaltyReward, 
  updateLoyaltyReward,
  getAutomationConfigs,
  updateAutomationConfig,
  LoyaltyReward,
  AutomationConfig 
} from '@/lib/api';
import { 
  MessageSquare, 
  Megaphone, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Trophy, 
  Plus, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  ChevronRight,
  Activity,
  Rocket,
  Cake,
  Heart,
  Calendar,
  Sparkles,
  Lightbulb,
  Target
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

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

export default function SettingsPage() {
  const [template, setTemplate] = useState('');
  
  const [automations, setAutomations] = useState<AutomationConfig[]>([]);
  const [editingAuto, setEditingAuto] = useState<string | null>(null);
  const [editTemplate, setEditTemplate] = useState('');
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [showAddReward, setShowAddReward] = useState(false);
  const [newReward, setNewReward] = useState<{
    name: string;
    description: string;
    required_visits: number | string;
    reward_type: string;
    is_active: boolean;
  }>({
    name: '',
    description: '',
    required_visits: '',
    reward_type: 'milestone',
    is_active: true
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [settingsData, rewardsData, automationData] = await Promise.all([
        getSettings(),
        getLoyaltyRewards(),
        getAutomationConfigs()
      ]);
      setTemplate(settingsData.review_message_template);
      setRewards(rewardsData);
      setAutomations(automationData);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError('Failed to load settings');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      await updateSettings({ 
        review_message_template: template
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAddReward = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createLoyaltyReward({
        ...newReward,
        required_visits: Number(newReward.required_visits)
      });
      setShowAddReward(false);
      setNewReward({ name: '', description: '', required_visits: '', reward_type: 'milestone', is_active: true });
      fetchData();
    } catch (err) {
      alert('Failed to create reward');
    }
  };

  const toggleRewardStatus = async (id: number, currentStatus: boolean) => {
    try {
      await updateLoyaltyReward(id, { is_active: !currentStatus });
      fetchData();
    } catch (err) {
      alert('Failed to update reward');
    }
  };

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
        <div className="h-48 bg-stone-100 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-20">
      <header>
        <h1 className="text-2xl font-extrabold text-stone-900">Settings</h1>
        <p className="text-stone-500">Manage your restaurant engagement and loyalty platform.</p>
      </header>

      {/* Messaging & Campaigns */}
      <section className="space-y-6">
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <Card className="overflow-hidden">
            <div className="border-b border-stone-100 bg-stone-50/50 px-5 py-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-brand-600" />
              <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider">Engagement Settings</h2>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1.5">Review Message Template</label>
                <textarea
                  value={template}
                  onChange={e => setTemplate(e.target.value)}
                  required
                  rows={4}
                  className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm font-medium outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
                />
              </div>

            </div>
            <div className="bg-stone-50 px-5 py-3 flex items-center justify-between">
              <p className="text-xs text-stone-500 font-medium">Changes apply globally to all customers.</p>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3 mr-1.5" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </Card>
        </form>
      </section>

      {/* Automation Engine */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-brand-600" />
          <h2 className="text-lg font-bold text-stone-900">Automation Pilots</h2>
        </div>
        
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
      </section>

      {/* Multi-Reward Loyalty Management */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-brand-600" />
            <h2 className="text-lg font-bold text-stone-900">Loyalty Rewards Hub</h2>
          </div>
          <Button onClick={() => setShowAddReward(!showAddReward)} variant={showAddReward ? 'secondary' : 'primary'}>
            {showAddReward ? 'Cancel' : <><Plus className="h-4 w-4 mr-1.5" /> Add Reward</>}
          </Button>
        </div>

        {showAddReward && (
          <Card className="p-5 border-brand-200 bg-brand-50/10 animate-in fade-in slide-in-from-top-2">
            <form onSubmit={handleAddReward} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1.5">Reward Name</label>
                <input
                  type="text"
                  required
                  value={newReward.name}
                  onChange={e => setNewReward({...newReward, name: e.target.value})}
                  placeholder="e.g. Free Drink"
                  className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium outline-none focus:border-brand-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1.5">Reward Type</label>
                  <select
                    value={newReward.reward_type}
                    onChange={e => setNewReward({...newReward, reward_type: e.target.value})}
                    className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium outline-none focus:border-brand-500 bg-white"
                  >
                    <option value="milestone">Visit Milestone</option>
                    <option value="birthday">Birthday Reward</option>
                    <option value="anniversary">Anniversary Reward</option>
                  </select>
                </div>
                {newReward.reward_type === 'milestone' && (
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-1.5">Required Visits</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={newReward.required_visits}
                      onChange={e => setNewReward({...newReward, required_visits: e.target.value})}
                      className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-bold outline-none focus:border-brand-500"
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1.5">Description</label>
                <input
                  type="text"
                  value={newReward.description}
                  onChange={e => setNewReward({...newReward, description: e.target.value})}
                  placeholder="e.g. Claim after 5 lifetime visits"
                  className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium outline-none focus:border-brand-500"
                />
              </div>
              <Button type="submit" fullWidth>Create Milestone Reward</Button>
            </form>
          </Card>
        )}

        <div className="space-y-3">
          {rewards.length > 0 ? (
            rewards.map(reward => (
              <Card key={reward.id} className={`p-4 transition-all ${!reward.is_active ? 'opacity-60 bg-stone-50' : 'hover:border-brand-200 shadow-sm'}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${reward.is_active ? 'bg-brand-50 text-brand-600' : 'bg-stone-200 text-stone-500'}`}>
                      <Trophy className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-stone-900">{reward.name}</h3>
                        <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-stone-100 text-stone-500">
                          {reward.reward_type === 'milestone' ? `${reward.required_visits} Visits` : reward.reward_type}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 font-medium">{reward.description || 'Milestone reward'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => toggleRewardStatus(reward.id, reward.is_active)}
                    className={`p-2 rounded-lg transition-colors ${reward.is_active ? 'text-brand-600 hover:bg-brand-50' : 'text-stone-400 hover:bg-stone-100'}`}
                    title={reward.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {reward.is_active ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                  </button>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-10 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
              <Trophy className="h-10 w-10 text-stone-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-stone-500">No loyalty rewards configured yet.</p>
              <p className="text-xs text-stone-400 mt-1">Add your first milestone reward above.</p>
            </div>
          )}
        </div>
      </section>

      {success && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-full shadow-lg animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-sm font-bold">Settings updated successfully</span>
        </div>
      )}
    </div>
  );
}
