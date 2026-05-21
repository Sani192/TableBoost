'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { getCustomers, CustomerListResponse } from '@/lib/api';
import { Search, SlidersHorizontal, RefreshCw, X, Cake, Heart, Lock } from 'lucide-react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Card from '@/components/ui/Card';
import CustomerListItem from '@/components/ui/CustomerListItem';
import { ListItemSkeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/context/AuthContext';

const PAGE_SIZE = 20;

export default function CustomersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { hasFeatureAccess } = useAuth();

  const [customers, setCustomers] = useState<CustomerListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);

  // Filters - Initialize from URL
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [minVisits, setMinVisits] = useState(searchParams.get('min_visits') || '');
  const [maxVisits, setMaxVisits] = useState(searchParams.get('max_visits') || '');
  const [minSpent, setMinSpent] = useState(searchParams.get('min_spent') || '');
  const [maxSpent, setMaxSpent] = useState(searchParams.get('max_spent') || '');
  const [birthdayMonth, setBirthdayMonth] = useState(searchParams.get('birthday_month') || '');
  const [anniversaryMonth, setAnniversaryMonth] = useState(searchParams.get('anniversary_month') || '');
  
  const [isCelebrating, setIsCelebrating] = useState(searchParams.get('celebrating') === 'true');
  const [isVip, setIsVip] = useState(searchParams.get('is_vip') === 'true');
  const [isAtRisk, setIsAtRisk] = useState(searchParams.get('is_at_risk') === 'true');
  const [isRewardNear, setIsRewardNear] = useState(searchParams.get('is_reward_near') === 'true');
  
  const hasActiveFilters = Boolean(
    searchParams.get('min_visits') || searchParams.get('max_visits') ||
    searchParams.get('min_spent') || searchParams.get('max_spent') ||
    searchParams.get('birthday_month') || searchParams.get('anniversary_month') ||
    searchParams.get('celebrating') === 'true' || searchParams.get('is_vip') === 'true' ||
    searchParams.get('is_at_risk') === 'true' || searchParams.get('is_reward_near') === 'true'
  );
  
  const [showFilters, setShowFilters] = useState(hasActiveFilters);

  const loaderRef = useRef<HTMLDivElement>(null);

  // Sync state to URL without reloading
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (minVisits) params.set('min_visits', minVisits);
    if (maxVisits) params.set('max_visits', maxVisits);
    if (minSpent) params.set('min_spent', minSpent);
    if (maxSpent) params.set('max_spent', maxSpent);
    if (birthdayMonth) params.set('birthday_month', birthdayMonth);
    if (anniversaryMonth) params.set('anniversary_month', anniversaryMonth);
    if (isCelebrating) params.set('celebrating', 'true');
    if (isVip) params.set('is_vip', 'true');
    if (isAtRisk) params.set('is_at_risk', 'true');
    if (isRewardNear) params.set('is_reward_near', 'true');

    const newUrl = `${pathname}?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  }, [search, minVisits, maxVisits, minSpent, maxSpent, birthdayMonth, anniversaryMonth, isCelebrating, isVip, isAtRisk, isRewardNear, pathname, router]);

  const fetchCustomers = useCallback(async (isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      const currentSkip = isLoadMore ? skip : 0;
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
        is_celebrating_today: isCelebrating || undefined,
        is_vip: isVip || undefined,
        is_at_risk: isAtRisk || undefined,
        is_reward_near: isRewardNear || undefined
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
  }, [search, minVisits, maxVisits, minSpent, maxSpent, birthdayMonth, anniversaryMonth, isCelebrating, isVip, isAtRisk, isRewardNear, skip]);

  useEffect(() => {
    const timer = setTimeout(() => {
        setSkip(0);
        fetchCustomers(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [search, minVisits, maxVisits, minSpent, maxSpent, birthdayMonth, anniversaryMonth, isCelebrating, isVip, isAtRisk, isRewardNear]);

  const loadingRef = useRef(false);
  loadingRef.current = loading || loadingMore;

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
  }, [hasMore, customers.length]);

  useEffect(() => {
    if (skip > 0) {
      fetchCustomers(true);
    }
  }, [skip]);

  const activeFiltersCount = [minVisits, maxVisits, minSpent, maxSpent, birthdayMonth, anniversaryMonth].filter(Boolean).length + (isCelebrating ? 1 : 0) + (isVip ? 1 : 0) + (isAtRisk ? 1 : 0) + (isRewardNear ? 1 : 0);

  const clearFilters = () => {
    setMinVisits('');
    setMaxVisits('');
    setMinSpent('');
    setMaxSpent('');
    setBirthdayMonth('');
    setAnniversaryMonth('');
    setIsCelebrating(false);
    setIsVip(false);
    setIsAtRisk(false);
    setIsRewardNear(false);
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
        <Card className="animate-slide-up space-y-4 bg-stone-50/50 max-h-[70vh] overflow-y-auto sm:max-h-none sm:overflow-visible">
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
          </div>

          <div className="pt-3 border-t border-stone-200">
             <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-2">Smart Segments</label>
             <div className="flex flex-wrap gap-2">
                {hasFeatureAccess('smart_segments') ? (
                  <button
                    onClick={() => setIsVip(!isVip)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${isVip ? 'bg-orange-600 border-orange-600 text-white shadow-sm' : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'}`}
                  >
                    VIP Customers
                  </button>
                ) : (
                  <div className="relative group">
                    <div className="px-3 py-1.5 rounded-lg text-xs font-bold border bg-stone-50 border-stone-200 text-stone-400 flex items-center gap-1 cursor-not-allowed opacity-60">
                      <Lock className="h-3.5 w-3.5 text-stone-400" /> VIP Customers
                    </div>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-stone-900 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg shadow-md whitespace-nowrap z-50 pointer-events-none">
                      Upgrade to Growth Plan to unlock
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-stone-900"></div>
                    </div>
                  </div>
                )}
                {hasFeatureAccess('intelligence') ? (
                  <button
                    onClick={() => setIsAtRisk(!isAtRisk)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${isAtRisk ? 'bg-red-600 border-red-600 text-white shadow-sm' : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'}`}
                  >
                    At Risk
                  </button>
                ) : (
                  <div className="relative group">
                    <div className="px-3 py-1.5 rounded-lg text-xs font-bold border bg-stone-50 border-stone-200 text-stone-400 flex items-center gap-1 cursor-not-allowed opacity-60">
                      <Lock className="h-3.5 w-3.5 text-stone-400" /> At Risk
                    </div>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-stone-900 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg shadow-md whitespace-nowrap z-50 pointer-events-none">
                      Upgrade to Pro Plan to unlock
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-stone-900"></div>
                    </div>
                  </div>
                )}
                {hasFeatureAccess('loyalty') ? (
                  <button
                    onClick={() => setIsRewardNear(!isRewardNear)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${isRewardNear ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'}`}
                  >
                    Near Reward
                  </button>
                ) : (
                  <div className="relative group">
                    <div className="px-3 py-1.5 rounded-lg text-xs font-bold border bg-stone-50 border-stone-200 text-stone-400 flex items-center gap-1 cursor-not-allowed opacity-60">
                      <Lock className="h-3.5 w-3.5 text-stone-400" /> Near Reward
                    </div>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-stone-900 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg shadow-md whitespace-nowrap z-50 pointer-events-none">
                      Upgrade to Growth Plan to unlock
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-stone-900"></div>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setIsCelebrating(!isCelebrating)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${isCelebrating ? 'bg-brand-600 border-brand-600 text-white shadow-sm' : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'}`}
                >
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
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <ListItemSkeleton key={i} />)}
        </div>
      ) : customers.length === 0 ? (
        <p className="text-sm font-bold text-stone-500 text-center py-10">No customers found.</p>
      ) : (
        <div className="space-y-3">
          {customers.map(c => (
            <CustomerListItem key={c.id} customer={c} />
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
