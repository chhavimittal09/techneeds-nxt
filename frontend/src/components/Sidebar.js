'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
  Home,
  BookOpen,
  Trophy,
  Users,
  BarChart3,
  Sparkles,
  Layers,
  GraduationCap,
  Calendar,
  LogOut,
  FileText
} from './Icons';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const getLinks = () => {
    if (user?.role === 'admin') {
      return [
        { href: '/admin', label: 'Overview', icon: Home },
        { href: '/admin/programs', label: 'Programs & Cohorts', icon: Layers },
        { href: '/admin/mentors', label: 'Mentors', icon: GraduationCap },
        { href: '/admin/mentees', label: 'Mentees', icon: Users },
        { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
        { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
      ];
    }
    if (user?.role === 'mentor') {
      return [
        { href: '/mentor', label: 'Dashboard', icon: Home },
        { href: '/mentor/resources', label: 'Resources Studio', icon: BookOpen },
        { href: '/mentor/mentees', label: 'My Mentees', icon: Users },
        { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
      ];
    }
    // Mentee
    return [
      { href: '/mentee', label: 'Dashboard', icon: Home },
      { href: '/mentee/resources', label: 'Learning Hub', icon: BookOpen },
      { href: '/mentee/my-nxt', label: 'MY NXT Profile', icon: Sparkles, highlight: true },
      { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
      { href: '/mentee/feedback', label: 'Mentor Feedback', icon: FileText },
    ];
  };

  const links = getLinks();

  return (
    <aside className="w-64 bg-surface-300 border-r border-white/5 flex flex-col shrink-0 min-h-screen">
      {/* Brand Logo Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-glow-primary">
          <span className="font-extrabold text-white text-xs tracking-wider">TN</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-white tracking-wider flex items-center gap-1.5">
            TECHNEEDS <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500 text-white font-mono font-bold">NXT</span>
          </span>
          <span className="text-[10px] text-slate-400">IGDTUW Technical Society</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
          {user?.role ? `${user.role} Portal` : 'Navigation'}
        </div>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== '/admin' && link.href !== '/mentor' && link.href !== '/mentee' && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/25 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-indigo-400' : 'text-slate-400'} />
              <span>{link.label}</span>
              {link.highlight && (
                <span className="ml-auto px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  AI
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-white/5 bg-surface-300/40">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>TechNeeds 2026</span>
          <button onClick={logout} className="hover:text-rose-400 flex items-center gap-1">
            <LogOut size={12} /> Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
