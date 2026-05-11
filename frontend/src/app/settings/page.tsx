'use client';
import { useEffect, useState } from 'react';
import { getSettings, updateSettings } from '@/lib/api';
import { MessageSquare, Megaphone, Save, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function SettingsPage() {
  const [template, setTemplate] = useState('');
  const [inactiveDays, setInactiveDays] = useState<number | string>(30);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSettings().then(data => {
      setTemplate(data.review_message_template);
      setInactiveDays(data.campaign_inactive_days);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
      setError('Failed to load settings');
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      const res = await updateSettings({ 
        review_message_template: template,
        campaign_inactive_days: Number(inactiveDays)
      });
      setTemplate(res.review_message_template);
      setInactiveDays(res.campaign_inactive_days);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-stone-200 rounded-lg"></div>
        <div className="h-64 bg-stone-100 rounded-2xl"></div>
        <div className="h-48 bg-stone-100 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-10">
      <header>
        <h1 className="text-2xl font-extrabold text-stone-900">Settings</h1>
        <p className="text-stone-500">Configure your restaurant engagement preferences.</p>
      </header>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Messaging Settings */}
        <Card className="overflow-hidden">
          <div className="border-b border-stone-100 bg-stone-50/50 px-5 py-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-brand-600" />
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider">Messaging Settings</h2>
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
                placeholder="Hi {name}, please leave us a review..."
              />
              <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                Automatically sent after a visit. You can use variables like <code className="bg-stone-100 px-1 py-0.5 rounded font-bold text-brand-600">{'{name}'}</code>.
              </p>
            </div>
          </div>
        </Card>

        {/* Campaign Preferences */}
        <Card className="overflow-hidden">
          <div className="border-b border-stone-100 bg-stone-50/50 px-5 py-3 flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-brand-600" />
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider">Campaign Preferences</h2>
          </div>
          
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1.5">Default Inactive Customer Days</label>
              <div className="relative max-w-[120px]">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={inactiveDays}
                  onChange={e => setInactiveDays(e.target.value)}
                  required
                  className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm font-bold outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
                />
              </div>
              <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                Customers with no visits within these days are considered inactive for campaigns.
              </p>
            </div>
          </div>
        </Card>

        <div className="sticky bottom-6 flex flex-col items-center">
          <Button 
            type="submit" 
            disabled={saving || !template.trim() || !inactiveDays || Number(inactiveDays) < 1}
            size="lg"
            className="shadow-lg shadow-brand-600/20 gap-2 min-w-[200px]"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Save All Changes'}
          </Button>

          {success && (
            <div className="mt-3 flex items-center gap-1.5 text-green-600 animate-in fade-in slide-in-from-bottom-2">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-bold">Settings updated!</span>
            </div>
          )}

          {error && (
            <div className="mt-3 flex items-center gap-1.5 text-red-600 animate-in fade-in slide-in-from-bottom-2">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-bold">{error}</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
