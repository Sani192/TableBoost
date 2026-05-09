'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileNumberInput from '@/components/MobileNumberInput';
import { addVisit } from '@/lib/api';

export default function AddVisitPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [sendSms, setSendSms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length < 10) {
      setMessage({ type: 'error', text: 'Please enter a valid 10-digit phone number' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const result = await addVisit({
        phone_number: phoneNumber,
        name: name || undefined,
        amount: amount ? parseFloat(amount) : undefined,
        send_sms: sendSms,
      });

      setMessage({ 
        type: 'success', 
        text: `Visit recorded! SMS status: ${result.sms_status}` 
      });
      
      // Clear form on success
      setPhoneNumber('');
      setName('');
      setAmount('');
      setSendSms(true);
      
      // Navigate back to dashboard after a short delay
      setTimeout(() => {
        router.push('/');
      }, 2000);

    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Something went wrong' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-4">
      <header className="mb-8">
        <button 
          onClick={() => router.push('/')}
          className="text-blue-600 font-medium flex items-center mb-4"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Add New Visit</h1>
        <p className="text-gray-500">Quickly record a customer visit.</p>
      </header>

      <main className="flex-1">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          
          <MobileNumberInput 
            value={phoneNumber} 
            onChange={setPhoneNumber} 
            autoFocus 
          />

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Customer Name (Optional)
            </label>
            <input
              type="text"
              id="name"
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
            />
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Bill Amount (Optional)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-gray-500">$</span>
              <input
                type="number"
                id="amount"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="block w-full pl-8 pr-4 py-3 text-gray-900 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
              />
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <label htmlFor="sendSms" className="text-sm font-medium text-gray-700">
              Send Review SMS
            </label>
            <button
              type="button"
              id="sendSms"
              role="switch"
              aria-checked={sendSms}
              onClick={() => setSendSms(!sendSms)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                sendSms ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  sendSms ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {message && (
            <div className={`p-4 rounded-xl text-sm font-medium ${
              message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
            }`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || phoneNumber.length < 10}
            className={`w-full py-4 px-6 rounded-xl text-lg font-bold text-white shadow-lg transition-all ${
              isLoading || phoneNumber.length < 10
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
            }`}
          >
            {isLoading ? 'Processing...' : 'Save Visit'}
          </button>
        </form>
      </main>
    </div>
  );
}
