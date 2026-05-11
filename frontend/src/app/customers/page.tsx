'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCustomers, CustomerListResponse } from '@/lib/api';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerListResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCustomers().then(setCustomers).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold text-stone-900">Customers</h1>
      </header>
      
      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-stone-100 rounded-xl"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {customers.map(c => (
            <Link key={c.id} href={`/customers/${c.id}`} className="block bg-white p-4 rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-stone-900">{c.name || 'Unknown'}</h3>
                  <p className="text-sm text-stone-500">{c.phone_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-brand-600">{c.total_visits} visits</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
