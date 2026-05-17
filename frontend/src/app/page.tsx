'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus, Repeat2, UsersRound, Utensils, RefreshCw, Trophy, Cake, Heart, ChevronRight, BarChart3, Rocket, Activity, TrendingUp, Wallet, UserCheck, UserX, UserPlus, Target, Sparkles, Megaphone, Gift } from 'lucide-react';
import ActivityList from '@/components/ActivityList';
import StatCard from '@/components/StatCard';
import Card from '@/components/ui/Card';
import Drawer from '@/components/ui/Drawer';
import Button from '@/components/ui/Button';
import RecommendationCard from '@/components/dashboard/RecommendationCard';
import CustomerListItem from '@/components/ui/CustomerListItem';
import VisitListItem from '@/components/ui/VisitListItem';
import { getDashboard, DashboardResponse, getCustomers, getVisits, getGrowthDashboard, GrowthDashboardResponse, dismissRecommendation, getCampaignRoi, getRewardEffectiveness, getIntelligenceCustomers } from '@/lib/api';

type DrilldownConfig = { type: 'customers' | 'visits'; title: string; subtitle?: string; params: () => Record<string, any> };

const DRILLDOWN_MAP: Record<string, DrilldownConfig> = {
  vip:         { type: 'customers', title: 'VIP Customers',          subtitle: 'Top tier lifetime value', params: () => ({ is_vip: true }) },
  at_risk:     { type: 'customers', title: 'At-Risk Customers',      subtitle: 'Likely to churn', params: () => ({ is_at_risk: true }) },
  reward_near: { type: 'customers', title: 'Customers Near Reward',  subtitle: '1 visit away from milestone', params: () => ({ is_reward_near: true }) },
  lost:        { type: 'customers', title: 'Lost Customers',         subtitle: 'Churned segment', params: () => ({ is_lost: true }) },
  new_blood:   { type: 'customers', title: 'New Customers',          subtitle: 'Acquired recently', params: () => ({ is_new: true }) },
  weekly:      { type: 'visits',    title: 'Weekly Revenue Visits',  subtitle: 'Last 7 Days', params: () => ({ start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() }) },
  monthly:     { type: 'visits',    title: 'Monthly Revenue Visits', subtitle: 'Last 30 Days', params: () => ({ start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() }) },
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
  const [growthData, setGrowthData] = useState<GrowthDashboardResponse | null>(null);
  const [campaignRoi, setCampaignRoi] = useState<any[]>([]);
  const [rewardEffectiveness, setRewardEffectiveness] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const activeTab = (searchParams.get('tab') as 'ops' | 'revenue' | 'growth') || 'ops';
  
  const [drilldownOpen, setDrilldownOpen] = useState(false);
  const [drilldownTitle, setDrilldownTitle] = useState('');
  const [drilldownSubtitle, setDrilldownSubtitle] = useState('');
  const [drilldownData, setDrilldownData] = useState<any[]>([]);
  const [isDrilldownLoading, setIsDrilldownLoading] = useState(false);
  const [drilldownType, setDrilldownType] = useState<'customers' | 'visits'>('customers');
  
  const [drilldownSkip, setDrilldownSkip] = useState(0);
  const [drilldownHasMore, setDrilldownHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentParams, setCurrentParams] = useState<any>({});
  const drilldownLoaderRef = useRef<HTMLDivElement>(null);

  const openDrilldown = useCallback(async (type: 'customers' | 'visits', title: string, subtitle: string, params: any, isLoadMore = false) => {
    setDrilldownTitle(title);
    setDrilldownSubtitle(subtitle);
    setDrilldownType(type);
    setDrilldownOpen(true);
    
    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setIsDrilldownLoading(true);
      setDrilldownData([]);
      setDrilldownSkip(0);
      setCurrentParams(params);
    }
    
    try {
      const currentSkip = isLoadMore ? drilldownSkip : 0;
      let res: any[] = [];
      
      const queryParams = { ...params };
      delete queryParams.is_intel;
      
      if (params?.is_intel) {
        res = await getIntelligenceCustomers({ filter: params.filter, skip: currentSkip, limit: 20 });
      } else if (params?.is_campaign) {
        const { getCampaignCustomers } = await import('@/lib/api');
        res = await getCampaignCustomers(params.campaign_id, currentSkip, 20);
      } else if (params?.is_reward) {
        const { getRewardCustomers } = await import('@/lib/api');
        res = await getRewardCustomers(params.reward_id, currentSkip, 20);
      } else if (params?.is_all_rewards) {
        const { getAllRewardCustomers } = await import('@/lib/api');
        res = await getAllRewardCustomers(currentSkip, 20);
      } else if (type === 'customers') {
        res = await getCustomers({ limit: 20, skip: currentSkip, ...queryParams });
      } else if (type === 'visits') {
        res = await getVisits({ limit: 20, skip: currentSkip, ...queryParams });
      }
      
      if (isLoadMore) {
        setDrilldownData(prev => [...prev, ...res]);
        setDrilldownSkip(currentSkip);
      } else {
        setDrilldownData(res);
      }
      
      setDrilldownHasMore(res.length === 20);
    } catch (error) {
      console.error('Failed to fetch drilldown data:', error);
    } finally {
      setIsDrilldownLoading(false);
      setIsLoadingMore(false);
    }
  }, [drilldownSkip]);

  const handleDrilldown = (key: string) => {
    const config = DRILLDOWN_MAP[key];
    if (!config) return;
    router.push(`/?tab=${activeTab}&drawer=${key}`, { scroll: false });
  };

  const handleDrilldownCustom = (type: 'customers' | 'visits', title: string, params: any, drawerKey: string) => {
    router.push(`/?tab=${activeTab}&drawer=${drawerKey}`, { scroll: false });
  };

  const openCustomDrilldown = (type: 'customers' | 'visits', title: string, params: any) => {
    router.push(`/?tab=${activeTab}&drawer_type=${type}&drawer_title=${encodeURIComponent(title)}&drawer_params=${encodeURIComponent(JSON.stringify(params))}`, { scroll: false });
  };

  const closeDrawer = () => {
    router.push(`/?tab=${activeTab}`, { scroll: false });
  };

  const fetchDashboard = (silent = false) => {
    if (!silent) setIsLoading(true);
    Promise.all([
      getDashboard(),
      getGrowthDashboard(),
      getCampaignRoi().catch(() => []),
      getRewardEffectiveness().catch(() => [])
    ])
      .then(([dashData, growth, roi, rewards]) => {
        setData(dashData);
        setGrowthData(growth);
        setCampaignRoi(roi);
        setRewardEffectiveness(rewards);
      })
      .catch(console.error)
      .finally(() => {
        if (!silent) setIsLoading(false);
      });
  };

  const handleDismissRecommendation = async (recId: number) => {
    try {
      await dismissRecommendation(recId);
      setGrowthData(prev => prev ? {
        ...prev,
        recommendations: prev.recommendations.filter(r => r.id !== recId)
      } : null);
    } catch (err) {
      console.error('Failed to dismiss recommendation:', err);
    }
  };

  const handleRecommendationAction = async (type: string, params?: Record<string, any>) => {
    if (type === 'view_customers') {
      openCustomDrilldown('customers', 'Recommended Customers', { is_intel: true, filter: params?.filter });
    } else if (type === 'create_campaign') {
      router.push('/messages');
    } else if (type === 'review_settings') {
      router.push('/settings');
    }
  };

  const handleGrowthDrilldown = async (filter: string, title: string) => {
    openCustomDrilldown('customers', title, { is_intel: true, filter });
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const drilldownLoadingRef = useRef(false);
  drilldownLoadingRef.current = isDrilldownLoading || isLoadingMore;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && drilldownHasMore && !drilldownLoadingRef.current && drilldownOpen) {
          setDrilldownSkip(prev => prev + 20);
        }
      },
      { threshold: 0.1 }
    );
    if (drilldownLoaderRef.current) observer.observe(drilldownLoaderRef.current);
    return () => observer.disconnect();
  }, [drilldownHasMore, drilldownOpen, drilldownData.length]);

  useEffect(() => {
    if (drilldownSkip > 0 && drilldownOpen) {
      openDrilldown(drilldownType, drilldownTitle, drilldownSubtitle, currentParams, true);
    }
  }, [drilldownSkip]);

  // Restore drawer from URL on mount / back-navigation
  useEffect(() => {
    const drawerKey = searchParams.get('drawer');
    const drawerType = searchParams.get('drawer_type') as 'customers' | 'visits';
    const drawerTitle = searchParams.get('drawer_title');
    const drawerParamsStr = searchParams.get('drawer_params');

    const shouldBeOpen = !!(drawerKey || drawerType);
    
    const currentTitle = drawerKey && DRILLDOWN_MAP[drawerKey] ? DRILLDOWN_MAP[drawerKey].title : decodeURIComponent(drawerTitle || '');
    
    if (shouldBeOpen && (!drilldownOpen || drilldownTitle !== currentTitle)) {
      setDrilldownOpen(true);
      if (drawerKey && DRILLDOWN_MAP[drawerKey]) {
        const config = DRILLDOWN_MAP[drawerKey];
        openDrilldown(config.type, config.title, config.subtitle || '', config.params());
      } else if (drawerType && drawerTitle && drawerParamsStr) {
        try {
          const params = JSON.parse(decodeURIComponent(drawerParamsStr));
          openDrilldown(drawerType, decodeURIComponent(drawerTitle), '', params);
        } catch (e) {
          console.error('Failed to parse drawer params', e);
        }
      }
    } else if (!shouldBeOpen && drilldownOpen) {
      setDrilldownOpen(false);
    }
  }, [searchParams, drilldownOpen, openDrilldown, activeTab, drilldownTitle]);

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

  const handleTabChange = (tab: 'ops' | 'revenue' | 'growth') => {
    router.push(`/?tab=${tab}`, { scroll: false });
  };

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
          onClick={() => fetchDashboard()}
          disabled={isLoading}
          className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 shadow-soft transition-all hover:bg-stone-50 hover:text-stone-700 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </header>

      <div className="flex gap-1 p-1 bg-stone-100 rounded-2xl w-full max-w-lg">
        <button
          onClick={() => handleTabChange('ops')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all ${
            activeTab === 'ops' ? 'bg-white text-brand-600 shadow-sm' : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          <Activity className="h-4 w-4" /> Operations
        </button>
        <button
          onClick={() => handleTabChange('revenue')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all ${
            activeTab === 'revenue' ? 'bg-white text-brand-600 shadow-sm' : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          <TrendingUp className="h-4 w-4" /> Intelligence
        </button>
        <button
          onClick={() => handleTabChange('growth')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all ${
            activeTab === 'growth' ? 'bg-white text-brand-600 shadow-sm' : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          <Sparkles className="h-4 w-4" /> Growth
        </button>
      </div>

      <div className={activeTab === 'ops' ? 'block' : 'hidden'}>
        <div className="space-y-6">
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
            <StatCard label="Customers" value={stats.totalCustomers} icon={<UsersRound className="h-4 w-4" />} onClick={() => openCustomDrilldown('customers', 'All Customers', {})} />
            <StatCard label="Total Visits" value={stats.totalVisits} icon={<Utensils className="h-4 w-4" />} accent="slate" onClick={() => openCustomDrilldown('visits', 'All Visits', {})} />
            <StatCard label="Repeat Rate" value={`${Math.round((stats.repeatCustomers / (stats.totalCustomers || 1)) * 100)}%`} icon={<Repeat2 className="h-4 w-4" />} accent="green" onClick={() => openCustomDrilldown('customers', 'Repeat Customers', { filter: 'repeat' })} />
            <StatCard label="Redeemed" value={stats.totalRedeemed} icon={<Trophy className="h-4 w-4" />} accent="orange" onClick={() => openCustomDrilldown('customers', 'Recent Redemptions', { is_all_rewards: true })} />
          </div>

          <section>
            <Link
              href="/add-visit"
              className="group flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-6 py-3.5 text-base font-bold text-white shadow-lift transition-all hover:bg-brand-700 active:scale-[0.97] sm:w-auto"
            >
              <Plus className="h-5 w-5" /> Add Visit
            </Link>
          </section>

          <ActivityList visits={data?.recent_visits || []} />
        </div>
      </div>

      <div className={activeTab === 'revenue' ? 'block' : 'hidden'}>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard label="Weekly Revenue" value={`$${Math.round(stats.weeklyRevenue)}`} icon={<Wallet className="h-4 w-4" />} accent="blue" onClick={() => handleDrilldown('weekly')} />
            <StatCard label="Monthly Revenue" value={`$${Math.round(stats.monthlyRevenue)}`} icon={<TrendingUp className="h-4 w-4" />} accent="green" onClick={() => handleDrilldown('monthly')} />
            <StatCard label="Repeat Rate" value={`${Math.round(stats.repeatRate)}%`} icon={<Repeat2 className="h-4 w-4" />} accent="slate" onClick={() => openCustomDrilldown('customers', 'Repeat Customers', { filter: 'repeat' })} />
            <StatCard label="Avg Ticket" value={`$${Math.round(stats.avgTicket)}`} icon={<TrendingUp className="h-4 w-4" />} accent="brand" />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard label="VIP Segments" value={stats.vipsCount} icon={<Trophy className="h-4 w-4" />} accent="orange" onClick={() => handleDrilldown('vip')} />
            <StatCard label="At Risk" value={stats.atRiskCount} icon={<UserCheck className="h-4 w-4" />} accent="red" onClick={() => handleDrilldown('at_risk')} />
            <StatCard label="Near Reward" value={stats.nearRewardsCount} icon={<Rocket className="h-4 w-4" />} accent="blue" onClick={() => handleDrilldown('reward_near')} />
            <StatCard label="Recent Rewards" value={stats.recentRedeemed} icon={<Trophy className="h-4 w-4" />} accent="slate" onClick={() => openCustomDrilldown('customers', 'Recent Redemptions', { is_all_rewards: true })} />
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
                      onClick={() => openCustomDrilldown('visits', `Visits on ${new Date(day.date).toLocaleDateString()}`, { start_date: `${day.date}T00:00:00`, end_date: `${day.date}T23:59:59` })}
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
      </div>

      <div className={activeTab === 'growth' ? 'block' : 'hidden'}>
        <div className="space-y-6">
          {/* Growth Cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard label="Healthy" value={growthData?.health?.healthy || 0} icon={<UserCheck className="h-4 w-4" />} accent="green" onClick={() => handleGrowthDrilldown('healthy', 'Healthy Customers')} />
            <StatCard label="Declining" value={growthData?.health?.declining || 0} icon={<TrendingUp className="h-4 w-4" />} accent="orange" onClick={() => handleGrowthDrilldown('declining', 'Declining Customers')} />
            <StatCard label="At Risk" value={growthData?.health?.churn_risk || 0} icon={<UserX className="h-4 w-4" />} accent="red" onClick={() => handleGrowthDrilldown('churn_risk', 'At Risk Customers')} />
            <StatCard label="Net New (30d)" value={growthData?.net_new_customers || 0} icon={<UserPlus className="h-4 w-4" />} accent="blue" onClick={() => handleGrowthDrilldown('net_new', 'Net New Customers (30d)')} />
          </div>

          {/* Recommendations */}
          {growthData?.recommendations && growthData.recommendations.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider">Smart Recommendations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {growthData.recommendations.map(rec => (
                  <RecommendationCard
                    key={rec.id}
                    id={rec.id}
                    rule_id={rec.rule_id}
                    message={rec.message}
                    priority={rec.priority}
                    action_type={rec.action_type}
                    action_params={rec.action_params}
                    onDismiss={handleDismissRecommendation}
                    onAction={handleRecommendationAction}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Summaries & Impact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* Latest Summary */}
             <Card className="p-5">
                <h4 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
                   <Target className="h-4 w-4 text-brand-600" /> Latest Business Summary
                </h4>
                {growthData?.latest_summary ? (
                   <div className="space-y-2">
                      <p className="text-sm font-medium text-stone-700">
                         Period: {growthData.latest_summary.period_type} (Ended {new Date(growthData.latest_summary.created_at).toLocaleDateString()})
                      </p>
                      <ul className="space-y-1">
                         {growthData.latest_summary.highlights?.map((h: string, i: number) => (
                            <li key={i} className="text-xs text-stone-600 flex items-start gap-1">
                               <span className="text-brand-600">•</span> {h}
                            </li>
                         ))}
                      </ul>
                   </div>
                ) : (
                   <p className="text-xs text-stone-400">No summary generated yet.</p>
                )}
             </Card>

             {/* Loyalty Impact */}
             <Card className="p-5">
                <h4 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
                   <Trophy className="h-4 w-4 text-brand-600" /> Loyalty Impact
                </h4>
                <div className="grid grid-cols-2 gap-2">
                   <div>
                      <p className="text-[10px] text-stone-400 font-bold">INFLUENCED REVENUE</p>
                      <p className="text-lg font-extrabold text-stone-900">${growthData?.loyalty_impact?.reward_influenced_revenue || 0}</p>
                   </div>
                   <div>
                      <p className="text-[10px] text-stone-400 font-bold">AVG REVISIT RATE</p>
                      <p className="text-lg font-extrabold text-emerald-600">{growthData?.loyalty_impact?.avg_revisit_rate || 0}%</p>
                   </div>
                </div>
             </Card>
          </div>

          {/* Analytics Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* Campaign ROI List */}
             <Card className="p-5">
                <h4 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
                   <Megaphone className="h-4 w-4 text-brand-600" /> Campaign Performance
                </h4>
                {campaignRoi.length > 0 ? (
                   <div className="space-y-3 max-h-60 overflow-y-auto">
                      {campaignRoi.map((camp, i) => (
                         <div key={i} className="flex items-center justify-between p-2 bg-stone-50 rounded-lg cursor-pointer hover:bg-stone-100 transition-colors" onClick={() => openCustomDrilldown('customers', camp.campaign_name, { is_campaign: true, campaign_id: camp.campaign_id })}>
                            <div>
                               <p className="text-xs font-bold text-stone-900">{camp.campaign_name}</p>
                               <p className="text-[10px] text-stone-500">{camp.total_sent} sent • {camp.total_converted} converted</p>
                            </div>
                            <div className="text-right flex items-center gap-2">
                               <div>
                                  <p className="text-xs font-bold text-emerald-600">${camp.revenue_attributed}</p>
                                  <p className="text-[10px] text-stone-400">{camp.conversion_rate}% rate</p>
                               </div>
                               <ChevronRight className="h-4 w-4 text-stone-300" />
                            </div>
                         </div>
                      ))}
                   </div>
                ) : (
                   <p className="text-xs text-stone-400">No campaign data available.</p>
                )}
             </Card>

             {/* Reward Effectiveness List */}
             <Card className="p-5">
                <h4 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
                   <Gift className="h-4 w-4 text-brand-600" /> Reward Effectiveness
                </h4>
                {rewardEffectiveness.length > 0 ? (
                   <div className="space-y-3 max-h-60 overflow-y-auto">
                      {rewardEffectiveness.map((rew, i) => (
                         <div key={i} className="flex items-center justify-between p-2 bg-stone-50 rounded-lg cursor-pointer hover:bg-stone-100 transition-colors" onClick={() => openCustomDrilldown('customers', rew.reward_name, { is_reward: true, reward_id: rew.reward_id })}>
                            <div>
                               <p className="text-xs font-bold text-stone-900">{rew.reward_name}</p>
                               <p className="text-[10px] text-stone-500">{rew.total_redeemed} redeemed</p>
                            </div>
                            <div className="text-right flex items-center gap-2">
                               <div>
                                  <p className="text-xs font-bold text-emerald-600">${rew.reward_influenced_revenue}</p>
                                  <p className="text-[10px] text-stone-400">{rew.post_reward_revisit_rate}% revisit</p>
                               </div>
                               <ChevronRight className="h-4 w-4 text-stone-300" />
                            </div>
                         </div>
                      ))}
                   </div>
                ) : (
                   <p className="text-xs text-stone-400">No reward data available.</p>
                )}
             </Card>
          </div>
        </div>
      </div>

      <Drawer isOpen={drilldownOpen} onClose={closeDrawer} title={drilldownTitle} subtitle={drilldownSubtitle}>
        <div className="space-y-4">
          {isDrilldownLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-brand-600" />
            </div>
          ) : drilldownData.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 text-stone-300">
                {drilldownType === 'customers' ? <UsersRound className="h-8 w-8" /> : <BarChart3 className="h-8 w-8" />}
              </div>
              <p className="mt-4 text-base font-bold text-stone-700">No data found</p>
              <p className="mt-1 text-sm text-stone-500 max-w-xs mx-auto">
                No records match this specific KPI segment.
              </p>
            </div>
          ) : drilldownType === 'customers' ? (
            <div className="space-y-3">
              {drilldownData.map((customer: any) => {
                if (currentParams?.is_campaign || currentParams?.is_reward || currentParams?.is_all_rewards) {
                  return <VisitListItem key={customer.id} visit={customer} isCard={true} />;
                }
                return <CustomerListItem key={customer.id} customer={customer} />;
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {drilldownData.map((visit: any, i) => (
                <VisitListItem key={i} visit={visit} isCard={true} />
              ))}
            </div>
          )}
          
          {!isDrilldownLoading && drilldownHasMore && (
            <div ref={drilldownLoaderRef} className="py-6 flex justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-brand-400" />
            </div>
          )}
        </div>
      </Drawer>
    </div>
  );
}
