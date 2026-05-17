'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { getMessageLogs, MessageLogResponse } from '@/lib/api';
import { Star, Megaphone, Search, SlidersHorizontal, RefreshCw, X, Calendar } from 'lucide-react';
import Card from '@/components/ui/Card';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';

const PAGE_SIZE = 20;

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [logs, setLogs] = useState<MessageLogResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);

  // Filters - Initialize from URL
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [startDate, setStartDate] = useState(searchParams.get('start_date') || '');
  const [endDate, setEndDate] = useState(searchParams.get('end_date') || '');
  
  const hasActiveFilters = Boolean(
    searchParams.get('type') || searchParams.get('status') || 
    searchParams.get('start_date') || searchParams.get('end_date')
  );
  const [showFilters, setShowFilters] = useState(hasActiveFilters);

  const loaderRef = useRef<HTMLDivElement>(null);

  // Sync state to URL without reloading
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (type) params.set('type', type);
    if (status) params.set('status', status);
    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);

    const newUrl = `${pathname}?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  }, [search, type, status, startDate, endDate, pathname, router]);



  const fetchLogs = useCallback(async (isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      const currentSkip = isLoadMore ? skip : 0;
      const data = await getMessageLogs({
        skip: currentSkip,
        limit: PAGE_SIZE,
        search: search.trim() || undefined,
        type: type || undefined,
        status: status || undefined,
        start_date: startDate ? `${startDate}T00:00:00` : undefined,
        end_date: endDate ? `${endDate}T23:59:59` : undefined,
      });

      if (isLoadMore) {
        setLogs(prev => [...prev, ...data]);
        setSkip(currentSkip);
      } else {
        setLogs(data);
        setSkip(0);
      }
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [search, type, status, startDate, endDate, skip]);

  useEffect(() => {
    const timer = setTimeout(() => fetchLogs(false), 400);
    return () => clearTimeout(timer);
  }, [search, type, status, startDate, endDate]);

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
  }, [hasMore, logs.length]);

  useEffect(() => {
    if (skip > 0) {
      fetchLogs(true);
    }
  }, [skip]);

  const activeFiltersCount = [type, status, startDate, endDate].filter(Boolean).length;

  const clearFilters = () => {
    setType('');
    setStatus('');
    setStartDate('');
    setEndDate('');
    setSearch('');
    setShowFilters(false);
  };

  return (
    <div className="animate-fade-in space-y-6 pb-6">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-stone-900">Message Logs</h1>
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
          
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="">All</option>
                <option value="review">Review</option>
                <option value="campaign">Campaign</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="">All</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
              </select>
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
      ) : logs.length === 0 ? (
        <p className="text-sm font-bold text-stone-500 text-center py-10">No messages found.</p>
      ) : (
        <div className="space-y-3">
          {logs.map(log => (
            <div key={log.id} className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-stone-900">{log.customer_name || log.phone_number}</p>
                  <p className="text-xs text-stone-500">{new Date(log.sent_at).toLocaleString()}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-bold rounded-full ${log.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {log.status.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-stone-700 bg-stone-50 p-2 rounded">{log.message_text}</p>
              <div className="mt-3 flex items-center">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold border ${
                  log.type === 'review' 
                    ? 'bg-blue-50 text-blue-700 border-blue-200' 
                    : log.type === 'campaign' 
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'bg-stone-50 text-stone-700 border-stone-200'
                }`}>
                  {log.type === 'review' ? <Star className="w-3 h-3" /> : log.type === 'campaign' ? <Megaphone className="w-3 h-3" /> : null}
                  {log.type.toUpperCase()}
                </span>
              </div>
            </div>
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
