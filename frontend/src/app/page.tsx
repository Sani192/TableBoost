'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus, Repeat2, UsersRound, Utensils, RefreshCw, Trophy, Cake, Heart, ChevronRight, BarChart3, Rocket, Activity, TrendingUp, Wallet, UserCheck, UserX, UserPlus, Target } from 'lucide-react';
import ActivityList from '@/components/ActivityList';
import StatCard from '@/components/StatCard';
import Card from '@/components/ui/Card';
import Drawer from '@/components/ui/Drawer';
import { getDashboard, DashboardResponse, getCustomers, getVisits } from '@/lib/api';

type DrilldownConfig = { type: 'customers' | 'visits'; title: string; params: () => Record<string, any> };

const DRILLDOWN_MAP: Record<string, DrilldownConfig> = {
  vip:         { type: 'customers', title: 'VIP Customers',          params: () => ({ is_vip: true }) },
  at_risk:     { type: 'customers', title: 'At-Risk Customers',      params: () => ({ is_at_risk: true }) },
  reward_near: { type: 'customers', title: 'Customers Near Reward',  params: () => ({ is_reward_near: true }) },
  lost:        { type: 'customers', title: 'Lost Customers',         params: () => ({ is_lost: true }) },
  new_blood:   { type: 'customers', title: 'New Customers',          params: () => ({ is_new: true }) },
  weekly:      { type: 'visits',    title: 'Weekly Revenue Visits',  params: () => ({ start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() }) },
  monthly:     { type: 'visits',    title: 'Monthly Revenue Visits', params: () => ({ start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() }) },
};

const formatTime = (isoDate: string) => {
  const date = new Date(isoDate);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const dayLabel = isToday
    ? 'Today'
    : isYesterday
      ? 'Yesterday'
      : date.toLocaleDateString([], { month: 'short', day: 'numeric' });

  const time = date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  return `${dayLabel}, ${time}`;
};

export default function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ops' | 'revenue'>('ops');
  
  const [drilldownOpen, setDrilldownOpen] = useState(false);
  const [drilldownTitle, setDrilldownTitle] = useState('');
  const [drilldownData, setDrilldownData] = useState<any[]>([]);
  const [isDrilldownLoading, setIsDrilldownLoading] = useState(false);
  const [drilldownType, setDrilldownType] = useState<'customers' | 'visits'>('customers');

  const openDrilldown = useCallback(async (type: 'customers' | 'visits', title: string, params: any) => {
    setDrilldownTitle(title);
    setDrilldownType(type);
    setDrilldownOpen(true);
    setIsDrilldownLoading(true);
    setDrilldownData([]);
    
    try {
      if (type === 'customers') {
        const res = await getCustomers({ limit: 50, ...params });
        setDrilldownData(res);
      } else if (type === 'visits') {
        const res = await getVisits({ limit: 50, ...params });
        setDrilldownData(res);
      }
    } catch (error) {
      console.error('Failed to fetch drilldown data:', error);
    } finally {
      setIsDrilldownLoading(false);
    }
  }, []);

  const handleDrilldown = (key: string) => {
    const config = DRILLDOWN_MAP[key];
    if (!config) return;
    router.push(`/?drawer=${key}`, { scroll: false });
    openDrilldown(config.type, config.title, config.params());
  };

  const handleDrilldownCustom = (type: 'customers' | 'visits', title: string, params: any, drawerKey: string) => {
    router.push(`/?drawer=${drawerKey}`, { scroll: false });
    openDrilldown(type, title, params);
  };

  const closeDrawer = () => {
    setDrilldownOpen(false);
    router.push('/', { scroll: false });
  };

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

  // Restore drawer from URL on mount / back-navigation
  useEffect(() => {
    const drawerKey = searchParams.get('drawer');
    if (drawerKey && DRILLDOWN_MAP[drawerKey] && !drilldownOpen) {
      const config = DRILLDOWN_MAP[drawerKey];
      setActiveTab('revenue');
      openDrilldown(config.type, config.title, config.params());
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = data
    ? {
        totalCustomers: data.total_customers,
        totalVisits: data.total_visits,
        repeatCustomers: data.repeat_customers,
        totalRedeemed: data.total_redeemed,
        vipsCount: data.segments?.vips_count || 0,
        atRiskCount: data.segments?.at_risk_count || 0,
        nearRewardsCount: data.segments?.near_rewards_count || 0,
        lostCount: data.segments?.lost_count || 0,
        newBloodCount: data.segments?.new_blood_count || 0,
        weeklyRevenue: data.revenue?.weekly_total || 0,
        monthlyRevenue: data.revenue?.monthly_total || 0,
        avgTicket: data.revenue?.avg_ticket || 0,
        repeatRate: data.revenue?.repeat_rate || 0,
        recentRedeemed: data.revenue?.rewards_stats?.recent_redeemed || 0,
        campaignRoi: data.revenue?.campaign_roi || {
          total_messages: 0,
          converted_messages: 0,
          conversion_rate: 0,
          revenue_generated: 0
        }
      }
    : {
        totalCustomers: 0,
        totalVisits: 0,
        repeatCustomers: 0,
        totalRedeemed: 0,
        vipsCount: 0,
        atRiskCount: 0,
        nearRewardsCount: 0,
        weeklyRevenue: 0,
        monthlyRevenue: 0,
        avgTicket: 0,
        repeatRate: 0,
        recentRedeemed: 0,
        campaignRoi: {
          total_messages: 0,
          converted_messages: 0,
          conversion_rate: 0,
          revenue_generated: 0
        }
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
            Intelligence Hub
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
            Revenue Dashboard
          </h1>
        </div>
        <button
          onClick={fetchDashboard}
          disabled={isLoading}
          className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 shadow-soft transition-all hover:bg-stone-50 hover:text-stone-700 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-stone-100 rounded-2xl w-full max-w-md">
        <button
          onClick={() => setActiveTab('ops')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all ${
            activeTab === 'ops' ? 'bg-white text-brand-600 shadow-sm' : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          <Activity className="h-4 w-4" /> Operations
        </button>
        <button
          onClick={() => setActiveTab('revenue')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all ${
            activeTab === 'revenue' ? 'bg-white text-brand-600 shadow-sm' : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          <TrendingUp className="h-4 w-4" /> Intelligence
        </button>
      </div>

      {activeTab === 'ops' ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
          {/* Celebrations Banner */}
          {data?.celebrations && (data.celebrations.birthdays > 0 || data.celebrations.anniversaries > 0) && (
            <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-brand-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-brand-600/20">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-brand-900">Today&apos;s Celebrations!</h2>
                  <p className="text-xs font-medium text-brand-700/80">
                    {data.celebrations.birthdays > 0 && <span>{data.celebrations.birthdays} Birthday{data.celebrations.birthdays > 1 ? 's' : ''} </span>}
                    {data.celebrations.anniversaries > 0 && <span>{data.celebrations.anniversaries} Anniversary</span>}
                  </p>
                </div>
              </div>
              <Link href="/customers?celebrating=true" className="text-xs font-bold text-brand-600 flex items-center gap-1 hover:underline">
                View <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 sm:gap-4">
            <StatCard label="Customers" value={stats.totalCustomers} icon={<UsersRound className="h-4 w-4" />} />
            <StatCard label="Total Visits" value={stats.totalVisits} icon={<Utensils className="h-4 w-4" />} accent="slate" />
            <StatCard label="Repeat Rate" value={`${Math.round((stats.repeatCustomers / (stats.totalCustomers || 1)) * 100)}%`} icon={<Repeat2 className="h-4 w-4" />} accent="green" />
            <StatCard label="Redeemed" value={stats.totalRedeemed} icon={<Trophy className="h-4 w-4" />} accent="orange" />
          </div>

          <section>
            <Link
              href="/add-visit"
              className="group flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-6 py-3.5 text-base font-bold text-white shadow-lift transition-all hover:bg-brand-700 active:scale-[0.97] sm:w-auto"
            >
              <Plus className="h-5 w-5" /> Add Visit
            </Link>
          </section>

          <ActivityList visits={visits} />
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard label="Weekly Revenue" value={`$${Math.round(stats.weeklyRevenue)}`} icon={<Wallet className="h-4 w-4" />} accent="blue" onClick={() => handleDrilldown('weekly')} />
            <StatCard label="Monthly Revenue" value={`$${Math.round(stats.monthlyRevenue)}`} icon={<TrendingUp className="h-4 w-4" />} accent="green" onClick={() => handleDrilldown('monthly')} />
            <StatCard label="Repeat Rate" value={`${Math.round(stats.repeatRate)}%`} icon={<Repeat2 className="h-4 w-4" />} accent="slate" />
            <StatCard label="Avg Ticket" value={`$${Math.round(stats.avgTicket)}`} icon={<TrendingUp className="h-4 w-4" />} accent="brand" />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard label="VIP Segments" value={stats.vipsCount} icon={<Trophy className="h-4 w-4" />} accent="orange" onClick={() => handleDrilldown('vip')} />
            <StatCard label="At Risk" value={stats.atRiskCount} icon={<UserCheck className="h-4 w-4" />} accent="red" onClick={() => handleDrilldown('at_risk')} />
            <StatCard label="Near Reward" value={stats.nearRewardsCount} icon={<Rocket className="h-4 w-4" />} accent="blue" onClick={() => handleDrilldown('reward_near')} />
            <StatCard label="Recent Rewards" value={stats.recentRedeemed} icon={<Trophy className="h-4 w-4" />} accent="slate" />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-2">
            <StatCard label="Lost Customers" value={stats.lostCount} icon={<UserX className="h-4 w-4" />} accent="red" onClick={() => handleDrilldown('lost')} />
            <StatCard label="New Blood" value={stats.newBloodCount} icon={<UserPlus className="h-4 w-4" />} accent="green" onClick={() => handleDrilldown('new_blood')} />
          </div>

          <Card className="p-6">
            <h3 className="text-base font-extrabold text-stone-900 mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-brand-600" /> Revenue Trends (Last 7 Days)
            </h3>
            <div className="h-32 flex items-end justify-between gap-2 mt-4 px-2 relative">
              {data?.revenue?.daily_trends && data.revenue.daily_trends.some(d => d.revenue > 0) ? (
                data.revenue.daily_trends.map((day, i) => (
                  <div key={i} className="flex-1 h-full flex flex-col justify-end items-center gap-2 group">
                    <div 
                      className="w-full bg-brand-500/20 hover:bg-brand-500 rounded-t-lg transition-all duration-300 relative min-h-[2px] cursor-pointer"
                      style={{ height: `${(day.revenue / (Math.max(...data.revenue.daily_trends.map(d => d.revenue)) || 1)) * 100}%` }}
                      onClick={() => openDrilldown('visits', `Visits on ${new Date(day.date).toLocaleDateString()}`, { start_date: `${day.date}T00:00:00`, end_date: `${day.date}T23:59:59` })}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        ${day.revenue}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-stone-400 truncate w-full text-center">
                      {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-400 bg-stone-50/50 rounded-xl border border-dashed border-stone-200">
                  <BarChart3 className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-xs font-bold">No recent revenue activity</p>
                </div>
              )}
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                         <Target className="h-6 w-6" />
                      </div>
                      <div>
                         <h4 className="text-sm font-bold text-stone-900">Campaign ROI</h4>
                         <p className="text-xs text-stone-500">Last 30 days</p>
                      </div>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                   <div>
                      <p className="text-[10px] text-stone-400 font-bold">CONVERSION</p>
                      <p className="text-lg font-extrabold text-stone-900">{stats.campaignRoi.conversion_rate.toFixed(1)}%</p>
                      <p className="text-[10px] text-stone-500">{stats.campaignRoi.converted_messages}/{stats.campaignRoi.total_messages} visits</p>
                   </div>
                   <div>
                      <p className="text-[10px] text-stone-400 font-bold">REVENUE</p>
                      <p className="text-lg font-extrabold text-emerald-600">${stats.campaignRoi.revenue_generated.toFixed(2)}</p>
                      <p className="text-[10px] text-stone-500">attributed</p>
                   </div>
                </div>
             </Card>
             <Card className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="h-12 w-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                      <Rocket className="h-6 w-6" />
                   </div>
                   <div>
                      <h4 className="text-sm font-bold text-stone-900">Automation Engine</h4>
                      <p className="text-xs text-stone-500">3 active pilots running</p>
                   </div>
                </div>
                <Link href="/settings" className="text-xs font-bold text-brand-600 hover:underline">Manage</Link>
             </Card>
             <Card className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                      <UsersRound className="h-6 w-6" />
                   </div>
                   <div>
                      <h4 className="text-sm font-bold text-stone-900">Smart Segments</h4>
                      <p className="text-xs text-stone-500">New VIP insights available</p>
                   </div>
                </div>
                <Link href="/customers?is_vip=true" className="text-xs font-bold text-brand-600 hover:underline">View All</Link>
             </Card>
          </div>
        </div>
      )}
      <Drawer isOpen={drilldownOpen} onClose={closeDrawer} title={drilldownTitle}>
        <div className="space-y-4">
          {isDrilldownLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-brand-600" />
            </div>
          ) : drilldownData.length === 0 ? (
            <div className="text-center py-8 text-stone-500 font-bold">
              No data available for this segment.
            </div>
          ) : drilldownType === 'customers' ? (
            <div className="space-y-3">
              {drilldownData.map((customer: any) => (
                <Link key={customer.id} href={`/customers/${customer.id}`} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer group">
                  <div>
                    <p className="font-bold text-stone-900 group-hover:text-brand-600 transition-colors">{customer.name || 'Unknown'}</p>
                    <p className="text-xs text-stone-500">{customer.phone_number}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-sm font-bold text-stone-900">{customer.total_visits} visits</p>
                      {customer.total_spent !== null && (
                        <p className="text-xs text-emerald-600 font-bold">${customer.total_spent}</p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-stone-300 group-hover:text-brand-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {drilldownData.map((visit: any, i) => {
                const name = visit.customer_name?.trim() || visit.phone_number;
                return (
                  <Link key={i} href={`/customers/${visit.customer_id}`} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer group">
                    <div>
                      <p className="font-bold text-stone-900 group-hover:text-brand-600 transition-colors">{name}</p>
                      <p className="text-xs text-stone-500">
                        {visit.customer_name ? visit.phone_number : 'Walk-in customer'}
                      </p>
                      <p className="text-xs text-stone-400">{formatTime(visit.visited_at)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-600">${Number(visit.amount).toFixed(2)}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-stone-300 group-hover:text-brand-500 transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </Drawer>
    </div>
  );
}
