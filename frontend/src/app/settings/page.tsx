'use client';
import { useEffect, useState } from 'react';
import { 
  getSettings, 
  updateSettings, 
  getLoyaltyRewards, 
  createLoyaltyReward, 
  updateLoyaltyReward,
  LoyaltyReward 
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
  Activity
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function SettingsPage() {
  const [template, setTemplate] = useState('');
  const [inactiveDays, setInactiveDays] = useState<number | string>(30);
  
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
      const [settingsData, rewardsData] = await Promise.all([
        getSettings(),
        getLoyaltyRewards()
      ]);
      setTemplate(settingsData.review_message_template);
      setInactiveDays(settingsData.campaign_inactive_days);
      setRewards(rewardsData);
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
        review_message_template: template,
        campaign_inactive_days: Number(inactiveDays)
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
              <div className="pt-2">
                <label className="block text-sm font-bold text-stone-700 mb-1.5">Campaign Inactivity (Days)</label>
                <input
                  type="number"
                  value={inactiveDays}
                  onChange={e => setInactiveDays(e.target.value)}
                  className="w-24 rounded-xl border border-stone-200 px-4 py-3 text-sm font-bold outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
                />
              </div>
            </div>
            <div className="bg-stone-50 px-5 py-3 flex items-center justify-between">
              <p className="text-xs text-stone-500 font-medium">Changes apply globally to all customers.</p>
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3 mr-1.5" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </Card>
        </form>
      </section>

      {/* Multi-Reward Loyalty Management */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-brand-600" />
            <h2 className="text-lg font-bold text-stone-900">Loyalty Rewards Hub</h2>
          </div>
          <Button size="sm" onClick={() => setShowAddReward(!showAddReward)} variant={showAddReward ? 'secondary' : 'primary'}>
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
