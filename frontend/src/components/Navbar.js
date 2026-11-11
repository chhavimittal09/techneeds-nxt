'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Sparkles, Trophy, ArrowRight, User } from './Icons';

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();

  const getDashboardLink = () => {
    if (user?.role === 'admin') return '/admin';
    if (user?.role === 'mentor') return '/mentor';
    return '/mentee';
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-glow-primary">
            <span className="font-extrabold text-white text-xs tracking-wider">TN</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white tracking-wider flex items-center gap-1.5">
              TECHNEEDS <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500 text-white font-mono font-bold">NXT</span>
            </span>
            <span className="text-[10px] text-slate-400">IGDTUW Technical Society</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
          <Link href="/#mentorship" className="hover:text-white transition-colors">Mentorship</Link>
          <Link href="/#domains" className="hover:text-white transition-colors">Tracks</Link>
          <Link href="/leaderboard" className="hover:text-white transition-colors flex items-center gap-1">
            <Trophy size={13} className="text-amber-400" /> Leaderboard
          </Link>
          <Link href="/about" className="hover:text-white transition-colors">About Society</Link>
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              href={getDashboardLink()}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              <span>Go to {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ''} Panel</span>
              <ArrowRight size={14} />
            </Link>
          ) : (
            <Link
              href="/login"
              className="btn-primary text-xs flex items-center gap-1.5 shadow-glow-primary"
            >
              <span>Sign In</span>
              <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
