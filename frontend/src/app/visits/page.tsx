'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Receipt, RefreshCw, Search } from 'lucide-react';
import VisitCard from '@/components/VisitCard';
import { getDashboard, DashboardResponse } from '@/lib/api';
import { StoredVisit } from '@/lib/visits-store';

const PAGE_SIZE = 20;

export default function VisitsPage() {
  const [visits, setVisits] = useState<StoredVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setIsLoading(true);
    getDashboard()
      .then((data: DashboardResponse) => {
        const mapped = data.recent_visits.map((v) => ({
          id: `${v.phone_number}-${v.visited_at}`,
          phoneNumber: v.phone_number,
          name: v.customer_name,
          amount: v.amount,
          visitedAt: v.visited_at,
        }));
        setVisits(mapped);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  // Simple client-side search
  const filtered = searchTerm.trim()
    ? visits.filter(
        (v) =>
          v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.phoneNumber.includes(searchTerm)
      )
    : visits;

  const displayed = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  };

  return (
    <div className="animate-fade-in space-y-5 pb-6 sm:space-y-6">
      {/* Header */}
      <header className="flex items-center gap-3">
        <Link
          href="/"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 shadow-soft transition-all hover:bg-stone-50 hover:text-stone-700 active:scale-95"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">
            History
          </p>
          <h1 className="text-xl font-extrabold tracking-tight text-stone-900 sm:text-2xl">
            All Visits
          </h1>
        </div>
      </header>

      {/* Search */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-stone-400">
          <Search className="h-4 w-4" aria-hidden="true" />
        </div>
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setVisibleCount(PAGE_SIZE);
          }}
          className="block w-full rounded-2xl border border-stone-200 bg-white py-3 pl-10 pr-4 text-sm font-medium text-stone-900 outline-none transition-all placeholder:text-stone-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
        />
      </div>

      {/* Visit List */}
      <div className="rounded-3xl border border-stone-200/60 bg-white shadow-card">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="h-5 w-5 animate-spin text-stone-400" aria-hidden="true" />
            <span className="ml-2 text-sm font-medium text-stone-500">Loading visits...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
              <Receipt className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="mt-3 text-sm font-semibold text-stone-700">
              {searchTerm ? 'No matching visits' : 'No visits yet'}
            </p>
            <p className="mt-1 text-xs text-stone-500">
              {searchTerm
                ? 'Try a different search term.'
                : 'Visits will appear here once you start adding them.'}
            </p>
          </div>
        ) : (
          <>
            {/* Table Header — desktop only */}
            <div className="hidden border-b border-stone-100 px-5 py-3 sm:flex sm:items-center sm:gap-3">
              <span className="w-10" />
              <span className="min-w-0 flex-1 text-xs font-semibold uppercase tracking-wider text-stone-400">
                Customer
              </span>
              <span className="w-28 text-right text-xs font-semibold uppercase tracking-wider text-stone-400">
                Amount / Time
              </span>
            </div>

            <ul className="divide-y divide-stone-100">
              {displayed.map((visit) => (
                <li key={visit.id}>
                  <VisitCard visit={visit} />
                </li>
              ))}
            </ul>

            {/* Load More */}
            {hasMore && (
              <div className="border-t border-stone-100 px-4 py-3 sm:px-5">
                <button
                  onClick={handleLoadMore}
                  className="w-full rounded-2xl py-2.5 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
                >
                  Show more ({filtered.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Stats footer */}
      {!isLoading && filtered.length > 0 && (
        <p className="text-center text-xs font-medium text-stone-400">
          Showing {Math.min(visibleCount, filtered.length)} of {filtered.length} visits
        </p>
      )}
    </div>
  );
}
