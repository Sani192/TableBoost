'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createCampaign, getSettings, updateSettings, getCampaignAudienceCount } from '@/lib/api';
import { Megaphone, Users, Send, CheckCircle2, Settings as SettingsIcon, Lock, AlertCircle, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import SubscriptionPlansModal from '@/components/SubscriptionPlansModal';
import { useAuth } from '@/context/AuthContext';

type Feedback = { type: 'success' | 'error', text: string } | null;

export default function CampaignsPage() {
  const { hasFeatureAccess } = useAuth();
  const [audience, setAudience] = useState('inactive');
  const [inactiveDays, setInactiveDays] = useState<number | string>(30);
  const [audienceCount, setAudienceCount] = useState<number | null>(null);
  const [audienceLoading, setAudienceLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{sent_count: number, failed_count: number} | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSavingDays, setIsSavingDays] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [campaignError, setCampaignError] = useState<string | null>(null);
  const [showPlans, setShowPlans] = useState(false);

  const handleSaveInactiveDays = async () => {
    if (inactiveDays === '') {
      setFeedback({ type: 'error', text: 'Please enter a valid number of days.' });
      return;
    }
    setIsSavingDays(true);
    try {
      await updateSettings({ campaign_inactive_days: Number(inactiveDays) });
      setFeedback({ type: 'success', text: 'Inactivity period updated!' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      console.error(error);
      setFeedback({ type: 'error', text: 'Failed to update inactivity period.' });
    } finally {
      setIsSavingDays(false);
    }
  };

  useEffect(() => {
    getSettings().then(data => {
      setInactiveDays(data.campaign_inactive_days);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    let active = true;
    const fetchCount = async () => {
      setAudienceLoading(true);
      try {
        const data = await getCampaignAudienceCount(audience, audience === 'inactive' ? Number(inactiveDays) : undefined);
        if (active) setAudienceCount(data.count);
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setAudienceLoading(false);
      }
    };
    
    // Add small debounce if typing inactive days
    const timer = setTimeout(fetchCount, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [audience, inactiveDays]);

  const handleLaunchClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setCampaignError(null);
    setShowConfirmModal(true);
  };

  const confirmSend = async () => {
    setLoading(true);
    setResult(null);
    setCampaignError(null);
    setShowConfirmModal(false);
    try {
      const res = await createCampaign({ 
        message, 
        audience_type: audience,
        inactive_days: audience === 'inactive' ? Number(inactiveDays) : undefined
      });
      setResult(res);
      setMessage('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setCampaignError(err.message || err.response?.data?.detail || 'Failed to send campaign. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!hasFeatureAccess('campaigns')) {
    return (
      <div className="py-12 text-center bg-white rounded-3xl border border-stone-200/60 shadow-card p-6 flex flex-col items-center justify-center gap-4 animate-fade-in max-w-2xl mx-auto mt-10">
        <div className="h-14 w-14 bg-stone-50 text-stone-400 rounded-2xl flex items-center justify-center border border-stone-200/60 shadow-sm animate-bounce">
          <Lock className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-stone-900">SMS Campaigns are Gated</h3>
          <p className="text-sm text-stone-500 max-w-sm mt-1 mx-auto">Upgrade to the Growth plan to unlock manual text campaigns, VIP segmentation, and custom SMS templates.</p>
        </div>
        <Button onClick={() => setShowPlans(true)} className="mt-2 shadow-sm shadow-brand-500/20">
          View Subscription Plans
        </Button>
        {showPlans && <SubscriptionPlansModal onClose={() => setShowPlans(false)} />}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <header>
        <h1 className="text-2xl font-extrabold text-stone-900">Campaigns</h1>
        <p className="text-stone-500">Send bulk SMS messages to your customers.</p>
      </header>

      <form onSubmit={handleLaunchClick} className="space-y-6">
        <Card className="p-5 space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-stone-700 mb-2">
              <Users className="h-4 w-4 text-stone-400" />
              Target Audience
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setAudience('inactive')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  audience === 'inactive' 
                    ? 'border-brand-500 bg-brand-50 text-brand-700' 
                    : 'border-stone-100 bg-white text-stone-500 hover:border-stone-200'
                }`}
              >
                <span className="font-bold">Inactive</span>
                <span className="text-xs uppercase font-bold opacity-70">Customers</span>
              </button>
              <button
                type="button"
                onClick={() => setAudience('all')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  audience === 'all' 
                    ? 'border-brand-500 bg-brand-50 text-brand-700' 
                    : 'border-stone-100 bg-white text-stone-500 hover:border-stone-200'
                }`}
              >
                <span className="font-bold">All</span>
                <span className="text-xs uppercase font-bold opacity-70">Customers</span>
              </button>
              <button
                type="button"
                onClick={() => setAudience('vip')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  audience === 'vip' 
                    ? 'border-brand-500 bg-brand-50 text-brand-700' 
                    : 'border-stone-100 bg-white text-stone-500 hover:border-stone-200'
                }`}
              >
                <span className="font-bold">VIP</span>
                <span className="text-xs uppercase font-bold opacity-70">Spenders</span>
              </button>
              <button
                type="button"
                onClick={() => setAudience('reward_near')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  audience === 'reward_near' 
                    ? 'border-brand-500 bg-brand-50 text-brand-700' 
                    : 'border-stone-100 bg-white text-stone-500 hover:border-stone-200'
                }`}
              >
                <span className="font-bold">Near Reward</span>
                <span className="text-xs uppercase font-bold opacity-70">Milestones</span>
              </button>
              <button
                type="button"
                onClick={() => setAudience('at_risk')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  audience === 'at_risk' 
                    ? 'border-red-500 bg-red-50 text-red-700' 
                    : 'border-stone-100 bg-white text-stone-500 hover:border-stone-200'
                }`}
              >
                <span className="font-bold">At Risk</span>
                <span className="text-xs uppercase font-bold opacity-70">30-90 Days</span>
              </button>
            </div>
            
            {audience === 'inactive' && (
              <div className="mt-3 flex items-center justify-between bg-stone-50 px-4 py-2.5 rounded-lg border border-stone-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-stone-500">Inactivity period:</span>
                  <input
                    type="number"
                    value={inactiveDays}
                    onChange={(e) => {
                      const val = e.target.value;
                      setInactiveDays(val === '' ? '' : Number(val));
                    }}
                    onBlur={() => {
                      if (typeof inactiveDays === 'number' && inactiveDays > 365) setInactiveDays(365);
                      if (typeof inactiveDays === 'number' && inactiveDays < 1) setInactiveDays(1);
                    }}
                    className="w-16 rounded border border-stone-200 px-2 py-1 text-sm font-bold text-stone-900 focus:border-brand-500 outline-none"
                    min="1"
                    max="365"
                  />
                  <span className="text-xs font-medium text-stone-500">days</span>
                </div>
                <button
                  onClick={handleSaveInactiveDays}
                  disabled={isSavingDays}
                  className="text-xs font-bold uppercase tracking-wider text-brand-600 hover:text-brand-700 disabled:opacity-50"
                >
                  {isSavingDays ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
            
            <div className="mt-4 p-3 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center justify-between">
              <span className="text-sm font-bold text-blue-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                Estimated Audience:
              </span>
              <span className="text-sm font-black text-blue-700">
                {audienceLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin inline-block" />
                ) : audienceCount !== null ? (
                  `${audienceCount} customers`
                ) : (
                  '--'
                )}
              </span>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-stone-700 mb-2">
              <Megaphone className="h-4 w-4 text-stone-400" />
              Message Content
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              required
              rows={4}
              className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm font-medium outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
              placeholder="Hi {name}, we miss you at Bowie Fusion!..."
            />
            <p className="text-xs text-stone-500 mt-2 flex justify-between">
              <span>Use <code className="bg-stone-100 px-1 py-0.5 rounded font-bold text-brand-600">{'{name}'}</code> to personalize.</span>
              <span className={message.length > 160 ? "text-orange-500 font-bold" : ""}>
                {message.length} chars ({Math.max(1, Math.ceil(message.length / 160))} SMS segment{Math.ceil(message.length / 160) > 1 ? 's' : ''})
              </span>
            </p>
          </div>

          {campaignError && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100 flex items-center gap-2 text-left">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {campaignError}
            </div>
          )}

          <Button 
            type="submit" 
            disabled={loading || !message.trim()}
            fullWidth
            className="gap-2"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {loading ? 'Sending Campaign...' : 'Launch Campaign'}
          </Button>
        </Card>
      </form>

      {result && (
        <Card className="bg-green-50/50 border-green-100 p-5 animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-2 text-green-700 mb-3">
            <CheckCircle2 className="h-5 w-5" />
            <h3 className="font-bold">Campaign Complete</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded-xl border border-green-100 shadow-sm">
              <p className="text-xs font-bold uppercase text-stone-400">Successfully Sent</p>
              <p className="text-xl font-black text-green-600">{result.sent_count}</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-green-100 shadow-sm">
              <p className="text-xs font-bold uppercase text-stone-400">Delivery Failures</p>
              <p className="text-xl font-black text-red-500">{result.failed_count}</p>
            </div>
          </div>
        </Card>
      )}

      {success && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-full shadow-lg animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-sm font-bold">Campaign launched successfully</span>
        </div>
      )}


      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Campaign Launch"
        footer={
          <div className="flex items-center gap-3 w-full justify-end">
            <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
              Cancel
            </Button>
            <Button onClick={confirmSend}>
              Yes, Launch Campaign
            </Button>
          </div>
        }
      >
        <div className="flex flex-col items-center text-center gap-4">
          <div className="h-16 w-16 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center">
            <Megaphone className="h-8 w-8" />
          </div>
          <div>
            <p className="text-stone-900 font-bold text-lg">Send to {audience === 'all' ? 'All Customers' : audience === 'vip' ? 'VIP Spenders' : audience === 'inactive' ? `Inactive (${inactiveDays} days)` : audience === 'at_risk' ? 'At Risk' : 'Near Reward'}?</p>
            <p className="text-stone-500 mt-2 text-sm max-w-sm mx-auto">
              This will queue SMS messages to be sent immediately. This action cannot be undone and will consume Twilio credits.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

