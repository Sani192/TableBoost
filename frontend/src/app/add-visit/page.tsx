'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import MobileNumberInput from '@/components/MobileNumberInput';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { addVisit } from '@/lib/api';
import { saveStoredVisit } from '@/lib/visits-store';

type Feedback = { type: 'success' | 'error'; text: string } | null;

export default function AddVisitPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const isPhoneValid = phoneNumber.length === 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!isPhoneValid) {
      setFeedback({ type: 'error', text: 'Enter a 10-digit phone number.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const trimmedName = name.trim();
      const numericAmount = amount ? Number(amount) : undefined;
      const result = await addVisit({
        phone_number: phoneNumber,
        name: trimmedName || undefined,
        amount: numericAmount,
        send_sms: true,
      });

      saveStoredVisit({
        id: String(result.id ?? `${Date.now()}-${phoneNumber}`),
        phoneNumber,
        name: trimmedName || undefined,
        amount: numericAmount,
        visitedAt: result.visited_at ?? new Date().toISOString(),
        smsStatus: result.sms_status ?? 'queued',
      });

      setFeedback({ type: 'success', text: 'Visit saved. Review SMS queued.' });
      setPhoneNumber('');
      setName('');
      setAmount('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save the visit. Please try again.';
      setFeedback({ type: 'error', text: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col px-4 pb-5 pt-4 sm:min-h-0">
      <header className="flex items-center gap-3 pb-4">
        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="min-h-[46px] rounded-2xl px-3"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Button>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-600">Add Visit</p>
          <h1 className="text-3xl font-black tracking-tight text-slate-950">Save in seconds</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4">
        <Card className="space-y-5 p-5">
          <MobileNumberInput value={phoneNumber} onChange={setPhoneNumber} autoFocus />

          <Input
            label="Name"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Optional"
            autoComplete="name"
            helperText="Skip if the cashier is in a rush."
          />

          <Input
            label="Amount"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder="0.00"
            leading="$"
            helperText="Optional bill amount."
          />
        </Card>

        {feedback && (
          <div
            role="status"
            className={`flex items-center gap-3 rounded-3xl border px-4 py-3 text-sm font-extrabold shadow-sm ${
              feedback.type === 'success'
                ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                : 'border-red-100 bg-red-50 text-red-700'
            }`}
          >
            {feedback.type === 'success' && <CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
            {feedback.text}
          </div>
        )}

        <div className="mt-auto space-y-3 rounded-[2rem] border border-white/80 bg-white/90 p-3 shadow-soft backdrop-blur">
          <Button type="submit" fullWidth disabled={isSubmitting || !isPhoneValid} className="min-h-[64px] rounded-3xl text-xl">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" /> Saving...
              </>
            ) : (
              'Save Visit'
            )}
          </Button>
          <Button type="button" variant="secondary" fullWidth onClick={() => router.push('/')} disabled={isSubmitting}>
            Back
          </Button>
        </div>
      </form>
    </div>
  );
}
