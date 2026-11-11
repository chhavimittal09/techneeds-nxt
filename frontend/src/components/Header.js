'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Search, LogOut, User, Sparkles } from './Icons';
import Avatar from './Avatar';
import NotificationDropdown from './NotificationDropdown';
import GlobalSearch from './GlobalSearch';

export default function Header({ title = 'Dashboard' }) {
  const { user, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-surface-300/80 backdrop-blur-md border-b border-white/5 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-semibold text-white tracking-wide">{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Search Button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-200 border border-white/10 text-slate-400 hover:text-slate-200 text-xs transition-colors"
          >
            <Search size={14} />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden sm:inline px-1.5 py-0.5 rounded bg-surface-100 text-[10px] text-slate-400 border border-white/5 font-mono">
              Ctrl+K
            </kbd>
          </button>

          {/* Notifications */}
          <NotificationDropdown />

          {/* User Profile Capsule */}
          {user && (
            <div className="flex items-center gap-2.5 pl-2 border-l border-white/10">
              <Avatar avatar={user.avatar} name={user.name} size={30} />
              <div className="hidden md:flex flex-col">
                <span className="text-xs font-medium text-white leading-tight">{user.name}</span>
                <span className="text-[10px] text-indigo-400 capitalize font-medium">{user.role}</span>
              </div>
              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-1"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </header>

      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
