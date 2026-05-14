'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { getCustomers, CustomerListResponse } from '@/lib/api';
import { Search, SlidersHorizontal, RefreshCw, X, Cake, Heart, PartyPopper } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Card from '@/components/ui/Card';

const PAGE_SIZE = 20;

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [minVisits, setMinVisits] = useState('');
  const [maxVisits, setMaxVisits] = useState('');
  const [minSpent, setMinSpent] = useState('');
  const [maxSpent, setMaxSpent] = useState('');
  const [birthdayMonth, setBirthdayMonth] = useState('');
  const [anniversaryMonth, setAnniversaryMonth] = useState('');
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const searchParams = useSearchParams();

  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const celebrates = searchParams.get('celebrating') === 'true';
    if (celebrates) {
      setIsCelebrating(true);
      setShowFilters(true);
    }
  }, [searchParams]);

  const fetchCustomers = useCallback(async (isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      const currentSkip = isLoadMore ? skip + PAGE_SIZE : 0;
      const data = await getCustomers({
        skip: currentSkip,
        limit: PAGE_SIZE,
        search: search.trim() || undefined,
        min_visits: minVisits ? Number(minVisits) : undefined,
        max_visits: maxVisits ? Number(maxVisits) : undefined,
        min_spent: minSpent ? Number(minSpent) : undefined,
        max_spent: maxSpent ? Number(maxSpent) : undefined,
        birthday_month: birthdayMonth ? Number(birthdayMonth) : undefined,
        anniversary_month: anniversaryMonth ? Number(anniversaryMonth) : undefined,
        is_celebrating_today: isCelebrating || undefined
      });

      if (isLoadMore) {
        setCustomers(prev => [...prev, ...data]);
        setSkip(currentSkip);
      } else {
        setCustomers(data);
        setSkip(0);
      }
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [search, minVisits, maxVisits, minSpent, maxSpent, birthdayMonth, anniversaryMonth, isCelebrating, skip]);

  useEffect(() => {
    const timer = setTimeout(() => fetchCustomers(false), 400);
    return () => clearTimeout(timer);
  }, [search, minVisits, maxVisits, minSpent, maxSpent, birthdayMonth, anniversaryMonth, isCelebrating]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          fetchCustomers(true);
        }
      },
      { threshold: 0.1 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, fetchCustomers]);

  const activeFiltersCount = [minVisits, maxVisits, minSpent, maxSpent, birthdayMonth, anniversaryMonth].filter(Boolean).length + (isCelebrating ? 1 : 0);

  const clearFilters = () => {
    setMinVisits('');
    setMaxVisits('');
    setMinSpent('');
    setMaxSpent('');
    setBirthdayMonth('');
    setAnniversaryMonth('');
    setIsCelebrating(false);
    setSearch('');
    setShowFilters(false);
  };

  const months = [
    { value: '1', label: 'Jan' }, { value: '2', label: 'Feb' }, { value: '3', label: 'Mar' },
    { value: '4', label: 'Apr' }, { value: '5', label: 'May' }, { value: '6', label: 'Jun' },
    { value: '7', label: 'Jul' }, { value: '8', label: 'Aug' }, { value: '9', label: 'Sep' },
    { value: '10', label: 'Oct' }, { value: '11', label: 'Nov' }, { value: '12', label: 'Dec' },
  ];

  return (
    <div className="animate-fade-in space-y-6 pb-6">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-stone-900">Customers</h1>
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
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] text-white">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </header>

      {showFilters && (
        <Card className="animate-slide-up space-y-4 bg-stone-50/50">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900">Advanced Filters</h3>
            <button onClick={clearFilters} className="text-xs font-bold text-brand-600 hover:underline">
              Reset All
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Min Visits</label>
              <input
                type="number"
                value={minVisits}
                onChange={(e) => setMinVisits(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Max Visits</label>
              <input
                type="number"
                value={maxVisits}
                onChange={(e) => setMaxVisits(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Min Spent</label>
              <input
                type="number"
                value={minSpent}
                onChange={(e) => setMinSpent(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Max Spent</label>
              <input
                type="number"
                value={maxSpent}
                onChange={(e) => setMaxSpent(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-stone-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
               <label className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Cake className="h-3 w-3 text-brand-600" /> Birthday Month
               </label>
               <select
                 value={birthdayMonth}
                 onChange={e => setBirthdayMonth(e.target.value)}
                 className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-brand-500 transition-all"
               >
                 <option value="">Any Month</option>
                 {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
               </select>
            </div>
            <div className="space-y-1.5">
               <label className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Heart className="h-3 w-3 text-brand-600" /> Anniversary Month
               </label>
               <select
                 value={anniversaryMonth}
                 onChange={e => setAnniversaryMonth(e.target.value)}
                 className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-brand-500 transition-all"
               >
                 <option value="">Any Month</option>
                 {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
               </select>
            </div>
            <div className="flex items-end">
               <button
                 onClick={() => setIsCelebrating(!isCelebrating)}
                 className={`flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold transition-all active:scale-95 ${
                   isCelebrating 
                     ? 'border-brand-300 bg-brand-600 text-white shadow-md' 
                     : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                 }`}
               >
                 <PartyPopper className={`h-4 w-4 ${isCelebrating ? 'animate-bounce' : ''}`} />
                 Celebrating Today
               </button>
            </div>
          </div>
        </Card>
      )}

      <div className="relative group">
        <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-stone-400">
          <Search className="h-5 w-5" />
        </div>
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="block w-full rounded-2xl border border-stone-200 bg-white py-4 pl-12 pr-4 text-base font-semibold shadow-soft outline-none transition-all placeholder:text-stone-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      
      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-stone-100 rounded-xl"></div>)}
        </div>
      ) : customers.length === 0 ? (
        <p className="text-sm font-bold text-stone-500 text-center py-10">No customers found.</p>
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
                  <p className="text-[10px] text-stone-400">${c.total_spent || 0} spent</p>
                </div>
              </div>
            </Link>
          ))}
          {hasMore && (
            <div ref={loaderRef} className="py-6 flex justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-brand-400" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
