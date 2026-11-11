import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full bg-surface-300 border-t border-white/5 py-12 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center">
              <span className="font-extrabold text-white text-xs">TN</span>
            </div>
            <span className="text-xs font-bold text-white tracking-wider">
              TECHNEEDS <span className="text-indigo-400">NXT</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
            The next-generation technical mentorship ecosystem of Indira Gandhi Delhi Technical University for Women (IGDTUW). Fostering peer-to-peer technical excellence and real project development.
          </p>
          <p className="text-[11px] text-slate-500 font-mono">#all_you_need_to_know_about_tech</p>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Platform</h4>
          <ul className="space-y-2 text-xs text-slate-400">
            <li><Link href="/login" className="hover:text-white transition-colors">Sign In Portal</Link></li>
            <li><Link href="/leaderboard" className="hover:text-white transition-colors">Dynamic Leaderboard</Link></li>
            <li><Link href="/about" className="hover:text-white transition-colors">Society Showcase</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Society</h4>
          <ul className="space-y-2 text-xs text-slate-400">
            <li><span className="text-slate-300">IGDTUW Kashmere Gate</span></li>
            <li><span className="text-slate-400">New Delhi - 110006</span></li>
            <li className="pt-2 text-[11px] text-slate-500">REIMAGATHON 2026 Submission</li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500">
        <p>© 2026 TechNeeds IGDTUW. Built for REIMAGATHON.</p>
        <p className="mt-2 sm:mt-0 font-mono">TECHNEEDS NXT v1.0.0</p>
      </div>
    </footer>
  );
}
