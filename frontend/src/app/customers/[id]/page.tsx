'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getCustomerDetail, CustomerDetailResponse } from '@/lib/api';
import ActivityList from '@/components/ActivityList';
import StatCard from '@/components/StatCard';
import { Utensils, DollarSign } from 'lucide-react';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<CustomerDetailResponse | null>(null);

  useEffect(() => {
    if (id) {
      getCustomerDetail(Number(id)).then(setCustomer);
    }
  }, [id]);

  if (!customer) return <div className="animate-pulse h-40 bg-stone-100 rounded-xl"></div>;

  const visits = customer.visits.map(v => ({
    id: String(v.id),
    phoneNumber: customer.phone_number,
    name: customer.name,
    amount: v.amount,
    visitedAt: v.visited_at
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold text-stone-900">{customer.name || customer.phone_number}</h1>
        <p className="text-stone-500">{customer.phone_number}</p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Total Visits" value={customer.total_visits} icon={<Utensils className="h-4 w-4" />} />
        <StatCard label="Total Spent" value={`$${customer.total_spent || 0}`} icon={<DollarSign className="h-4 w-4" />} accent="green" />
      </section>

      <section>
        <h2 className="text-lg font-bold text-stone-900 mb-3">Visit History</h2>
        <ActivityList visits={visits} />
      </section>
    </div>
  );
}
