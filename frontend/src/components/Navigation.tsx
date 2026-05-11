'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, MessageSquare, Send, Settings } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Campaigns', href: '/campaigns', icon: Send },
    { name: 'Logs', href: '/messages', icon: MessageSquare },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-200 bg-white pb-safe pt-1 shadow-[0_-4px_24px_-12px_rgba(0,0,0,0.1)] sm:top-0 sm:bottom-auto sm:border-b sm:border-t-0 sm:pt-0">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-around px-2 sm:h-16 sm:max-w-none sm:justify-start sm:gap-6 sm:px-6 lg:px-8">
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
      </div>
    </nav>
  );
}
