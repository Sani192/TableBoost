'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getSettings, 
  updateSettings
} from '@/lib/api';
import { 
  MessageSquare, 
  Save, 
  CheckCircle2, 
  Loader2
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Secure route guard
  useEffect(() => {
    if (user && user.role !== 'OWNER') {
      router.replace('/');
    }
  }, [user, router]);

  const [template, setTemplate] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const settingsData = await getSettings();
      setTemplate(settingsData.review_message_template);
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
        <h1 className="text-2xl font-extrabold text-stone-900">Settings</h1>
        <p className="text-stone-500">Manage global restaurant configuration.</p>
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

      {success && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-full shadow-lg animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-sm font-bold">Settings updated successfully</span>
        </div>
      )}
    </div>
  );
}
