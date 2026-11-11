import React from 'react';

export default function ScoreGauge({ 
  score = 0, 
  assessment = 0, 
  completion = 0, 
  consistency = 0,
  size = 140 
}) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, score));
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="url(#gaugeGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="50%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-extrabold tracking-tight text-white">{Math.round(score)}</span>
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Overall</span>
        </div>
      </div>

      {/* Sub-metrics breakdown */}
      <div className="w-full mt-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Assessment (60%)</span>
          <span className="font-semibold text-slate-200">{Math.round(assessment)}%</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, assessment)}%` }} />
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-slate-400">Completion (25%)</span>
          <span className="font-semibold text-slate-200">{Math.round(completion)}%</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, completion)}%` }} />
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-slate-400">Consistency (15%)</span>
          <span className="font-semibold text-slate-200">{Math.round(consistency)}%</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, consistency)}%` }} />
        </div>
      </div>
    </div>
  );
}
