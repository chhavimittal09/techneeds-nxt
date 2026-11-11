import React from 'react';
import { Award, CheckCircle2, Clock } from './Icons';

export default function BadgeCard({ badge }) {
  const isEarned = Boolean(badge.earned || badge.earnedAt);

  return (
    <div 
      className={`relative p-3.5 rounded-xl border transition-all duration-200 flex items-start gap-3 ${
        isEarned 
          ? 'bg-surface-200/90 border-indigo-500/30 shadow-glow-primary' 
          : 'bg-surface-300/40 border-white/5 opacity-55 hover:opacity-75'
      }`}
    >
      <div className={`p-2 rounded-lg shrink-0 ${isEarned ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
        <Award size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <h4 className="text-xs font-semibold text-white truncate">{badge.title || badge.name}</h4>
          {isEarned ? (
            <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-1 shrink-0">
              <CheckCircle2 size={11} /> Unlocked
            </span>
          ) : (
            <span className="text-[10px] text-slate-500 shrink-0">Locked</span>
          )}
        </div>
        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
          {badge.description || badge.criteria}
        </p>
        {isEarned && badge.earnedAt && (
          <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            <Clock size={10} /> {new Date(badge.earnedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}
