'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import MobileNumberInput from '@/components/MobileNumberInput';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { addVisit, getCustomers, getCustomerDetail } from '@/lib/api';

type Feedback = { type: 'success' | 'error'; text: string } | null;

interface AddVisitFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  customerId?: number;
}

export default function AddVisitForm({ onSuccess, onCancel, customerId }: AddVisitFormProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [sendSms, setSendSms] = useState(true);
  const [birthday, setBirthday] = useState('');
  const [anniversary, setAnniversary] = useState('');
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    if (customerId) {
      getCustomerDetail(customerId).then(res => {
        if (res.phone_number) setPhoneNumber(res.phone_number);
        if (res.name) setName(res.name);
      }).catch(console.error);
    }
  }, [customerId]);

  useEffect(() => {
    if (phoneNumber.length === 10) {
      getCustomers({ search: phoneNumber }).then(res => {
        const existing = res.find((c: any) => c.phone_number === phoneNumber);
        setIsNewCustomer(!existing);
        if (existing) {
          if (!name && existing.name) setName(existing.name);
        }
      }).catch(console.error);
    } else {
      setIsNewCustomer(false);
    }
  }, [phoneNumber]);

  const isPhoneValid = phoneNumber.length === 10;
  const isAmountValid = amount.trim() !== '' && !isNaN(Number(amount)) && Number(amount) > 0;
  const isFormValid = isPhoneValid && isAmountValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!isPhoneValid) {
      setFeedback({ type: 'error', text: 'Enter a 10-digit phone number.' });
      return;
    }

    if (!isAmountValid) {
      setFeedback({ type: 'error', text: 'Please enter an amount greater than $0.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const trimmedName = name.trim();
      const numericAmount = Number(amount);
      
      await addVisit({
        phone_number: phoneNumber,
        name: trimmedName || undefined,
        amount: numericAmount,
        send_sms: sendSms,
        birthday: birthday || undefined,
        anniversary: anniversary || undefined,
      });

      setFeedback({
        type: 'success',
        text: sendSms ? 'Visit saved — Review SMS queued!' : 'Visit saved successfully!',
      });
      
      // Reset form
      setPhoneNumber('');
      setName('');
      setAmount('');
      setSendSms(true);
      setBirthday('');
      setAnniversary('');
      
      if (onSuccess) {
        setTimeout(onSuccess, 1500); // Close after success message
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Could not save the visit. Please try again.';
      setFeedback({ type: 'error', text: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
      <Card className="space-y-5">
        <MobileNumberInput
          value={phoneNumber}
          onChange={setPhoneNumber}
          autoFocus
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input
            label="Name"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Optional"
            autoComplete="name"
            helperText="Skip if busy at checkout."
          />

          <Input
            label="Amount"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            leading="$"
            required
            helperText="Mandatory bill amount (must be > 0)."
          />
        </div>

        {isNewCustomer && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input
              label="Birthday"
              id="birthday"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              type="date"
              helperText="Optional"
            />
            <Input
              label="Anniversary"
              id="anniversary"
              value={anniversary}
              onChange={(e) => setAnniversary(e.target.value)}
              type="date"
              helperText="Optional"
            />
          </div>
        )}

        {/* SMS Toggle */}
        <div className="flex items-center justify-between rounded-2xl border border-stone-100 bg-stone-50 px-4 py-3.5">
          <div>
            <p className="text-sm font-semibold text-stone-800">Send Review SMS</p>
            <p className="text-xs font-medium text-stone-500">
              Ask for a Google review after visit
            </p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={sendSms}
              onChange={(e) => setSendSms(e.target.checked)}
            />
            <div className="peer h-6 w-11 rounded-full bg-stone-300 transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all after:content-[''] peer-checked:bg-brand-600 peer-checked:after:translate-x-full peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-500/30 peer-focus:ring-offset-2" />
          </label>
        </div>
      </Card>

      {/* Feedback */}
      {feedback && (
        <div
          role="status"
          className={`animate-slide-up flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {feedback.type === 'success' && (
            <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
          )}
          {feedback.text}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        <Button
          type="submit"
          fullWidth
          disabled={isSubmitting || !isFormValid}
          className="min-h-[52px] sm:w-auto sm:min-w-[180px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Saving...
            </>
          ) : (
            'Save Visit'
          )}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={onCancel}
            disabled={isSubmitting}
            className="sm:w-auto"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
