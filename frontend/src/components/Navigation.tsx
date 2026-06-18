'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Users, MessageSquare, Send, Settings, Plus, User, Shield, Menu, Lock, Crown, LayoutDashboard, ChevronRight, X, PanelLeftClose, PanelLeft, Search, Rocket, Trophy, LogOut } from 'lucide-react';
import Drawer from '@/components/ui/Drawer';
import AddVisitForm from '@/components/AddVisitForm';
import ProfileDrawer from '@/components/ProfileDrawer';
import ThemeToggle from '@/components/ui/ThemeToggle';
import SubscriptionPlansModal from '@/components/SubscriptionPlansModal';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import subscriptionRules from '../../../sentinel/registry/subscription_rules.json';

export default function Navigation({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();
  const { user, hasFeatureAccess, logout } = useAuth();

  const [isAddVisitOpen, setIsAddVisitOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<{name: string, desc: string} | null>(null);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  
  // Sidebar state
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isCustomerPage = pathname?.startsWith('/customers/');
  const customerIdStr = isCustomerPage ? pathname.split('/')[2] : null;
  const customerId = customerIdStr && !isNaN(Number(customerIdStr)) ? Number(customerIdStr) : undefined;

  // Domain-driven Navigation Architecture
  const domains = [
    {
      label: 'Core Operations',
      items: [
        { name: 'Dashboard', href: '/', icon: Home, roles: ['OWNER', 'MANAGER'] },
        { name: 'Customers', href: '/customers', icon: Users, roles: ['OWNER', 'MANAGER'], feature: 'customers' },
        { name: 'Visits', href: '/visits', icon: LayoutDashboard, roles: ['OWNER', 'MANAGER'], feature: 'visits' },
      ]
    },
    {
      label: 'Growth & Engagement',
      items: [
        { name: 'Campaigns', href: '/campaigns', icon: Send, roles: ['OWNER', 'MANAGER'], feature: 'campaigns' },
        { name: 'Messages', href: '/messages', icon: MessageSquare, roles: ['OWNER', 'MANAGER'], feature: 'campaigns' },
        { name: 'Loyalty Rewards', href: '/loyalty', icon: Trophy, roles: ['OWNER', 'MANAGER'], feature: 'loyalty' },
      ]
    },
    {
      label: 'Administration',
      items: [
        { name: 'Automations', href: '/automations', icon: Rocket, roles: ['OWNER'], feature: 'automation' },
        { name: 'Settings', href: '/settings', icon: Settings, roles: ['OWNER'] },
        { name: 'Governance', href: '/governance', icon: Shield, roles: ['OWNER', 'MANAGER'], feature: 'governance' },
      ]
    }
  ];

  // Mobile Bottom Bar Primary Items
  const mobilePrimaryItems = [
    { name: 'Home', href: '/', icon: Home, roles: ['OWNER', 'MANAGER'] },
    { name: 'Customers', href: '/customers', icon: Users, roles: ['OWNER', 'MANAGER'] },
    { name: 'Visits', href: '/visits', icon: LayoutDashboard, roles: ['OWNER', 'MANAGER'] },
    { name: 'Add Visit', href: '/add-visit', icon: Plus, roles: ['STAFF'] },
  ];

  // Handler for navigation click
  const handleNavClick = (e: React.MouseEvent, item: any) => {
    setIsMobileMenuOpen(false);
  };

  const NavItemRender = ({ item, isMobile = false }: { item: any, isMobile?: boolean }) => {
    const isLocked = item.feature && !hasFeatureAccess(item.feature);
    const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
    
    // Resolve the minimum required plan tier from central truth JSON
    const minPlan = item.feature && subscriptionRules.features[item.feature]
      ? subscriptionRules.features[item.feature].min_plan
      : 'PRO';
    
    // Premium styling constants
    const activeStyles = 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 font-bold shadow-sm';
    const inactiveStyles = 'text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-white/5 hover:text-stone-900 dark:hover:text-stone-200 font-medium';
    
    return (
      <Link
        href={item.href}
        onClick={(e) => handleNavClick(e, item)}
        title={isCollapsed && !isMobile ? item.name : undefined}
        className={`flex items-center gap-3 py-2 rounded-xl transition-all group relative ${isCollapsed && !isMobile ? 'px-0 justify-center mx-2' : 'px-3'} ${isActive ? activeStyles : inactiveStyles}`}
      >
        {/* Active Indicator Bar (Subtle left border) */}
        {isActive && (!isCollapsed || isMobile) && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-brand-600 dark:bg-brand-400 rounded-r-full" />
        )}
        {isActive && isCollapsed && !isMobile && (
          <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-5 bg-brand-600 dark:bg-brand-400 rounded-full" />
        )}

        <div className={`flex items-center justify-center shrink-0 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-stone-400 dark:text-stone-500 group-hover:text-stone-600 dark:group-hover:text-stone-300'}`}>
          <item.icon className="h-[18px] w-[18px] stroke-[2.5px]" />
        </div>
        
        {(!isCollapsed || isMobile) && (
          <>
            <span className="flex-1 truncate text-sm tracking-tight">{item.name}</span>
            {isLocked && (
              <div className="shrink-0 flex items-center justify-center bg-stone-100 dark:bg-stone-800 rounded-lg px-2 py-0.5 border border-stone-200 dark:border-stone-700 shadow-sm">
                <Lock className="h-3 w-3 text-stone-500 dark:text-stone-400 mr-1" />
                <span className="text-[10px] font-extrabold text-stone-600 dark:text-stone-400 tracking-wider">{minPlan}</span>
              </div>
            )}
          </>
        )}
      </Link>
    );
  };

  const displayName = user?.first_name || user?.last_name 
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim() 
    : 'My Profile';

  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <>
      {/* ======================================================== */}
      {/* DESKTOP SIDEBAR NAVIGATION (Hidden on mobile)            */}
      {/* ======================================================== */}
      <aside className={`hidden sm:flex flex-col fixed left-0 top-0 bottom-0 ${isCollapsed ? 'w-20' : 'w-64'} border-r border-stone-200/60 dark:border-white/5 bg-white dark:bg-[#0a0a0a] z-40 transition-all duration-300`}>
        
        {/* Brand Header */}
        <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-6'} shrink-0 relative`}>
          <Link href="/" className="flex items-center gap-2 text-stone-900 dark:text-white overflow-hidden cursor-pointer" title="TableBoost">
            <Crown className="h-6 w-6 shrink-0 fill-stone-900 dark:fill-white stroke-none" />
            {!isCollapsed && <span className="text-lg font-black tracking-tight truncate">TableBoost</span>}
          </Link>
          
          {/* Collapse/Expand Toggle (Absolute positioned for perfection) */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            className={`absolute top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors bg-white dark:bg-[#0a0a0a] hover:bg-stone-100 dark:hover:bg-stone-800 p-1.5 rounded-full border border-stone-200 dark:border-stone-800 shadow-sm z-50
              ${isCollapsed ? 'right-[-14px]' : 'right-4'}
            `}
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        {/* Global Action */}
        {user && user.role !== 'STAFF' && (
          <div className={`pt-6 pb-4 shrink-0 ${isCollapsed ? 'px-3' : 'px-4'}`}>
            <button 
              onClick={() => setIsAddVisitOpen(true)} 
              title={isCollapsed ? "Add Visit" : undefined}
              className={`w-full flex items-center justify-center gap-2 bg-brand-600 dark:bg-brand-600 text-white dark:text-white py-2.5 rounded-xl hover:bg-brand-700 dark:hover:bg-brand-500 transition-all shadow-sm active:scale-95 group ${isCollapsed ? 'px-0' : 'px-4'}`}
            >
              <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform shrink-0 stroke-[2.5px]" />
              {!isCollapsed && <span className="text-sm font-bold truncate">Add Visit</span>}
            </button>
          </div>
        )}

        {/* Navigation Domains */}
        <div className={`flex-1 overflow-y-auto py-2 space-y-6 custom-scrollbar ${isCollapsed ? 'px-0' : 'px-3'}`}>
          {domains.map((domain, idx) => {
            const visibleItems = domain.items.filter(item => user && item.roles.includes(user.role));
            if (visibleItems.length === 0) return null;

            return (
              <div key={idx} className="space-y-1">
                {!isCollapsed ? (
                  <h3 className="px-4 text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-2 truncate">
                    {domain.label}
                  </h3>
                ) : (
                  <div className="h-px bg-stone-100 dark:bg-stone-800/60 mb-2 w-8 mx-auto" />
                )}
                
                <div className="space-y-0.5">
                  {visibleItems.map(item => <NavItemRender key={item.name} item={item} />)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Actions (Theme + Profile) */}
        {user && (
          <div className={`shrink-0 border-t border-stone-100 dark:border-stone-800/60 flex flex-col ${isCollapsed ? 'p-2' : 'p-4'}`}>
            <div className={`flex items-center mb-2 ${isCollapsed ? 'justify-center' : 'justify-between px-2'}`}>
              {!isCollapsed && <span className="text-xs font-bold text-stone-500 dark:text-stone-400">Theme</span>}
              <div>
                <ThemeToggle className="h-8 w-8" />
              </div>
            </div>

            <div className={`flex items-center gap-1 ${isCollapsed ? 'flex-col' : ''}`}>
              <button
                onClick={() => setIsProfileOpen(true)}
                className={`flex-1 flex items-center p-2 rounded-xl hover:bg-stone-50 dark:hover:bg-white/5 transition-colors text-left ${isCollapsed ? 'justify-center gap-0 w-full' : 'gap-3'}`}
                title="Profile Settings"
              >
                <div className="h-8 w-8 shrink-0 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-full flex items-center justify-center font-bold text-sm">
                  <User className="h-4 w-4" />
                </div>
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-900 dark:text-white truncate">{displayName}</p>
                    <p className="text-[10px] text-stone-500 dark:text-stone-400 uppercase font-medium">{user.role}</p>
                  </div>
                )}
              </button>
              
              <button
                onClick={logout}
                className={`flex shrink-0 items-center justify-center p-2 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${isCollapsed ? 'w-full' : ''}`}
                title="Sign Out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* ======================================================== */}
      {/* MAIN CONTENT WRAPPER                                     */}
      {/* ======================================================== */}
      <div className={`flex flex-col min-h-screen transition-all duration-300 ${isCollapsed ? 'sm:ml-20' : 'sm:ml-64'}`}>
        {children}
      </div>

      {/* ======================================================== */}
      {/* MOBILE BOTTOM APP BAR (Hidden on desktop)                */}
      {/* ======================================================== */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-lg border-t border-stone-200/60 dark:border-white/5 pb-safe shadow-[0_-4px_24px_-12px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-around h-16 px-2 relative">
          
          {mobilePrimaryItems.map(item => {
            if (user && !item.roles.includes(user.role)) return null;
            const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center space-y-1 w-16 h-full ${
                  isActive ? 'text-brand-600 dark:text-brand-400' : 'text-stone-400 dark:text-stone-500'
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>{item.name}</span>
              </Link>
            );
          })}

          {user && user.role !== 'STAFF' && (
            <div className="relative -top-5">
              <button
                onClick={() => setIsAddVisitOpen(true)}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 dark:bg-brand-600 text-white dark:text-white shadow-xl active:scale-95 transition-transform border-4 border-white dark:border-[#0a0a0a]"
              >
                <Plus className="h-6 w-6 stroke-[2.5px]" />
              </button>
            </div>
          )}

          {user && user.role !== 'STAFF' && (
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex flex-col items-center justify-center space-y-1 w-16 h-full text-stone-400 dark:text-stone-500"
            >
              <Menu className="h-5 w-5" />
              <span className="text-[10px] font-medium">Menu</span>
            </button>
          )}

          {user && user.role === 'STAFF' && (
            <button
              onClick={() => setIsProfileOpen(true)}
              className="flex flex-col items-center justify-center space-y-1 w-16 h-full text-stone-400 dark:text-stone-500"
            >
              <User className="h-5 w-5" />
              <span className="text-[10px] font-medium">Profile</span>
            </button>
          )}
        </div>
      </nav>

      {/* ======================================================== */}
      {/* MOBILE FULL MENU DRAWER                                  */}
      {/* ======================================================== */}
      <Drawer isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} title="Menu">
        <div className="p-4 space-y-6 pb-24">
          
          {user && (
            <div 
              onClick={() => { setIsMobileMenuOpen(false); setIsProfileOpen(true); }}
              className="flex items-center gap-4 p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 active:scale-[0.98] transition-transform cursor-pointer"
            >
              <div className="h-12 w-12 bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-full flex items-center justify-center font-bold text-lg">
                <User className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-base font-bold text-stone-900 dark:text-stone-100 truncate">
                  {displayName}
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400 uppercase font-semibold">{user.role} Account</p>
              </div>
              <ChevronRight className="h-5 w-5 text-stone-400" />
            </div>
          )}

          {/* Theme Toggle for Mobile */}
          <div className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700">
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">Theme</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">Toggle dark/light mode</p>
            </div>
            <ThemeToggle />
          </div>

          {/* Sign Out for Mobile */}
          {user && (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                logout();
              }}
              className="w-full flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-2xl border border-red-100 dark:border-red-900/30 active:scale-[0.98] transition-transform cursor-pointer"
            >
              <div className="flex items-center gap-4 text-left">
                <div className="h-12 w-12 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center font-bold shrink-0">
                  <LogOut className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">Sign Out</h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">Log out of your session</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-red-400" />
            </button>
          )}

          <div className="space-y-6">
            {domains.map((domain, idx) => {
              const visibleItems = domain.items.filter(item => user && item.roles.includes(user.role));
              if (visibleItems.length === 0) return null;

              return (
                <div key={idx} className="space-y-2">
                  <h3 className="text-[11px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest pl-1">
                    {domain.label}
                  </h3>
                  <div className="bg-white dark:bg-[#0a0a0a] border border-stone-200/60 dark:border-white/5 rounded-2xl overflow-hidden divide-y divide-stone-100 dark:divide-white/5">
                    {visibleItems.map(item => (
                      <NavItemRender key={item.name} item={item} isMobile />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Drawer>

      {/* ======================================================== */}
      {/* SHARED DRAWERS & MODALS                                  */}
      {/* ======================================================== */}
      
      <Drawer isOpen={isAddVisitOpen} onClose={() => setIsAddVisitOpen(false)} title="Quick Add Visit">
        <div className="p-4">
          <AddVisitForm onSuccess={() => setIsAddVisitOpen(false)} onCancel={() => setIsAddVisitOpen(false)} customerId={customerId} />
        </div>
      </Drawer>

      <ProfileDrawer isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

      {/* Removed upgradeFeature Drawer */}

      {/* Unified Subscription Plans Modal */}
      {isSubscriptionModalOpen && (
        <SubscriptionPlansModal onClose={() => setIsSubscriptionModalOpen(false)} />
      )}
    </>
  );
}
