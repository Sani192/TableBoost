'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createCampaign, getSettings, updateSettings } from '@/lib/api';
import { Megaphone, Users, Send, CheckCircle2, Settings as SettingsIcon } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

type Feedback = { type: 'success' | 'error', text: string } | null;

export default function CampaignsPage() {
  const [audience, setAudience] = useState('inactive');
  const [inactiveDays, setInactiveDays] = useState<number | string>(30);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{sent_count: number, failed_count: number} | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSavingDays, setIsSavingDays] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
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
    } catch (err) {
      alert('Failed to send campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <header>
        <h1 className="text-2xl font-extrabold text-stone-900">Campaigns</h1>
        <p className="text-stone-500">Send bulk SMS messages to your customers.</p>
      </header>

      <form onSubmit={handleSend} className="space-y-6">
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
                <span className="text-[10px] uppercase font-bold opacity-70">Customers</span>
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
                <span className="text-[10px] uppercase font-bold opacity-70">Customers</span>
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
                <span className="text-[10px] uppercase font-bold opacity-70">Spenders</span>
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
                <span className="text-[10px] uppercase font-bold opacity-70">Milestones</span>
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
                <span className="text-[10px] uppercase font-bold opacity-70">30-90 Days</span>
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
                    className="w-16 rounded border border-stone-200 px-2 py-1 text-sm font-bold text-stone-900 focus:border-brand-500 outline-none"
                    min="1"
                  />
                  <span className="text-xs font-medium text-stone-500">days</span>
                </div>
                <button
                  onClick={handleSaveInactiveDays}
                  disabled={isSavingDays}
                  className="text-[10px] font-bold uppercase tracking-wider text-brand-600 hover:text-brand-700 disabled:opacity-50"
                >
                  {isSavingDays ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
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
            <p className="text-xs text-stone-500 mt-2">
              Use <code className="bg-stone-100 px-1 py-0.5 rounded font-bold text-brand-600">{'{name}'}</code> to personalize.
            </p>
          </div>

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
              <p className="text-[10px] font-bold uppercase text-stone-400">Successfully Sent</p>
              <p className="text-xl font-black text-green-600">{result.sent_count}</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-green-100 shadow-sm">
              <p className="text-[10px] font-bold uppercase text-stone-400">Delivery Failures</p>
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
    </div>
  );
}

// Helper component for animation (not strictly necessary but adds polish)
function RefreshCw({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
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
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}
