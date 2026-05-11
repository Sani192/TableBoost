'use client';
import { useEffect, useState } from 'react';
import { getSettings, updateSettings } from '@/lib/api';

export default function SettingsPage() {
  const [template, setTemplate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getSettings().then(data => {
      setTemplate(data.review_message_template);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      const res = await updateSettings({ review_message_template: template });
      setTemplate(res.review_message_template);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-32 bg-stone-200 rounded-lg"></div>
        <div className="h-40 bg-stone-100 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold text-stone-900">Settings</h1>
        <p className="text-stone-500">Manage your automated messaging templates.</p>
      </header>

      <form onSubmit={handleSave} className="space-y-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <label className="block text-sm font-bold text-stone-700 mb-1">Review SMS Template</label>
          <textarea
            value={template}
            onChange={e => setTemplate(e.target.value)}
            required
            rows={4}
            className="w-full rounded-xl border border-stone-300 px-4 py-3 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            placeholder="Hi {name}, please leave us a review..."
          />
          <p className="text-xs text-stone-500 mt-2">
            This message is sent automatically after a visit. You can use variables like <code className="bg-stone-100 px-1 py-0.5 rounded text-brand-600">{'{name}'}</code> to personalize the message.
          </p>
        </div>

        <button 
          type="submit" 
          disabled={saving || !template.trim()}
          className="w-full rounded-xl bg-brand-600 px-4 py-3 font-bold text-white transition-all hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>

        {success && (
          <p className="text-center text-sm font-bold text-green-600 mt-2">
            Settings saved successfully!
          </p>
        )}
      </form>
    </div>
  );
}
