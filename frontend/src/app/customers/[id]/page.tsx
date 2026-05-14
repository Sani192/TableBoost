'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { 
  getCustomerDetail, 
  getCustomerVisits, 
  getLoyaltyStatus, 
  redeemReward, 
  getRedemptionHistory,
  updateCustomer,
  CustomerDetailResponse, 
  VisitDetail,
  LoyaltyStatusResponse,
  RewardRedemptionResponse
} from '@/lib/api';
import ActivityList from '@/components/ActivityList';
import StatCard from '@/components/StatCard';
import { Utensils, DollarSign, RefreshCw, Trophy, History, Gift, CheckCircle2, Loader2, Lock, ChevronRight, Cake, Heart, Edit2, Calendar } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';

const PAGE_SIZE = 20;

export default function CustomerDetailPage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<CustomerDetailResponse | null>(null);
  const [visits, setVisits] = useState<VisitDetail[]>([]);
  const [loyalty, setLoyalty] = useState<LoyaltyStatusResponse | null>(null);
  const [redemptions, setRedemptions] = useState<RewardRedemptionResponse[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  
  const [redeemingId, setRedeemingId] = useState<number | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({ name: '', birthday: '', anniversary: '' });
  const [pendingRedeem, setPendingRedeem] = useState<{ id: number; name: string } | null>(null);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    try {
      const [custData, visitsData, loyaltyData, historyData] = await Promise.all([
        getCustomerDetail(Number(id)),
        getCustomerVisits(Number(id), { skip: 0, limit: PAGE_SIZE }),
        getLoyaltyStatus(Number(id)),
        getRedemptionHistory(Number(id))
      ]);
      setCustomer(custData);
      setVisits(visitsData);
      setLoyalty(loyaltyData);
      setRedemptions(historyData);
      setHasMore(visitsData.length === PAGE_SIZE);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleEditClick = () => {
    if (!customer) return;
    setEditData({
      name: customer.name || '',
      birthday: customer.birthday || '',
      anniversary: customer.anniversary || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateProfile = async () => {
    if (!id || !customer) return;
    setUpdatingProfile(true);
    try {
      await updateCustomer(Number(id), {
        name: editData.name,
        birthday: editData.birthday || null,
        anniversary: editData.anniversary || null
      });
      setShowEditModal(false);
      fetchData();
    } catch (err) {
      alert('Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const loadMore = async () => {
    if (!id || loadingMore) return;
    setLoadingMore(true);
    const newSkip = skip + PAGE_SIZE;
    try {
      const data = await getCustomerVisits(Number(id), { skip: newSkip, limit: PAGE_SIZE });
      setVisits(prev => [...prev, ...data]);
      setSkip(newSkip);
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleRedeemClick = (rewardId: number, rewardName: string) => {
    setPendingRedeem({ id: rewardId, name: rewardName });
    setShowConfirmModal(true);
  };

  const confirmRedeem = async () => {
    if (!id || !pendingRedeem || redeemingId) return;
    
    const rewardId = pendingRedeem.id;
    setRedeemingId(rewardId);
    setShowConfirmModal(false);
    try {
      await redeemReward(Number(id), rewardId);
      setRedeemSuccess(true);
      await fetchData();
      setTimeout(() => setRedeemSuccess(false), 4000);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to redeem reward');
    } finally {
      setRedeemingId(null);
      setPendingRedeem(null);
    }
  };

  if (loading || !customer) return <div className="animate-pulse h-40 bg-stone-100 rounded-xl max-w-4xl mx-auto mt-10"></div>;

  const formattedVisits = visits.map(v => ({
    id: String(v.id),
    phoneNumber: customer.phone_number,
    name: customer.name,
    amount: v.amount,
    visitedAt: v.visited_at
  }));

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-stone-900">{customer.name || customer.phone_number}</h1>
            <p className="text-stone-500 font-medium">{customer.phone_number}</p>
            {(customer.birthday || customer.anniversary) && (
              <div className="flex gap-3 mt-2">
                {customer.birthday && (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider bg-stone-50 px-2 py-0.5 rounded-md">
                    <Cake className="h-3 w-3" /> {new Date(customer.birthday).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                )}
                {customer.anniversary && (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider bg-stone-50 px-2 py-0.5 rounded-md">
                    <Heart className="h-3 w-3" /> {new Date(customer.anniversary).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                )}
              </div>
            )}
          </div>
          <button 
            onClick={handleEditClick}
            className="p-2 hover:bg-stone-100 rounded-xl text-stone-400 transition-colors"
            title="Edit Profile"
          >
            <Edit2 className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
           <div className="px-4 py-2 bg-brand-50 border border-brand-100 rounded-2xl flex items-center gap-2">
              <Activity className="h-4 w-4 text-brand-600" />
              <span className="text-sm font-bold text-brand-900">{loyalty?.lifetime_visits || 0} Lifetime Visits</span>
           </div>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Total Visits" value={customer.total_visits} icon={<Utensils className="h-4 w-4" />} />
        <StatCard label="Total Spent" value={`$${customer.total_spent || 0}`} icon={<DollarSign className="h-4 w-4" />} accent="green" />
      </section>

      {/* Rewards Track */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-brand-600" />
            Loyalty Rewards Track
          </h2>
          {redeemSuccess && (
            <div className="flex items-center gap-1.5 text-green-600 animate-bounce">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-bold">Reward Redeemed!</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loyalty?.rewards.length ? (
            loyalty.rewards.map(reward => (
              <Card 
                key={reward.reward_id} 
                className={`p-5 transition-all ${
                  reward.is_redeemed ? 'bg-stone-50 opacity-70' : 
                  reward.is_eligible ? 'border-brand-200 bg-brand-50/20 ring-1 ring-brand-500/10' : 
                  'bg-white'
                }`}
              >
                <div className="flex flex-col h-full justify-between gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                       <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${
                         reward.is_redeemed ? 'bg-stone-200 text-stone-500' : 
                         reward.is_eligible ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30' : 
                         'bg-stone-100 text-stone-400'
                       }`}>
                         {reward.is_redeemed ? <CheckCircle2 className="h-6 w-6" /> : (
                           reward.reward_type === 'birthday' ? <Cake className="h-6 w-6" /> :
                           reward.reward_type === 'anniversary' ? <Heart className="h-6 w-6" /> :
                           <Trophy className="h-6 w-6" />
                         )}
                       </div>
                       <div>
                         <div className="flex items-center gap-2">
                            <h3 className="font-bold text-stone-900">{reward.name}</h3>
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-600 uppercase">
                              {reward.reward_type === 'milestone' ? `${reward.required_visits}V` : reward.reward_type}
                            </span>
                         </div>
                         <p className="text-xs text-stone-500 font-medium leading-snug mt-0.5">{reward.description}</p>
                       </div>
                    </div>
                  </div>

                  {!reward.is_redeemed && (
                    <div className="space-y-3">
                      {reward.reward_type === 'milestone' ? (
                        <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden border border-stone-200/50">
                          <div 
                            className={`h-full transition-all duration-1000 ease-out ${reward.is_eligible ? 'bg-brand-600' : 'bg-brand-500/40'}`}
                            style={{ width: `${Math.min((loyalty.lifetime_visits / reward.required_visits) * 100, 100)}%` }}
                          />
                        </div>
                      ) : (
                        <div className="h-1.5 w-full bg-stone-50 rounded-full overflow-hidden">
                           <div className={`h-full ${reward.is_eligible ? 'bg-brand-600 animate-pulse' : 'bg-stone-100'}`} style={{ width: reward.is_eligible ? '100%' : '0%' }} />
                        </div>
                      )}
                      
                      {reward.is_eligible ? (
                        <Button 
                          fullWidth 
                          size="sm"
                          className="gap-2 h-10 shadow-md shadow-brand-600/10"
                          onClick={() => handleRedeemClick(reward.reward_id, reward.name)}
                          disabled={redeemingId === reward.reward_id}
                        >
                          {redeemingId === reward.reward_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}
                          Redeem Now
                        </Button>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5 py-2 text-stone-400 text-xs font-bold uppercase tracking-wider">
                           {reward.reward_type === 'milestone' ? (
                             <>
                               <Lock className="h-3 w-3" />
                               {reward.required_visits - loyalty.lifetime_visits} visits more
                             </>
                           ) : (
                             <>
                               <Calendar className="h-3 w-3" />
                               Available on {reward.reward_type === 'birthday' ? 'Birthday' : 'Anniversary'}
                             </>
                           )}
                        </div>
                      )}
                    </div>
                  )}

                  {reward.is_redeemed && (
                    <div className="flex items-center justify-center gap-1.5 py-2 text-emerald-600 text-xs font-bold uppercase tracking-wider bg-emerald-50 rounded-xl">
                       <CheckCircle2 className="h-3 w-3" />
                       Claimed
                    </div>
                  )}
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-8 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200">
               <p className="text-sm font-bold text-stone-500">No active loyalty milestones.</p>
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Visit History */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
            <History className="h-5 w-5 text-stone-400" />
            Visit History
          </h2>
          {formattedVisits.length > 0 ? (
            <div className="space-y-4">
              <ActivityList visits={formattedVisits} />
              {hasMore && (
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="bg-stone-50 border border-stone-200 text-stone-600 hover:bg-stone-100 h-12 rounded-2xl"
                >
                  {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Load More Visits'}
                </Button>
              )}
            </div>
          ) : (
            <p className="text-sm text-stone-500 bg-stone-50 p-4 rounded-xl">No visits recorded.</p>
          )}
        </section>

        {/* Redemption Audit Log */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
            <Gift className="h-5 w-5 text-stone-400" />
            Redemption History
          </h2>
          {redemptions.length > 0 ? (
            <div className="space-y-3">
              {redemptions.map(r => (
                <div key={r.id} className="flex items-center justify-between p-4 border-b border-stone-100 last:border-0 hover:bg-stone-50 transition-colors rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-brand-50 text-brand-600 rounded-lg flex items-center justify-center shrink-0">
                        <Gift className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-bold text-stone-900 text-sm">{r.reward_name}</p>
                        <p className="text-[10px] text-stone-400 uppercase font-bold tracking-tight"> Milestone: {r.visits_threshold}V</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-stone-700">
                        {new Date(r.redeemed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-stone-500 bg-stone-50 p-4 rounded-xl">No rewards redeemed yet.</p>
          )}
        </section>
      </div>

      {/* Redemption Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Redemption"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setShowConfirmModal(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={confirmRedeem}>
              Confirm Redemption
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center gap-4">
          <div className="h-16 w-16 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center">
            <Trophy className="h-8 w-8" />
          </div>
          <div>
            <p className="text-stone-900 font-bold text-lg">Claim {pendingRedeem?.name}?</p>
            <p className="text-stone-500 mt-1 text-sm">
              This action will mark the reward as redeemed for <strong>{customer.name || customer.phone_number}</strong>. This cannot be undone.
            </p>
          </div>
        </div>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Customer Profile"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleUpdateProfile} disabled={updatingProfile}>
              {updatingProfile ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save Profile'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-stone-700 mb-1.5">Full Name</label>
            <input
              type="text"
              value={editData.name}
              onChange={e => setEditData({ ...editData, name: e.target.value })}
              className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium outline-none focus:border-brand-500 transition-all"
              placeholder="Enter customer name"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                  <Cake className="h-3 w-3 text-brand-600" /> Birthday
                </label>
                <input
                  type="date"
                  value={editData.birthday}
                  onChange={e => setEditData({ ...editData, birthday: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-bold outline-none focus:border-brand-500 transition-all"
                />
             </div>
             <div>
                <label className="block text-sm font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                  <Heart className="h-3 w-3 text-brand-600" /> Anniversary
                </label>
                <input
                  type="date"
                  value={editData.anniversary}
                  onChange={e => setEditData({ ...editData, anniversary: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-bold outline-none focus:border-brand-500 transition-all"
                />
             </div>
          </div>
          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider text-center pt-2">
            Captured data enables yearly loyalty rewards
          </p>
        </div>
      </Modal>
    </div>
  );
}

// Helper icon
function Activity(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  )
}
