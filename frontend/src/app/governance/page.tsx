'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Drawer from '@/components/ui/Drawer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { getAuditLogs, getOperationalLogs, AuditLogItem, OperationalLogItem } from '@/lib/api';
import { 
  Shield, 
  Server, 
  Search, 
  SlidersHorizontal, 
  Calendar, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  XCircle,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Copy,
  ChevronDown,
  ChevronUp,
  User,
  Clock,
  Cpu,
  Lock
} from 'lucide-react';

export default function GovernancePage() {
  const router = useRouter();
  const { user, hasFeatureAccess } = useAuth();
  
  // Tab control: 'audit' (OWNER only) or 'operational' (OWNER & MANAGER)
  const isOwner = user?.role === 'OWNER';
  const isManager = user?.role === 'MANAGER';
  const hasAccess = (isOwner || isManager) && hasFeatureAccess('governance');
  
  // Secure route guard
  useEffect(() => {
    if (user && !hasAccess) {
      router.replace('/');
    }
  }, [user, hasAccess, router]);
  
  const [activeTab, setActiveTab] = useState<'audit' | 'operational'>(isOwner ? 'audit' : 'operational');
  
  // Data lists
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [operationalLogs, setOperationalLogs] = useState<OperationalLogItem[]>([]);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState<AuditLogItem | OperationalLogItem | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Pagination, Filtering & Sorting
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [statusFilter, setStatusFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [sortBy, setSortBy] = useState<string>('timestamp');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  
  // Filters collapsed state matching Visits page
  const [showFilters, setShowFilters] = useState(false);

  // Helper to format uppercase underscores to human-readable strings
  const formatOptionText = (str: string) => {
    if (!str) return '';
    const specialCases: Record<string, string> = {
      'LOGIN': 'Login',
      'LOGOUT': 'Logout',
      'CREATE_VISIT': 'Create Visit',
      'SEND_CAMPAIGN': 'Send Campaign',
      'REDEEM_REWARD': 'Redeem Reward',
      'CHANGE_SUBSCRIPTION': 'Change Subscription',
    };
    if (specialCases[str]) return specialCases[str];
    return str
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Debounce search text
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText);
      setPage(1);
    }, 450);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Reset raw JSON accordion state when item selection changes
  useEffect(() => {
    setShowRawJson(false);
    setCopied(false);
  }, [selectedItem]);

  // Use a ref to deduplicate identical network requests
  const lastFetchRef = React.useRef<string>('');

  const fetchLogs = useCallback(async (force: boolean = false) => {
    if (!hasAccess) return;

    const paramsKey = JSON.stringify({ activeTab, page, debouncedSearch, statusFilter, actionFilter, startDate, endDate, pageSize, sortBy, sortDir });
    
    // Prevent duplicate calls for the exact same parameters unless forced
    if (!force && lastFetchRef.current === paramsKey) return;
    lastFetchRef.current = paramsKey;

    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: pageSize,
        search: debouncedSearch.trim() || undefined,
        status: statusFilter || undefined,
        start_date: startDate ? `${startDate}T00:00:00` : undefined,
        end_date: endDate ? `${endDate}T23:59:59` : undefined,
        sort_by: sortBy,
        sort_dir: sortDir,
      };

      if (activeTab === 'audit') {
        const data = await getAuditLogs({
          ...params,
          action: actionFilter || undefined,
        });
        setAuditLogs(data.items);
        setTotalPages(data.pages);
        setTotalCount(data.total);
      } else {
        const data = await getOperationalLogs({
          ...params,
          log_type: actionFilter || undefined,
        });
        setOperationalLogs(data.items);
        setTotalPages(data.pages);
        setTotalCount(data.total);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to fetch logs. Please verify permissions.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, debouncedSearch, statusFilter, actionFilter, startDate, endDate, pageSize, hasAccess, sortBy, sortDir]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const clearFilters = () => {
    setSearchText('');
    setDebouncedSearch('');
    setStatusFilter('');
    setActionFilter('');
    setStartDate('');
    setEndDate('');
    setSortBy('timestamp');
    setSortDir('desc');
    setShowFilters(false);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
    setPage(1);
  };

  const activeFiltersCount = [statusFilter, actionFilter, startDate, endDate].filter(Boolean).length;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <RefreshCw className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="max-w-xl mx-auto mt-20 p-8 bg-white rounded-3xl border border-stone-200/60 shadow-card text-center">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight flex items-center justify-center gap-2">
          <Lock className="w-5 h-5 text-stone-400" /> Access Restricted
        </h2>
        <p className="text-stone-500 mt-2 font-semibold">
          Only venue owners and managers with a Pro subscription have access to the Governance and Audit logging portal.
        </p>
      </div>
    );
  }

  // Format datetime
  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  // Status Badge Component matching the clean design system
  const StatusBadge = ({ status }: { status: string }) => {
    const s = status.toUpperCase();
    if (s === 'SUCCESS') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-55 text-emerald-800 border border-emerald-200/60 shadow-sm">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Success
        </span>
      );
    } else if (s === 'RUNNING' || s === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-50 text-brand-800 border border-brand-200/60 animate-pulse">
          <Play className="w-3 h-3 text-brand-600" /> Running
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200/60 shadow-sm">
          <XCircle className="w-3 h-3 text-rose-600" /> Failed
        </span>
      );
    }
  };

  // Sorting Header Column
  const SortableHeader = ({ label, field, className }: { label: string; field: string; className: string }) => {
    const isSorted = sortBy === field;
    return (
      <button
        onClick={() => handleSort(field)}
        className={`flex items-center gap-1 text-xs font-bold uppercase tracking-wider transition-colors hover:text-brand-600 focus:outline-none ${className} ${
          isSorted ? 'text-brand-650 font-extrabold' : 'text-stone-500'
        }`}
      >
        <span>{label}</span>
        {isSorted ? (
          sortDir === 'asc' ? (
            <ArrowUp className="h-3 w-3 shrink-0 text-brand-600" />
          ) : (
            <ArrowDown className="h-3 w-3 shrink-0 text-brand-600" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 shrink-0 opacity-40 group-hover:opacity-100" />
        )}
      </button>
    );
  };

  // Get reconstructed changes for the drawer
  const getChangedFields = (item: any) => {
    if (!item || !item.metadata_json) return null;
    
    // 1. Direct changed_fields check
    if (item.metadata_json.changed_fields) {
      return item.metadata_json.changed_fields;
    }
    
    // 2. Backward compatibility: old_values and new_values comparison
    if (item.metadata_json.old_values && item.metadata_json.new_values) {
      const oldVal = item.metadata_json.old_values;
      const newVal = item.metadata_json.new_values;
      const diff: any = {};
      for (const k of Object.keys(oldVal)) {
        if (oldVal[k] !== newVal[k]) {
          diff[k] = { old: oldVal[k], new: newVal[k] };
        }
      }
      return Object.keys(diff).length > 0 ? diff : null;
    }
    
    // 3. Backward compatibility: UPDATE_PROFILE legacy check
    if (item.metadata_json.old_first_name !== undefined) {
      const diff: any = {};
      if (item.metadata_json.old_first_name !== item.metadata_json.new_first_name) {
        diff["first_name"] = { old: item.metadata_json.old_first_name, new: item.metadata_json.new_first_name };
      }
      if (item.metadata_json.old_last_name !== item.metadata_json.new_last_name) {
        diff["last_name"] = { old: item.metadata_json.old_last_name, new: item.metadata_json.new_last_name };
      }
      return Object.keys(diff).length > 0 ? diff : null;
    }
    
    return null;
  };

  const changedFields = selectedItem ? getChangedFields(selectedItem) : null;

  return (
    <div className="animate-fade-in space-y-5 pb-6 sm:space-y-6">
      {/* Header matching Visit Records page, without back button */}
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">
            Governance
          </p>
          <h1 className="text-xl font-extrabold tracking-tight text-stone-900 sm:text-2xl">
            Security & System Logs
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchLogs(true)}
            disabled={loading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 shadow-soft transition-all hover:bg-stone-50 hover:text-stone-700 active:scale-95 disabled:opacity-50"
            aria-label="Refresh logs"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
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
        </div>
      </header>

      {/* Tabs matching Operations tab styling */}
      <div className="flex gap-1 p-1 bg-stone-150 rounded-2xl w-full max-w-md">
        {isOwner && (
          <button
            onClick={() => { setActiveTab('audit'); setActionFilter(''); setSortBy('timestamp'); setSortDir('desc'); setPage(1); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all ${
              activeTab === 'audit' ? 'bg-white text-brand-600 shadow-sm' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <Shield className="h-4 w-4" /> Audit Log
          </button>
        )}
        <button
          onClick={() => { setActiveTab('operational'); setActionFilter(''); setSortBy('timestamp'); setSortDir('desc'); setPage(1); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all ${
            activeTab === 'operational' ? 'bg-white text-brand-600 shadow-sm' : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          <Server className="h-4 w-4" /> System Events
        </button>
      </div>

      {/* Filters Panel matching visits page advanced filters */}
      {showFilters && (
        <Card className="animate-slide-up space-y-4 bg-stone-50/50">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900">Advanced Filters</h3>
            <button onClick={clearFilters} className="text-xs font-bold text-brand-600 hover:underline">
              Reset All
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Action / Log Type Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                {activeTab === 'audit' ? 'Action Type' : 'Log Type'}
              </label>
              <select
                value={actionFilter}
                onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                className="w-full rounded-xl border border-stone-200 bg-white py-2 px-3 text-sm font-semibold outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-stone-700"
              >
                <option value="">All Categories</option>
                {activeTab === 'audit' ? (
                  <>
                    <option value="LOGIN">Login</option>
                    <option value="LOGOUT">Logout</option>
                    <option value="UPDATE_PROFILE">Update Profile</option>
                    <option value="CHANGE_PASSWORD">Change Password</option>
                    <option value="CHANGE_SUBSCRIPTION">Change Subscription</option>
                    <option value="UPDATE_SETTINGS">Update Settings</option>
                    <option value="UPDATE_CUSTOMER">Update Customer</option>
                    <option value="CREATE_VISIT">Create Visit</option>
                    <option value="SEND_CAMPAIGN">Send Campaign</option>
                    <option value="CREATE_REWARD">Create Reward</option>
                    <option value="UPDATE_REWARD">Update Reward</option>
                    <option value="REDEEM_REWARD">Redeem Reward</option>
                    <option value="TOGGLE_AUTOMATION">Toggle Automation</option>
                    <option value="UPDATE_AUTOMATION">Update Automation</option>
                  </>
                ) : (
                  <>
                    <option value="AUTOMATION">Automation</option>
                    <option value="CAMPAIGN">Campaign</option>
                    <option value="SCHEDULER">Scheduler</option>
                    <option value="SECURITY">Security</option>
                    <option value="INTELLIGENCE">Intelligence</option>
                  </>
                )}
              </select>
            </div>

            {/* Status filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="w-full rounded-xl border border-stone-200 bg-white py-2 px-3 text-sm font-semibold outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-stone-700"
              >
                <option value="">All Statuses</option>
                <option value="SUCCESS">Success</option>
                <option value="FAILED">Failed</option>
                <option value="RUNNING">Running</option>
              </select>
            </div>

            {/* From Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">From Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                  className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-9 pr-3 text-sm font-semibold outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>

            {/* To Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">To Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                  className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-9 pr-3 text-sm font-semibold outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Main Search input matching visits page */}
      <div className="relative group">
        <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-stone-400 group-focus-within:text-brand-500 transition-colors">
          <Search className="h-5 w-5" aria-hidden="true" />
        </div>
        <input
          type="text"
          placeholder="Search by keyword, message details, or username..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="block w-full rounded-2xl border border-stone-200 bg-white py-4 pl-12 pr-4 text-base font-semibold text-stone-900 shadow-soft outline-none transition-all placeholder:text-stone-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
        />
        {searchText && (
          <button 
            onClick={() => setSearchText('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Table & List View */}
      <div className="rounded-3xl border border-stone-200/60 bg-white shadow-card overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="h-8 w-8 animate-spin text-brand-500" aria-hidden="true" />
            <p className="mt-4 text-sm font-bold text-stone-500">Syncing with server...</p>
          </div>
        ) : error ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 text-stone-300">
              <AlertTriangle className="h-8 w-8" aria-hidden="true" />
            </div>
            <p className="mt-4 text-base font-bold text-stone-700">Failed to Load Logs</p>
            <p className="mt-1 text-sm text-stone-500 max-w-sm mx-auto">{error}</p>
          </div>
        ) : (activeTab === 'audit' ? auditLogs : operationalLogs).length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 text-stone-300">
              <FileText className="h-8 w-8" aria-hidden="true" />
            </div>
            <p className="mt-4 text-base font-bold text-stone-700">No records found</p>
            <p className="mt-1 text-sm text-stone-500 max-w-xs mx-auto">
              Try adjusting your filters or search criteria.
            </p>
            {activeFiltersCount > 0 && (
              <Button variant="secondary" className="mt-6" onClick={clearFilters}>
                Clear All Filters
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Table Header — desktop only */}
            <div className="hidden border-b border-stone-100 bg-stone-50/50 px-6 py-3.5 sm:flex sm:items-center sm:gap-3 group/header">
              <span className="w-10" />
              
              <SortableHeader label="ID" field="id" className="w-16 shrink-0 font-mono" />

              {activeTab === 'audit' ? (
                <>
                  <SortableHeader label="Actor" field="actor_username" className="min-w-0 flex-1" />
                  <SortableHeader label="Action" field="action" className="w-40 shrink-0" />
                  <SortableHeader label="Target Entity" field="entity_type" className="w-48 shrink-0 animate-fade-in" />
                </>
              ) : (
                <>
                  <SortableHeader label="Log Type" field="log_type" className="w-36 shrink-0 font-mono" />
                  <SortableHeader label="Event / Job" field="event_name" className="min-w-0 flex-1" />
                  <SortableHeader label="Details" field="message" className="w-56 shrink-0" />
                </>
              )}
              
              <SortableHeader label="Status" field="status" className="w-28 shrink-0 justify-center text-center" />
              <SortableHeader label="Time" field="timestamp" className="w-32 shrink-0 justify-end text-right" />
            </div>

            {/* List Body */}
            <ul className="divide-y divide-stone-100">
              {activeTab === 'audit' ? (
                (auditLogs as AuditLogItem[]).map((log) => (
                  <li 
                    key={log.id} 
                    onClick={() => setSelectedItem(log)}
                    className="flex items-center gap-3 px-5 py-4 sm:px-6 hover:bg-stone-50/80 transition-colors group cursor-pointer animate-fade-in"
                  >
                    {/* Icon block matching standard items */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 shadow-sm group-hover:scale-105 transition-transform">
                      <Shield className="h-5 w-5" />
                    </div>

                    {/* ID Badge */}
                    <div className="hidden sm:block w-16 shrink-0 font-mono text-xs font-bold text-stone-400">
                      #{log.id}
                    </div>

                    {/* Actor Details */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-stone-900 group-hover:text-brand-600 transition-colors">
                        {log.actor_username || 'System / System Job'}
                      </p>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider sm:hidden mt-0.5">
                        {formatOptionText(log.action)}
                      </p>
                    </div>

                    {/* Desktop only columns */}
                    <div className="hidden sm:block w-40 shrink-0">
                      <span className="inline-flex px-2.5 py-0.5 bg-stone-105 border border-stone-150 rounded-md text-[11px] font-bold text-stone-700">
                        {formatOptionText(log.action)}
                      </span>
                    </div>

                    <div className="hidden sm:block w-48 shrink-0 text-xs font-medium text-stone-600 truncate">
                      {log.entity_type ? (
                        <span>{formatOptionText(log.entity_type)}</span>
                      ) : (
                        <span className="text-stone-300">—</span>
                      )}
                    </div>

                    {/* Status badge */}
                    <div className="w-28 shrink-0 flex justify-center">
                      <StatusBadge status={log.status} />
                    </div>

                    {/* Timestamp */}
                    <div className="w-32 shrink-0 text-right">
                      <p className="text-xs font-bold text-stone-500">
                        {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-[10px] font-medium text-stone-400">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                  </li>
                ))
              ) : (
                (operationalLogs as OperationalLogItem[]).map((log) => (
                  <li 
                    key={log.id} 
                    onClick={() => setSelectedItem(log)}
                    className="flex items-center gap-3 px-5 py-4 sm:px-6 hover:bg-stone-50/80 transition-colors group cursor-pointer animate-fade-in"
                  >
                    {/* Icon block */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600 shadow-sm group-hover:scale-105 transition-transform">
                      <Server className="h-5 w-5" />
                    </div>

                    {/* ID Badge */}
                    <div className="hidden sm:block w-16 shrink-0 font-mono text-xs font-bold text-stone-400">
                      #{log.id}
                    </div>

                    {/* Event name details */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-stone-900 group-hover:text-brand-600 transition-colors">
                        {log.event_name}
                      </p>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider sm:hidden mt-0.5">
                        {formatOptionText(log.log_type)}
                      </p>
                    </div>

                    {/* Desktop columns */}
                    <div className="hidden sm:block w-36 shrink-0">
                      <span className="inline-flex px-2 py-0.5 bg-slate-100 rounded-md text-[11px] font-bold text-slate-700">
                        {formatOptionText(log.log_type)}
                      </span>
                    </div>

                    <div className="hidden sm:block w-56 shrink-0 text-xs font-medium text-stone-600 truncate">
                      {log.message || '—'}
                      {log.duration_ms !== null && (
                        <span className="ml-1.5 font-bold text-[10px] text-brand-600">
                          ({log.duration_ms}ms)
                        </span>
                      )}
                    </div>

                    {/* Status */}
                    <div className="w-28 shrink-0 flex justify-center">
                      <StatusBadge status={log.status} />
                    </div>

                    {/* Timestamp */}
                    <div className="w-32 shrink-0 text-right">
                      <p className="text-xs font-bold text-stone-500">
                        {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-[10px] font-medium text-stone-400">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                  </li>
                ))
              )}
            </ul>

            {/* Pagination Footer */}
            {totalPages > 1 && (
              <div className="bg-stone-50/50 border-t border-stone-100 px-6 py-4 flex items-center justify-between">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                  Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, totalCount)} of {totalCount} records
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-50 transition-all shadow-sm active:scale-95"
                  >
                    <ChevronLeft className="w-4 h-4 text-stone-600" />
                  </button>
                  <span className="text-sm font-extrabold text-stone-700 px-2">{page} / {totalPages}</span>
                  <button
                    onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-50 transition-all shadow-sm active:scale-95"
                  >
                    <ChevronRight className="w-4 h-4 text-stone-600" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Details Drawer */}
      <Drawer
        isOpen={selectedItem !== null}
        onClose={() => setSelectedItem(null)}
        title={selectedItem && 'action' in selectedItem ? 'Audit Action Log Details' : 'System Event Details'}
        subtitle={selectedItem ? formatDateTime(selectedItem.timestamp) : ''}
        footer={
          <Button
            variant="primary"
            onClick={() => setSelectedItem(null)}
            fullWidth
          >
            Close Detail
          </Button>
        }
      >
        {selectedItem && (
          <div className="space-y-5 animate-slide-up pb-8">
            {/* Quick Metrics Header Grid */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="p-3.5 bg-stone-50 border border-stone-150 rounded-2xl">
                <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Status</div>
                <div className="mt-1.5">
                  <StatusBadge status={selectedItem.status} />
                </div>
              </div>
              <div className="p-3.5 bg-stone-50 border border-stone-150 rounded-2xl">
                <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Occurred At</div>
                <div className="mt-1.5 font-bold text-stone-800 text-xs leading-relaxed">
                  {new Date(selectedItem.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}{' '}
                  {new Date(selectedItem.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </div>
              </div>
            </div>

            {/* Content Properties Container */}
            <div className="bg-white rounded-3xl border border-stone-200/80 shadow-soft overflow-hidden divide-y divide-stone-100">
              {'action' in selectedItem ? (
                /* Audit Log Section Card */
                <>
                  <div className="p-4 flex items-start gap-3">
                    <div className="h-10 w-10 shrink-0 bg-brand-50 border border-brand-100 text-brand-700 rounded-xl flex items-center justify-center">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Performed By</span>
                      <span className="font-extrabold text-stone-900 text-sm mt-0.5 block">
                        {selectedItem.actor_username || 'System Automatic Process'}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 flex items-start gap-3">
                    <div className="h-10 w-10 shrink-0 bg-brand-50 border border-brand-100 text-brand-700 rounded-xl flex items-center justify-center">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Action Type</span>
                      <div className="mt-1">
                        <span className="inline-flex px-2.5 py-1 bg-brand-50 border border-brand-100 rounded-xl text-[11px] font-bold text-brand-700 tracking-tight">
                          {formatOptionText(selectedItem.action)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedItem.entity_type && (
                    <div className="p-4 flex items-start gap-3">
                      <div className="h-10 w-10 shrink-0 bg-brand-50 border border-brand-100 text-brand-700 rounded-xl flex items-center justify-center">
                        <Cpu className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Affected Area</span>
                        <div className="mt-1">
                          <span className="text-stone-855 font-bold text-xs bg-stone-100 px-2.5 py-1 border border-stone-200 rounded-xl">
                            {formatOptionText(selectedItem.entity_type)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Operational Log Section Card */
                <>
                  <div className="p-4 flex items-start gap-3">
                    <div className="h-10 w-10 shrink-0 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Category</span>
                      <div className="mt-1">
                        <span className="inline-flex px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 tracking-tight">
                          {formatOptionText(selectedItem.log_type)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 flex items-start gap-3">
                    <div className="h-10 w-10 shrink-0 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl flex items-center justify-center">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Event Name</span>
                      <span className="font-extrabold text-stone-900 text-sm mt-0.5 block">
                        {formatOptionText(selectedItem.event_name)}
                      </span>
                    </div>
                  </div>

                  {selectedItem.duration_ms !== null && (
                    <div className="p-4 flex items-start gap-3">
                      <div className="h-10 w-10 shrink-0 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl flex items-center justify-center">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Execution Duration</span>
                        <span className="text-stone-850 font-extrabold text-sm block mt-0.5">
                          {selectedItem.duration_ms} ms
                        </span>
                      </div>
                    </div>
                  )}

                  {selectedItem.message && (
                    <div className="p-4 flex flex-col gap-1.5">
                      <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Summary Message</span>
                      <p className="text-stone-600 text-xs font-semibold leading-relaxed bg-stone-50 border border-stone-200/80 p-3.5 rounded-2xl">
                        {selectedItem.message}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Changes Diff Viewer Card (Dynamic) */}
            {changedFields && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Changed Field Details</label>
                <div className="bg-stone-50 border border-stone-200/60 rounded-3xl p-4 space-y-3">
                  {Object.keys(changedFields).map((fieldName) => {
                    const fieldVal = changedFields[fieldName];
                    return (
                      <div key={fieldName} className="bg-white border border-stone-150 p-3 rounded-2xl space-y-1.5 shadow-sm">
                        <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wide">
                          {fieldName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </span>
                        
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          {/* From Value */}
                          <div className="bg-rose-50/70 border border-rose-155 text-rose-800 px-2.5 py-1 rounded-lg line-through font-semibold max-w-[170px] truncate">
                            {fieldVal.old === null || fieldVal.old === '' ? 'None' : String(fieldVal.old)}
                          </div>
                          
                          <span className="text-stone-400 font-black">→</span>
                          
                          {/* To Value */}
                          <div className="bg-emerald-50/70 border border-emerald-155 text-emerald-800 px-2.5 py-1 rounded-lg font-bold max-w-[170px] truncate">
                            {fieldVal.new === null || fieldVal.new === '' ? 'None' : String(fieldVal.new)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Collapsible Accordion for Extended/Technical Details */}
            <div className="bg-stone-50 border border-stone-200/65 rounded-3xl overflow-hidden">
              <button
                onClick={() => setShowRawJson(!showRawJson)}
                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-stone-100 transition-colors text-left"
              >
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Technical / Developer Info
                </span>
                {showRawJson ? (
                  <ChevronUp className="w-4 h-4 text-stone-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-stone-500" />
                )}
              </button>

              {showRawJson && (
                <div className="border-t border-stone-150 p-4 space-y-4 bg-white">
                  {/* Technical database IDs */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-150">
                      <span className="text-[9px] font-bold text-stone-400 block uppercase tracking-wider">Log Record ID</span>
                      <span className="text-stone-700 font-bold">#{selectedItem.id}</span>
                    </div>
                    {'actor_id' in selectedItem && selectedItem.actor_id && (
                      <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-150">
                        <span className="text-[9px] font-bold text-stone-400 block uppercase tracking-wider">Actor ID</span>
                        <span className="text-stone-700 font-bold">{selectedItem.actor_id}</span>
                      </div>
                    )}
                    {'entity_id' in selectedItem && selectedItem.entity_id && (
                      <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-150">
                        <span className="text-[9px] font-bold text-stone-400 block uppercase tracking-wider">Target Entity ID</span>
                        <span className="text-stone-700 font-bold">{selectedItem.entity_id}</span>
                      </div>
                    )}
                    {'job_id' in selectedItem && selectedItem.job_id && (
                      <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-150">
                        <span className="text-[9px] font-bold text-stone-400 block uppercase tracking-wider">Job ID</span>
                        <span className="text-stone-700 font-bold">{selectedItem.job_id}</span>
                      </div>
                    )}
                  </div>

                  {/* Raw JSON */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Raw JSON Payload</span>
                      <button
                        onClick={() => {
                          const jsonStr = JSON.stringify(selectedItem.metadata_json || {}, null, 2);
                          navigator.clipboard.writeText(jsonStr);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 active:scale-95 transition-all"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <div className="bg-stone-900 text-stone-100 p-4 rounded-2xl font-mono text-[11px] overflow-auto max-h-60 border border-stone-800 shadow-inner">
                      {selectedItem.metadata_json ? (
                        <pre className="whitespace-pre-wrap">{JSON.stringify(selectedItem.metadata_json, null, 2)}</pre>
                      ) : (
                        <span className="text-stone-400 italic">No additional metadata payload available.</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
