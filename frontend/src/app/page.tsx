'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Plus, Repeat2, UsersRound, Utensils } from 'lucide-react';
import ActivityList from '@/components/ActivityList';
import StatCard from '@/components/StatCard';
import { calculateVisitStats, getStoredVisits, StoredVisit } from '@/lib/visits-store';

export default function Dashboard() {
  const [visits, setVisits] = useState<StoredVisit[]>([]);

  useEffect(() => {
    setVisits(getStoredVisits());
  }, []);

  const stats = useMemo(() => calculateVisitStats(visits), [visits]);

  return (
    <div className="flex min-h-screen flex-col px-4 pb-6 pt-5 sm:min-h-0">
      <header className="rounded-[2rem] bg-gradient-to-br from-brand-600 via-brand-500 to-orange-400 p-5 text-white shadow-lift">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-white/75">TableBoost</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">Quick billing desk</h1>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/18 ring-1 ring-white/25">
            <Utensils className="h-6 w-6" aria-hidden="true" />
          </div>
        </div>
        <p className="mt-4 max-w-[18rem] text-sm font-semibold leading-6 text-white/88">
          Add customers in seconds and see the pulse of today&apos;s restaurant visits.
        </p>
      </header>

      <section className="-mt-3 grid grid-cols-3 gap-2.5" aria-label="Business stats">
        <StatCard label="Customers" value={stats.totalCustomers} icon={<UsersRound className="h-5 w-5" />} />
        <StatCard label="Visits" value={stats.totalVisits} icon={<Utensils className="h-5 w-5" />} accent="slate" />
        <StatCard label="Repeat" value={stats.repeatCustomers} icon={<Repeat2 className="h-5 w-5" />} accent="green" />
      </section>

      <section className="mt-5" aria-label="Primary actions">
        <Link
          href="/add-visit"
          className="inline-flex min-h-[64px] w-full items-center justify-center rounded-3xl bg-brand-600 px-5 py-3 text-xl font-extrabold tracking-tight text-white shadow-lift transition-all hover:bg-brand-700 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-brand-200"
          aria-label="Add Visit"
        >
          <Plus className="mr-2 h-6 w-6" aria-hidden="true" /> Add Visit
        </Link>
        <p className="mt-3 text-center text-sm font-semibold text-slate-500">Optimized for one-hand use at checkout.</p>
      </section>

      <section className="mt-6 flex-1">
        <ActivityList visits={visits} />
      </section>
    </div>
  );
}
