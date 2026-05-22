'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Receipt, RefreshCw, Search, SlidersHorizontal, Calendar, DollarSign, X, ChevronUp, ChevronDown } from 'lucide-react';
import VisitCard from '@/components/VisitCard';
import { getVisits, VisitDetail } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import VisitListItem from '@/components/ui/VisitListItem';
import { ListItemSkeleton } from '@/components/ui/Skeleton';
import { useSearchParams, usePathname } from 'next/navigation';

const PAGE_SIZE = 20;

type SortKey = 'name' | 'amount' | 'visited_at';
type SortOrder = 'asc' | 'desc';

export default function VisitsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const [visits, setVisits] = useState<VisitDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Filter States - Initialize from URL
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [startDate, setStartDate] = useState(searchParams.get('start_date') || '');
  const [endDate, setEndDate] = useState(searchParams.get('end_date') || '');
  const [minAmount, setMinAmount] = useState(searchParams.get('min_amount') || '');
  const [maxAmount, setMaxAmount] = useState(searchParams.get('max_amount') || '');
  
  // Sort States
  const [sortKey, setSortKey] = useState<SortKey>((searchParams.get('sort_by') as SortKey) || 'visited_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>((searchParams.get('sort_order') as SortOrder) || 'desc');
  
  const hasActiveFilters = Boolean(
    searchParams.get('start_date') || searchParams.get('end_date') || 
    searchParams.get('min_amount') || searchParams.get('max_amount')
  );
  const [showFilters, setShowFilters] = useState(hasActiveFilters);
  
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Sync state to URL without reloading
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);
    if (minAmount) params.set('min_amount', minAmount);
    if (maxAmount) params.set('max_amount', maxAmount);
    if (sortKey && sortKey !== 'visited_at') params.set('sort_by', sortKey);
    if (sortOrder && sortOrder !== 'desc') params.set('sort_order', sortOrder);

    const newUrl = `${pathname}?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  }, [search, startDate, endDate, minAmount, maxAmount, sortKey, sortOrder, pathname, router]);

  const fetchVisits = useCallback(async (isLoadMore = false) => {
    if (isLoadMore) setIsLoadingMore(true);
    else setIsLoading(true);

    try {
      const currentSkip = isLoadMore ? skip : 0;
      const data = await getVisits({
        skip: currentSkip,
        limit: PAGE_SIZE,
        search: search.trim() || undefined,
        start_date: startDate ? `${startDate}T00:00:00` : undefined,
        end_date: endDate ? `${endDate}T23:59:59` : undefined,
        min_amount: minAmount ? Number(minAmount) : undefined,
        max_amount: maxAmount ? Number(maxAmount) : undefined,
        sort_by: sortKey,
        sort_order: sortOrder,
      });

      if (isLoadMore) {
        setVisits((prev) => [...prev, ...data]);
        setSkip(currentSkip);
      } else {
        setVisits(data);
        setSkip(0);
      }
      
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      console.error('Failed to fetch visits:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [search, startDate, endDate, minAmount, maxAmount, skip, sortKey, sortOrder]);

  const loadingRef = useRef(false);
  loadingRef.current = isLoading || isLoadingMore;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
          setSkip(prev => prev + 20);
        }
      },
      { threshold: 0.1 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, visits.length]);

  useEffect(() => {
    if (skip > 0) {
      fetchVisits(true);
    }
  }, [skip, fetchVisits]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVisits();
    }, 400);
    return () => clearTimeout(timer);
  }, [search, startDate, endDate, minAmount, maxAmount, sortKey, sortOrder, fetchVisits]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setMaxAmount('');
    setShowFilters(false);
  };

  const activeFiltersCount = [startDate, endDate, minAmount, maxAmount].filter(Boolean).length;

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return null;
    return sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  return (
    <div className="animate-fade-in space-y-5 pb-6 sm:space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {searchParams.has('q') && (
            <button
              onClick={() => router.back()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 shadow-soft transition-all hover:bg-stone-50 hover:text-stone-700 active:scale-95"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">
              History
            </p>
            <h1 className="text-xl font-extrabold tracking-tight text-stone-900 sm:text-2xl">
              Visit Records
            </h1>
          </div>
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`relative flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-bold transition-all active:scale-95 ${
            showFilters || activeFiltersCount > 0
              ? 'border-brand-200 bg-brand-50 text-brand-700'
              : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeFiltersCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-xs text-white">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </header>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="animate-slide-up space-y-4 bg-stone-50/50 max-h-[70vh] overflow-y-auto sm:max-h-none sm:overflow-visible">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900">Advanced Filters</h3>
            <button onClick={clearFilters} className="text-xs font-bold text-brand-600 hover:underline">
              Reset All
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">From Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-9 pr-3 text-sm font-semibold outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">To Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-9 pr-3 text-sm font-semibold outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Min Spent</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
                <input
                  type="number"
                  min="0"
                  placeholder="0.00"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-9 pr-3 text-sm font-semibold outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Max Spent</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
                <input
                  type="number"
                  min="0"
                  placeholder="Any"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-9 pr-3 text-sm font-semibold outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Main Search */}
      <div className="relative group">
        <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-stone-400 group-focus-within:text-brand-500 transition-colors">
          <Search className="h-5 w-5" aria-hidden="true" />
        </div>
        <input
          type="text"
          placeholder="Search by name or phone number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="block w-full rounded-2xl border border-stone-200 bg-white py-4 pl-12 pr-4 text-base font-semibold text-stone-900 shadow-soft outline-none transition-all placeholder:text-stone-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
        />
        {search && (
          <button 
            onClick={() => setSearch('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Visit List */}
      <div className="rounded-3xl border border-stone-200/60 bg-white shadow-card overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map(i => <ListItemSkeleton key={i} />)}
          </div>
        ) : visits.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 text-stone-300">
              <Receipt className="h-8 w-8" aria-hidden="true" />
            </div>
            <p className="mt-4 text-base font-bold text-stone-700">No visits found</p>
            <p className="mt-1 text-sm text-stone-500 max-w-xs mx-auto">
              Try adjusting your filters or search criteria.
            </p>
            <Button variant="secondary" className="mt-6" onClick={clearFilters}>
              Clear All Filters
            </Button>
          </div>
        ) : (
          <>
            {/* Table Header — desktop only */}
            <div className="hidden border-b border-stone-100 bg-stone-50/50 px-6 py-3 sm:flex sm:items-center sm:gap-3">
              <span className="w-10" />
              <button 
                onClick={() => toggleSort('name')}
                className="min-w-0 flex-1 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-stone-500 hover:text-brand-600 transition-colors"
              >
                Customer Details
                <SortIcon k="name" />
              </button>
              <button 
                onClick={() => toggleSort('amount')}
                className="w-32 flex items-center justify-end gap-1 text-xs font-bold uppercase tracking-wider text-stone-500 hover:text-brand-600 transition-colors"
              >
                Amount
                <SortIcon k="amount" />
              </button>
              <button 
                onClick={() => toggleSort('visited_at')}
                className="w-40 flex items-center justify-end gap-1 text-xs font-bold uppercase tracking-wider text-stone-500 hover:text-brand-600 transition-colors"
              >
                Visit Time
                <SortIcon k="visited_at" />
              </button>
            </div>

            <ul className="divide-y divide-stone-100">
              {visits.map((visit) => (
                <li key={visit.id} className="block transition-colors">
                  <VisitListItem visit={visit} isTable={true} />
                </li>
              ))}
            </ul>

            {/* Load More Indicator */}
            {hasMore && (
              <div ref={loaderRef} className="py-6 flex justify-center">
                <RefreshCw className="h-6 w-6 animate-spin text-brand-400" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Results Count */}
      {!isLoading && visits.length > 0 && (
        <p className="text-center text-xs font-bold text-stone-400">
          Showing {visits.length} records • Sorted by {sortKey.replace('_', ' ')}
        </p>
      )}
    </div>
  );
}
