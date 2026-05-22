'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getLoyaltyRewards, 
  createLoyaltyReward, 
  updateLoyaltyReward,
  LoyaltyReward
} from '@/lib/api';
import { 
  Trophy, 
  Plus, 
  ToggleLeft, 
  ToggleRight,
  Lock,
  AlertCircle
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import SubscriptionPlansModal from '@/components/SubscriptionPlansModal';
import { useAuth } from '@/context/AuthContext';

export default function LoyaltyPage() {
  const { user, hasFeatureAccess } = useAuth();
  const router = useRouter();
  
  // Secure route guard
  useEffect(() => {
    if (user && user.role === 'STAFF') {
      router.replace('/');
    }
  }, [user, router]);

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
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  
  const [pendingToggle, setPendingToggle] = useState<{ id: number, name: string, is_active: boolean } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [showPlans, setShowPlans] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      if (hasFeatureAccess('loyalty')) {
        const data = await getLoyaltyRewards();
        setRewards(data);
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError('Failed to load loyalty rewards');
    }
  }, [hasFeatureAccess]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddReward = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await createLoyaltyReward({
        ...newReward,
        required_visits: Number(newReward.required_visits)
      });
      setShowAddReward(false);
      setNewReward({ name: '', description: '', required_visits: '', reward_type: 'milestone', is_active: true });
      fetchData();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Failed to create reward');
    }
  };

  const handleToggleClick = (reward: LoyaltyReward) => {
    setPendingToggle({ id: reward.id, name: reward.name, is_active: reward.is_active });
    setToggleError(null);
    setShowConfirmModal(true);
  };

  const confirmToggle = async () => {
    if (!pendingToggle) return;
    setToggleError(null);
    try {
      await updateLoyaltyReward(pendingToggle.id, { is_active: !pendingToggle.is_active });
      setShowConfirmModal(false);
      fetchData();
    } catch (err: any) {
      setToggleError(err.response?.data?.detail || 'Failed to update reward');
    } finally {
      if (!toggleError) {
        setPendingToggle(null);
      }
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

  if (!hasFeatureAccess('loyalty')) {
    return (
      <div className="py-12 text-center bg-white rounded-3xl border border-stone-200/60 shadow-card p-6 flex flex-col items-center justify-center gap-4 animate-fade-in max-w-2xl mx-auto mt-10">
        <div className="h-14 w-14 bg-stone-50 text-stone-400 rounded-2xl flex items-center justify-center border border-stone-200/60 shadow-sm animate-bounce">
          <Lock className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-stone-900">Loyalty Rewards are Gated</h3>
          <p className="text-sm text-stone-500 max-w-sm mt-1 mx-auto">Upgrade to the Growth plan to create custom reward milestones, manage points, and track redemptions.</p>
        </div>
        <Button onClick={() => setShowPlans(true)} className="mt-2 shadow-sm shadow-brand-500/20">
          View Subscription Plans
        </Button>
        {showPlans && <SubscriptionPlansModal onClose={() => setShowPlans(false)} />}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-20">
      <header>
        <h1 className="text-2xl font-extrabold text-stone-900">Loyalty Rewards</h1>
        <p className="text-stone-500">Manage milestone and event-based customer rewards.</p>
      </header>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100 flex items-center gap-2 mt-4">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-brand-600" />
            <h2 className="text-lg font-bold text-stone-900">Loyalty Rewards Hub</h2>
          </div>
          {hasFeatureAccess('loyalty') && (
            <Button onClick={() => setShowAddReward(!showAddReward)} variant={showAddReward ? 'secondary' : 'primary'}>
              {showAddReward ? 'Cancel' : <><Plus className="h-4 w-4 mr-1.5" /> Add Reward</>}
            </Button>
          )}
        </div>

            {showAddReward && (
              <Card className="p-5 border-brand-200 bg-brand-50/10 animate-in fade-in slide-in-from-top-2">
                <form onSubmit={handleAddReward} className="space-y-4">
                  {formError && (
                    <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {formError}
                    </div>
                  )}
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
                  <Button type="submit" fullWidth>Create Reward</Button>
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
                            <span className="text-xs font-extrabold uppercase px-1.5 py-0.5 rounded bg-stone-100 text-stone-500">
                              {reward.reward_type === 'milestone' ? `${reward.required_visits} Visits` : reward.reward_type}
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 font-medium">{reward.description || 'Milestone reward'}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleToggleClick(reward)}
                        className={`p-3 rounded-lg transition-colors ${reward.is_active ? 'text-brand-600 hover:bg-brand-50' : 'text-stone-400 hover:bg-stone-100'}`}
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

      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Reward Status Change"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
              Cancel
            </Button>
            <Button onClick={confirmToggle} className={pendingToggle?.is_active ? "bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white" : ""}>
              {pendingToggle?.is_active ? 'Deactivate Reward' : 'Activate Reward'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center gap-4">
          <div className="h-16 w-16 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center">
            <Trophy className="h-8 w-8" />
          </div>
          <div>
            <p className="text-stone-900 font-bold text-lg">
              {pendingToggle?.is_active ? 'Deactivate' : 'Activate'} {pendingToggle?.name}?
            </p>
            <p className="text-stone-500 mt-2 text-sm max-w-sm mx-auto">
              {pendingToggle?.is_active 
                ? 'Customers will no longer be able to claim this reward, though existing claims remain valid.' 
                : 'Customers who meet the criteria will immediately be able to claim this reward.'}
            </p>
          </div>
          {toggleError && (
            <div className="w-full mt-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100 flex items-center gap-2 text-left">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {toggleError}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
