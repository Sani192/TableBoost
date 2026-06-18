'use client';
import React, { useState, useEffect } from 'react';
import { LogOut, User, Sun, Moon } from 'lucide-react';
import Drawer from '@/components/ui/Drawer';
import { useAuth } from '@/context/AuthContext';
import { changePassword, getProfile, updateProfile } from '@/lib/api';
import SubscriptionPlansModal from '@/components/SubscriptionPlansModal';
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

  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

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

          {user?.role === 'OWNER' && (
            <div className="border-b border-stone-100 dark:border-stone-700 pb-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-extrabold">Subscription Plan</h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 font-semibold">Currently on <span className="font-extrabold text-brand-600 dark:text-brand-400 uppercase">{user?.plan || 'STARTER'}</span></p>
                </div>
                <button 
                  onClick={() => setIsSubscriptionModalOpen(true)}
                  type="button"
                  className="text-xs font-bold text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-700 bg-brand-50 dark:bg-brand-900/30 px-2.5 py-1 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-all active:scale-95"
                >
                  Change Plan
                </button>
              </div>
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
              className="w-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 py-2.5 rounded-xl font-bold hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors active:scale-95 text-sm"
            >
              Change Password
            </button>
          </form>

          {/* Sign Out Button */}
          <div className="border-t border-stone-100 dark:border-stone-700 pt-6">
            <button
              onClick={() => {
                onClose();
                logout();
              }}
              type="button"
              className="w-full flex items-center justify-center gap-2 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 py-2.5 rounded-xl font-bold border border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors active:scale-95 text-sm"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>


        </div>
      </Drawer>

      {/* Unified Subscription Plans Modal */}
      {isSubscriptionModalOpen && (
        <SubscriptionPlansModal onClose={() => setIsSubscriptionModalOpen(false)} />
      )}
    </>
  );
}
