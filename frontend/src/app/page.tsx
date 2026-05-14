'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Plus, Repeat2, UsersRound, Utensils, RefreshCw, Trophy } from 'lucide-react';
import ActivityList from '@/components/ActivityList';
import StatCard from '@/components/StatCard';
import { getDashboard, DashboardResponse } from '@/lib/api';

export default function Dashboard() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboard = () => {
    setIsLoading(true);
    getDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const stats = data
    ? {
        totalCustomers: data.total_customers,
        totalVisits: data.total_visits,
        repeatCustomers: data.repeat_customers,
        totalRedeemed: data.total_redeemed,
      }
    : {
        totalCustomers: 0,
        totalVisits: 0,
        repeatCustomers: 0,
        totalRedeemed: 0,
      };

  const visits =
    data?.recent_visits.map((v) => ({
      id: `${v.phone_number}-${v.visited_at}`,
      phoneNumber: v.phone_number,
      name: v.customer_name,
      amount: v.amount,
      visitedAt: v.visited_at,
    })) || [];

  return (
    <div className="animate-fade-in space-y-5 pb-6 sm:space-y-6">
      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">
            TableBoost
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
            Quick Billing Desk
          </h1>
          <p className="mt-1.5 text-sm font-medium text-stone-500">
            Add customers in seconds and track today&apos;s activity.
          </p>
        </div>
        <button
          onClick={fetchDashboard}
          disabled={isLoading}
          className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 shadow-soft transition-all hover:bg-stone-50 hover:text-stone-700 active:scale-95 disabled:opacity-50"
          aria-label="Refresh dashboard"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
        </button>
      </header>

      {/* Stats Grid — responsive: 1 col mobile, 3 col desktop */}
      <section
        className={`grid grid-cols-2 gap-3 lg:grid-cols-4 sm:gap-4 ${isLoading ? 'animate-pulse-soft' : ''}`}
        aria-label="Business stats"
      >
        <StatCard
          label="Customers"
          value={stats.totalCustomers}
          icon={<UsersRound className="h-4 w-4" />}
        />
        <StatCard
          label="Total Visits"
          value={stats.totalVisits}
          icon={<Utensils className="h-4 w-4" />}
          accent="slate"
        />
        <StatCard
          label="Repeat"
          value={stats.repeatCustomers}
          icon={<Repeat2 className="h-4 w-4" />}
          accent="green"
        />
        <StatCard
          label="Redeemed"
          value={stats.totalRedeemed}
          icon={<Trophy className="h-4 w-4" />}
          accent="orange"
        />
      </section>

      {/* Primary Action — full width mobile, constrained desktop */}
      <section aria-label="Primary actions">
        <Link
          href="/add-visit"
          className="group flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-6 py-3.5 text-base font-bold text-white shadow-lift transition-all duration-150 hover:bg-brand-700 hover:shadow-lg active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:ring-offset-2 sm:w-auto sm:px-8"
          aria-label="Add Visit"
        >
          <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" aria-hidden="true" />
          Add Visit
        </Link>
      </section>

      {/* Recent Activity */}
      <section aria-label="Recent activity">
        <ActivityList visits={visits} />
      </section>
    </div>
  );
}
