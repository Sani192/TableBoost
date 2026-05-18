'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, MessageSquare, Send, Settings, Plus, LogOut, User } from 'lucide-react';
import Drawer from '@/components/ui/Drawer';
import AddVisitForm from '@/components/AddVisitForm';
import { useAuth } from '@/context/AuthContext';
import { changePassword, getProfile, updateProfile } from '@/lib/api';

export default function Navigation() {
  const pathname = usePathname();
  const [isAddVisitOpen, setIsAddVisitOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwMessage, setPwMessage] = useState('');
  const [pwError, setPwError] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');

  const isCustomerPage = pathname?.startsWith('/customers/');
  const customerIdStr = isCustomerPage ? pathname.split('/')[2] : null;
  const customerId = customerIdStr && !isNaN(Number(customerIdStr)) ? Number(customerIdStr) : undefined;

  const allNavItems = [
    { name: 'Home', href: '/', icon: Home, roles: ['OWNER', 'MANAGER'] },
    { name: 'Customers', href: '/customers', icon: Users, roles: ['OWNER', 'MANAGER'] },
    { name: 'Campaigns', href: '/campaigns', icon: Send, roles: ['OWNER', 'MANAGER'] },
    { name: 'Logs', href: '/messages', icon: MessageSquare, roles: ['OWNER', 'MANAGER'] },
    { name: 'Settings', href: '/settings', icon: Settings, roles: ['OWNER'] },
    { name: 'Add Visit', href: '/add-visit', icon: Plus, roles: ['STAFF'] },
  ];

  const navItems = allNavItems.filter(item => user && item.roles.includes(user.role));

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
    </>
  );
}
