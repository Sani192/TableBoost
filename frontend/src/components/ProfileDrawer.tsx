'use client';
import React, { useState, useEffect } from 'react';
import { LogOut, User, Sun, Moon } from 'lucide-react';
import Drawer from '@/components/ui/Drawer';
import { useAuth } from '@/context/AuthContext';
import { changePassword, getProfile, updateProfile } from '@/lib/api';
import PlanDetailsModal from '@/components/PlanDetailsModal';
import ThemeToggle from '@/components/ui/ThemeToggle';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileDrawer({ isOpen, onClose }: ProfileDrawerProps) {
  const { user, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwMessage, setPwMessage] = useState('');
  const [pwError, setPwError] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');

  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [selectedPlanDetails, setSelectedPlanDetails] = useState<any | null>(null);

  useEffect(() => {
    if (isOpen) {
      getProfile().then(res => {
        if (res.first_name) setFirstName(res.first_name);
        if (res.last_name) setLastName(res.last_name);
      }).catch(console.error);
    }
  }, [isOpen]);

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

  const plans = [
    { name: 'STARTER', price: '$49/mo', desc: 'Core visit entry & tracking', features: ['Quick visit entry', 'Customer logs'], tier: 1 },
    { name: 'GROWTH', price: '$99 - $149/mo', desc: 'Loyalty programs & messaging campaigns', features: ['Loyalty Rewards', 'Smart Segments', 'SMS Campaigns'], tier: 2 },
    { name: 'PRO', price: '$249 - $299/mo', desc: 'Predictive churn intelligence & automation', features: ['AI Recommendations', 'Churn Risk Scoring', 'Automation pilots'], tier: 3 },
    { name: 'ENTERPRISE_READY', price: 'Custom', desc: 'Multi-location, fine-grained access control', features: ['Enterprise multitenancy', 'Priority support'], tier: 4 },
  ];

  return (
    <>
      <Drawer isOpen={isOpen} onClose={onClose} title="User Profile">
        <div className="p-4 space-y-6">
          {/* User Info */}
          <div className="flex items-center gap-4 p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl">
            <div className="h-12 w-12 bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 rounded-full flex items-center justify-center font-bold text-lg">
              {firstName ? firstName.charAt(0).toUpperCase() : user?.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-base font-bold text-stone-900 dark:text-stone-100">
                {firstName || lastName ? `${firstName} ${lastName}`.trim() : user?.username}
              </p>
              <p className="text-sm text-stone-500 dark:text-stone-400 capitalize">{user?.role.toLowerCase()}</p>
            </div>
          </div>

          {/* Appearance */}
          <div className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl">
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">Appearance</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">Toggle dark/light mode</p>
            </div>
            <ThemeToggle />
          </div>

          {user?.role === 'OWNER' && (
            <div className="border-b border-stone-100 dark:border-stone-700 pb-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-extrabold">Subscription Plan</h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 font-semibold">Currently on <span className="font-extrabold text-brand-600 dark:text-brand-400 uppercase">{user?.plan || 'STARTER'}</span></p>
                </div>
                <button 
                  onClick={() => setIsPlanOpen(!isPlanOpen)}
                  type="button"
                  className="text-xs font-bold text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-700 bg-brand-50 dark:bg-brand-900/30 px-2.5 py-1 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-all active:scale-95"
                >
                  {isPlanOpen ? 'Hide Plans' : 'Change Plan'}
                </button>
              </div>

              {isPlanOpen && (
                <div className="space-y-3 pt-2 animate-slide-up">
                  {plans.map((p) => {
                    const isCurrent = (user?.plan || 'STARTER') === p.name;
                    
                    return (
                      <div 
                        key={p.name} 
                        onClick={() => setSelectedPlanDetails(p)}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col gap-2 relative overflow-hidden ${
                          isCurrent 
                            ? 'border-brand-500 bg-brand-50/30 dark:bg-brand-900/20 ring-2 ring-brand-500/10' 
                            : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:border-brand-400 hover:shadow-soft active:scale-[0.98] cursor-pointer'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-wide">{p.name.replace('_', ' ')}</span>
                              {isCurrent && (
                                <span className="bg-brand-600 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full">Active</span>
                              )}
                            </div>
                            <p className="text-[10px] text-stone-500 dark:text-stone-400 font-medium mt-0.5">{p.desc}</p>
                          </div>
                          <span className="text-xs font-black text-stone-900 dark:text-stone-100">{p.price}</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 border-t border-dashed border-stone-150 dark:border-stone-700 pt-2">
                          {p.features.map(f => (
                            <span key={f} className="text-[9px] text-stone-400 dark:text-stone-500 font-bold flex items-center gap-0.5">• {f}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Profile Details Form */}
          <form onSubmit={handleUpdateProfile} className="space-y-4 border-b border-stone-100 dark:border-stone-700 pb-6">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">Profile Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-3 text-sm text-stone-900 dark:text-stone-100 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-3 text-sm text-stone-900 dark:text-stone-100 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="Optional"
                />
              </div>
            </div>

            {profileMessage && <p className="text-xs font-bold text-green-600">{profileMessage}</p>}
            {profileError && <p className="text-xs font-bold text-red-600">{profileError}</p>}

            <button
              type="submit"
              className="w-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 py-2.5 rounded-xl font-bold hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors active:scale-95 text-sm"
            >
              Update Profile
            </button>
          </form>

          {/* Change Password Form */}
          <form onSubmit={handleChangePassword} className="space-y-4">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">Change Password</h3>
            
            <div>
              <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-3 text-sm text-stone-900 dark:text-stone-100 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-3 text-sm text-stone-900 dark:text-stone-100 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
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
          <div className="border-t border-stone-100 dark:border-stone-700 pt-4">
            <button
              onClick={() => {
                onClose();
                logout();
              }}
              className="w-full flex items-center justify-center gap-2 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 py-2.5 rounded-xl font-bold hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors active:scale-95"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </Drawer>

      {/* Plan Details Modal */}
      {selectedPlanDetails && (
        <PlanDetailsModal
          plan={selectedPlanDetails}
          currentPlan={user?.plan || 'STARTER'}
          onClose={() => setSelectedPlanDetails(null)}
        />
      )}
    </>
  );
}
