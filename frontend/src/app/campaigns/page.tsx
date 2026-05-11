'use client';
import { useState } from 'react';
import { createCampaign } from '@/lib/api';

export default function CampaignsPage() {
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('inactive');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{sent_count: number, failed_count: number} | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await createCampaign({ message, audience_type: audience });
      setResult(res);
      setMessage('');
    } catch (err) {
      alert('Failed to send campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold text-stone-900">Campaigns</h1>
        <p className="text-stone-500">Send bulk SMS messages to your customers.</p>
      </header>

      <form onSubmit={handleSend} className="space-y-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <label className="block text-sm font-bold text-stone-700 mb-1">Audience</label>
          <select 
            value={audience} 
            onChange={e => setAudience(e.target.value)}
            className="w-full rounded-xl border border-stone-300 px-4 py-3 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          >
            <option value="inactive">Inactive Customers (No visits in 30 days)</option>
            <option value="all">All Customers</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-stone-700 mb-1">Message</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            required
            rows={4}
            className="w-full rounded-xl border border-stone-300 px-4 py-3 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            placeholder="Hi {name}, we miss you at Bowie Fusion!..."
          />
          <p className="text-xs text-stone-500 mt-1">Use {'{name}'} to insert the customer&apos;s name.</p>
        </div>

        <button 
          type="submit" 
          disabled={loading || !message.trim()}
          className="w-full rounded-xl bg-brand-600 px-4 py-3 font-bold text-white transition-all hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Campaign'}
        </button>
      </form>

      {result && (
        <div className="bg-green-50 text-green-800 p-4 rounded-xl border border-green-200">
          <h3 className="font-bold">Campaign Complete</h3>
          <p>Sent: {result.sent_count}</p>
          <p>Failed: {result.failed_count}</p>
        </div>
      )}
    </div>
  );
}
