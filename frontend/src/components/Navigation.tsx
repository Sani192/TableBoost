'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, MessageSquare, Send, Settings, Plus, LogOut, User, Shield } from 'lucide-react';
import Drawer from '@/components/ui/Drawer';
import AddVisitForm from '@/components/AddVisitForm';
import { useAuth } from '@/context/AuthContext';
import { changePassword, getProfile, updateProfile } from '@/lib/api';

export default function Navigation() {
  const pathname = usePathname();
  const [isAddVisitOpen, setIsAddVisitOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, logout, hasFeatureAccess, updateSubscription } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwMessage, setPwMessage] = useState('');
  const [pwError, setPwError] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');

  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [planMessage, setPlanMessage] = useState('');
  const [updatingPlan, setUpdatingPlan] = useState<string | null>(null);

  // Static Plan Details Modal State
  const [selectedPlanDetails, setSelectedPlanDetails] = useState<any | null>(null);

  const isCustomerPage = pathname?.startsWith('/customers/');
  const customerIdStr = isCustomerPage ? pathname.split('/')[2] : null;
  const customerId = customerIdStr && !isNaN(Number(customerIdStr)) ? Number(customerIdStr) : undefined;

  const allNavItems = [
    { name: 'Home', href: '/', icon: Home, roles: ['OWNER', 'MANAGER'] },
    { name: 'Customers', href: '/customers', icon: Users, roles: ['OWNER', 'MANAGER'], feature: 'customers' },
    { name: 'Campaigns', href: '/campaigns', icon: Send, roles: ['OWNER', 'MANAGER'], feature: 'campaigns' },
    { name: 'Logs', href: '/messages', icon: MessageSquare, roles: ['OWNER', 'MANAGER'], feature: 'campaigns' },
    { name: 'Settings', href: '/settings', icon: Settings, roles: ['OWNER'] },
    { name: 'Governance', href: '/governance', icon: Shield, roles: ['OWNER', 'MANAGER'], feature: 'governance' },
    { name: 'Add Visit', href: '/add-visit', icon: Plus, roles: ['STAFF'], feature: 'visits' },
  ];

  const navItems = allNavItems.filter(item => 
    user && 
    item.roles.includes(user.role) && 
    (!item.feature || hasFeatureAccess(item.feature))
  );

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMessage('');
    setPwError('');
    try {
      const res = await changePassword({ current_password: currentPassword, new_password: newPassword });
      setPwMessage(res.message);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPwError(err.response?.data?.detail || 'Failed to change password');
    }
  };

  React.useEffect(() => {
    if (isProfileOpen) {
      getProfile().then(res => {
        if (res.first_name) setFirstName(res.first_name);
        if (res.last_name) setLastName(res.last_name);
      }).catch(console.error);
    }
  }, [isProfileOpen]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage('');
    setProfileError('');
    try {
      await updateProfile({ first_name: firstName, last_name: lastName });
      setProfileMessage('Profile updated successfully!');
    } catch (err: any) {
      setProfileError(err.response?.data?.detail || 'Failed to update profile');
    }
  };


  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-200 bg-white pb-safe pt-1 shadow-[0_-4px_24px_-12px_rgba(0,0,0,0.1)] sm:top-0 sm:bottom-auto sm:border-b sm:border-t-0 sm:pt-0">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-around px-2 sm:h-16 sm:max-w-none sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center justify-around w-full sm:w-auto sm:justify-start sm:gap-6">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex flex-col items-center justify-center space-y-1 px-3 py-1 sm:flex-row sm:space-x-2 sm:space-y-0 sm:px-4 ${
                    isActive ? 'text-brand-600' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  <item.icon className={`h-5 w-5 sm:h-4 sm:w-4 ${isActive ? 'fill-brand-50' : ''}`} />
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
                className="flex flex-col items-center justify-center space-y-1 px-3 py-1 text-stone-500 hover:text-stone-900 sm:flex-row sm:space-x-2 sm:space-y-0 sm:px-4"
              >
                <User className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="text-[10px] font-medium sm:text-sm">Profile</span>
              </button>
            )}
          </div>

          {/* Desktop Add Visit Button (Hidden for Staff as they have it in nav) */}
          {user && user.role !== 'STAFF' && (
            <button 
              onClick={() => setIsAddVisitOpen(true)} 
              className="hidden sm:flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl hover:bg-brand-700 transition-colors shadow-soft active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm font-bold">Add Visit</span>
            </button>
          )}
        </div>
      </nav>

      {/* Mobile FAB (Hidden for Staff) */}
      {user && user.role !== 'STAFF' && (
        <button 
          onClick={() => setIsAddVisitOpen(true)} 
          className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg hover:bg-brand-700 transition-colors sm:hidden active:scale-95"
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
      <Drawer isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} title="User Profile">
        <div className="p-4 space-y-6">
          {/* User Info */}
          <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-2xl">
            <div className="h-12 w-12 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center font-bold text-lg">
              {firstName ? firstName.charAt(0).toUpperCase() : user?.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-base font-bold text-stone-900">
                {firstName || lastName ? `${firstName} ${lastName}`.trim() : user?.username}
              </p>
              <p className="text-sm text-stone-500 capitalize">{user?.role.toLowerCase()}</p>
            </div>
          </div>

          {/* Subscription Section */}
          {user?.role === 'OWNER' && (
            <div className="border-b border-stone-100 pb-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 font-extrabold">Subscription Plan</h3>
                  <p className="text-xs text-stone-500 font-semibold">Currently on <span className="font-extrabold text-brand-600 uppercase">{user?.plan || 'STARTER'}</span></p>
                </div>
                <button 
                  onClick={() => setIsPlanOpen(!isPlanOpen)}
                  type="button"
                  className="text-xs font-bold text-brand-600 border border-brand-200 bg-brand-50 px-2.5 py-1 rounded-lg hover:bg-brand-100 transition-all active:scale-95"
                >
                  {isPlanOpen ? 'Hide Plans' : 'Change Plan'}
                </button>
              </div>

              {isPlanOpen && (
                <div className="space-y-3 pt-2 animate-slide-up">
                  {[
                    { name: 'STARTER', price: '$49/mo', desc: 'Core visit entry & tracking', features: ['Quick visit entry', 'Customer logs'], tier: 1 },
                    { name: 'GROWTH', price: '$99 - $149/mo', desc: 'Loyalty programs & messaging campaigns', features: ['Loyalty Rewards', 'Smart Segments', 'SMS Campaigns'], tier: 2 },
                    { name: 'PRO', price: '$249 - $299/mo', desc: 'Predictive churn intelligence & automation', features: ['AI Recommendations', 'Churn Risk Scoring', 'Automation pilots'], tier: 3 },
                    { name: 'ENTERPRISE_READY', price: 'Custom', desc: 'Multi-location, fine-grained access control', features: ['Enterprise multitenancy', 'Priority support'], tier: 4 },
                  ].map((p) => {
                    const isCurrent = (user?.plan || 'STARTER') === p.name;
                    
                    return (
                      <div 
                        key={p.name} 
                        onClick={() => {
                          setSelectedPlanDetails(p);
                        }}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col gap-2 relative overflow-hidden ${
                          isCurrent 
                            ? 'border-brand-500 bg-brand-50/30 ring-2 ring-brand-500/10' 
                            : 'border-stone-200 bg-white hover:border-brand-400 hover:shadow-soft active:scale-[0.98] cursor-pointer'
                        }`}
                      >

                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black text-stone-900 uppercase tracking-wide">{p.name.replace('_', ' ')}</span>
                              {isCurrent && (
                                <span className="bg-brand-600 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full">Active</span>
                              )}
                            </div>
                            <p className="text-[10px] text-stone-500 font-medium mt-0.5">{p.desc}</p>
                          </div>
                          <span className="text-xs font-black text-stone-900">{p.price}</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 border-t border-dashed border-stone-150 pt-2">
                          {p.features.map(f => (
                            <span key={f} className="text-[9px] text-stone-400 font-bold flex items-center gap-0.5">• {f}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {planMessage && (
                    <p className={`text-[10px] font-bold text-center ${planMessage.includes('Successfully') ? 'text-green-600' : 'text-red-600'}`}>
                      {planMessage}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Profile Details Form */}
          <form onSubmit={handleUpdateProfile} className="space-y-4 border-b border-stone-100 pb-6">
            <h3 className="text-sm font-bold text-stone-900">Profile Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-200 p-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-200 p-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="Optional"
                />
              </div>
            </div>

            {profileMessage && <p className="text-xs font-bold text-green-600">{profileMessage}</p>}
            {profileError && <p className="text-xs font-bold text-red-600">{profileError}</p>}

            <button
              type="submit"
              className="w-full bg-stone-900 text-white py-2.5 rounded-xl font-bold hover:bg-stone-800 transition-colors active:scale-95 text-sm"
            >
              Update Profile
            </button>
          </form>

          {/* Change Password Form */}
          <form onSubmit={handleChangePassword} className="space-y-4">
            <h3 className="text-sm font-bold text-stone-900">Change Password</h3>
            
            <div>
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-200 p-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-200 p-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                required
              />
            </div>

            {pwMessage && <p className="text-xs font-bold text-green-600">{pwMessage}</p>}
            {pwError && <p className="text-xs font-bold text-red-600">{pwError}</p>}

            <button
              type="submit"
              className="w-full bg-brand-600 text-white py-2.5 rounded-xl font-bold hover:bg-brand-700 transition-colors active:scale-95"
            >
              Update Password
            </button>
          </form>

          {/* Logout */}
          <div className="border-t border-stone-100 pt-4">
            <button
              onClick={() => {
                setIsProfileOpen(false);
                logout();
              }}
              className="w-full flex items-center justify-center gap-2 border border-stone-200 text-stone-700 py-2.5 rounded-xl font-bold hover:bg-stone-50 transition-colors active:scale-95"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </Drawer>

      {/* Plan Details & Features Modal */}
      {selectedPlanDetails && (() => {
        const details = {
          'STARTER': {
            desc: 'Best for new venues starting to build their customer records.',
            list: [
              '⚡ Quick Add Visit (record in under 5 seconds)',
              '📊 Basic Customer Log & activity list',
              '👤 Individual Customer Profiles (view contact & visit counts)',
            ]
          },
          'GROWTH': {
            desc: 'For growing venues focused on guest loyalty & basic segment marketing.',
            list: [
              '🎁 Loyalty Rewards System (custom milestone rewards & automated tracking)',
              '🏷️ Smart Segment Tagging (New, Healthy, VIP tags on customer lists)',
              '💬 Scheduled SMS Marketing (broadcast text message campaigns)',
              '⚡ Quick Add Visit & Basic Customer Logs',
            ]
          },
          'PRO': {
            desc: 'Advanced predictive insights, churn detection, and AI recommendations.',
            list: [
              '🔮 Predictive Churn Risk Scoring (identify guest drop-offs early)',
              '🤖 AI Automated Growth Recommendations & insight cards',
              '📈 Intelligence tab dashboard KPIs & analytics',
              '🎁 All Growth & Starter features included',
            ]
          },
          'ENTERPRISE_READY': {
            desc: 'Enterprise multi-location workspace support and advanced workspace controls.',
            list: [
              '🏢 Multi-tenant brand & venue location workspaces',
              '🔑 Fine-grained access control & custom user roles',
              '📞 Priority support & custom service level agreements (SLAs)',
              '🔮 All Pro feature sets included',
            ]
          }
        }[selectedPlanDetails.name as 'STARTER' | 'GROWTH' | 'PRO' | 'ENTERPRISE_READY'] || { desc: '', list: [] };

        const isCurrent = (user?.plan || 'STARTER') === selectedPlanDetails.name;

        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-150 overflow-hidden animate-scale-in">
              {/* Header */}
              <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between bg-stone-50">
                <div>
                  <h3 className="text-sm font-extrabold text-stone-900 uppercase tracking-wide">
                    {selectedPlanDetails.name.replace('_', ' ')} Plan
                  </h3>
                  <p className="text-[11px] text-stone-500 font-semibold mt-0.5">Feature breakdown & access overview</p>
                </div>
                <button 
                  onClick={() => setSelectedPlanDetails(null)}
                  className="text-stone-400 hover:text-stone-600 font-black text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-5">
                {/* Plan Price & Status Badge */}
                <div className="p-4 bg-stone-50 border border-stone-150 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-[9px] uppercase font-black text-stone-400 tracking-wider">Plan Pricing</span>
                    <p className="text-base font-black text-stone-900 mt-0.5">{selectedPlanDetails.price}</p>
                  </div>
                  {isCurrent ? (
                    <span className="bg-brand-600 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-full">
                      Currently Active
                    </span>
                  ) : (
                    <span className="bg-stone-200 text-stone-700 text-[9px] font-black uppercase px-2.5 py-1 rounded-full">
                      Available Tier
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-stone-600 font-medium leading-relaxed">
                  {details.desc}
                </p>

                {/* Checklist */}
                <div className="space-y-2.5">
                  <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{"What's Included"}</h4>
                  <ul className="space-y-2">
                    {details.list.map((item, idx) => (
                      <li key={idx} className="text-xs text-stone-700 font-semibold flex items-start gap-2">
                        <span className="text-green-500">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Notice */}
                <div className="p-3 bg-brand-50/30 border border-brand-100 rounded-xl">
                  <p className="text-[10px] text-brand-800 font-bold leading-normal">
                    💡 Plan upgrades are securely managed via the workspace administration panel. To request an upgrade or switch tiers, please reach out to your venue manager or workspace owner.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPlanDetails(null)}
                    className="flex-1 border border-stone-200 hover:bg-stone-50 text-stone-700 font-bold py-2.5 rounded-xl text-xs transition-all active:scale-95"
                  >
                    Close
                  </button>
                  <a
                    href={`mailto:nexra.dev@gmail.com?subject=TableBoost Subscription Upgrade Request - ${selectedPlanDetails.name}`}
                    className="flex-1 bg-brand-600 hover:bg-brand-700 text-white text-center font-bold py-2.5 rounded-xl text-xs transition-all active:scale-95 flex items-center justify-center"
                  >
                    Request Upgrade
                  </a>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
