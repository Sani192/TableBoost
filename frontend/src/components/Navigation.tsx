'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, MessageSquare, Send, Settings, Plus, User, Shield } from 'lucide-react';
import Drawer from '@/components/ui/Drawer';
import AddVisitForm from '@/components/AddVisitForm';
import ProfileDrawer from '@/components/ProfileDrawer';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useAuth } from '@/context/AuthContext';

export default function Navigation() {
  const pathname = usePathname();
  const [isAddVisitOpen, setIsAddVisitOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, hasFeatureAccess } = useAuth();

  const isCustomerPage = pathname?.startsWith('/customers/');
  const customerIdStr = isCustomerPage ? pathname.split('/')[2] : null;
  const customerId = customerIdStr && !isNaN(Number(customerIdStr)) ? Number(customerIdStr) : undefined;

  const allNavItems = [
    { name: 'Home', href: '/', icon: Home, roles: ['OWNER', 'MANAGER'] },
    { name: 'Customers', href: '/customers', icon: Users, roles: ['OWNER', 'MANAGER'], feature: 'customers' },
    { name: 'Campaigns', href: '/campaigns', icon: Send, roles: ['OWNER', 'MANAGER'], feature: 'campaigns' },
    { name: 'Messages', href: '/messages', icon: MessageSquare, roles: ['OWNER', 'MANAGER'], feature: 'campaigns' },
    { name: 'Settings', href: '/settings', icon: Settings, roles: ['OWNER'] },
    { name: 'Governance', href: '/governance', icon: Shield, roles: ['OWNER', 'MANAGER'], feature: 'governance' },
    { name: 'Add Visit', href: '/add-visit', icon: Plus, roles: ['STAFF'], feature: 'visits' },
  ];

  const navItems = allNavItems.filter(item => 
    user && 
    item.roles.includes(user.role) && 
    (!item.feature || hasFeatureAccess(item.feature))
  );

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 pb-safe pt-1 shadow-[0_-4px_24px_-12px_rgba(0,0,0,0.1)] sm:top-0 sm:bottom-auto sm:border-b sm:border-t-0 sm:pt-0">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-around px-2 sm:h-16 sm:max-w-none sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center justify-around w-full sm:w-auto sm:justify-start sm:gap-6">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex flex-col items-center justify-center space-y-1 px-3 py-1 sm:flex-row sm:space-x-2 sm:space-y-0 sm:px-4 ${
                    isActive ? 'text-brand-600 dark:text-brand-400' : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  <item.icon className={`h-5 w-5 sm:h-4 sm:w-4 ${isActive ? 'fill-brand-50 dark:fill-brand-900/40' : ''}`} />
                  <span className={`text-[10px] font-medium sm:text-sm ${isActive ? 'font-bold' : ''}`}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
            
            {/* Profile Button */}
            {user && (
              <button
                onClick={() => setIsProfileOpen(true)}
                className="flex flex-col items-center justify-center space-y-1 px-3 py-1 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 sm:flex-row sm:space-x-2 sm:space-y-0 sm:px-4"
              >
                <User className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="text-[10px] font-medium sm:text-sm">Profile</span>
              </button>
            )}

          </div>

          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-3">
            <ThemeToggle />
            {user && user.role !== 'STAFF' && (
              <button 
                onClick={() => setIsAddVisitOpen(true)} 
                className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl hover:bg-brand-700 transition-colors shadow-soft active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm font-bold">Add Visit</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile FAB (Hidden for Staff) */}
      {user && user.role !== 'STAFF' && (
        <button 
          onClick={() => setIsAddVisitOpen(true)} 
          className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 dark:bg-brand-500 text-white shadow-lg hover:bg-brand-700 dark:hover:bg-brand-600 transition-colors sm:hidden active:scale-95"
          aria-label="Add Visit"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* Add Visit Drawer */}
      <Drawer isOpen={isAddVisitOpen} onClose={() => setIsAddVisitOpen(false)} title="Quick Add Visit">
        <div className="p-4">
          <AddVisitForm onSuccess={() => setIsAddVisitOpen(false)} onCancel={() => setIsAddVisitOpen(false)} customerId={customerId} />
        </div>
      </Drawer>

      {/* Profile Drawer */}
      <ProfileDrawer isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  );
}
