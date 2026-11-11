import React from 'react';

export default function SkillConstellation({ skills = [] }) {
  if (!skills || skills.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
        <p className="text-sm">Complete learning activities to generate your skill constellation.</p>
      </div>
    );
  }

  const size = 320;
  const center = size / 2;
  const radius = size * 0.38;
  const numSkills = skills.length;
  const angleStep = (2 * Math.PI) / numSkills;

  const points = skills.map((skill, index) => {
    const angle = index * angleStep - Math.PI / 2;
    const value = skill.proficiency !== null && skill.proficiency !== undefined ? skill.proficiency : 25;
    const normalized = Math.max(0.15, Math.min(1, value / 100));
    const dist = radius * normalized;
    return {
      name: skill.name,
      proficiency: skill.proficiency,
      source: skill.source,
      x: center + dist * Math.cos(angle),
      y: center + dist * Math.sin(angle),
      outerX: center + (radius + 24) * Math.cos(angle),
      outerY: center + (radius + 24) * Math.sin(angle),
      edgeX: center + radius * Math.cos(angle),
      edgeY: center + radius * Math.sin(angle),
    };
  });

  const polygonPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <div className="relative w-full flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        <defs>
          <linearGradient id="constellationGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.15" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Concentric Grid Rings */}
        {[0.25, 0.5, 0.75, 1.0].map((level, i) => (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={radius * level}
            fill="none"
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth="1"
            strokeDasharray={level < 1 ? '3 3' : 'none'}
          />
        ))}

        {/* Axis Lines from Center */}
        {points.map((p, i) => (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={p.edgeX}
            y2={p.edgeY}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="1"
          />
        ))}

        {/* Polygon Area */}
        <path
          d={polygonPath}
          fill="url(#constellationGrad)"
          stroke="#6366F1"
          strokeWidth="2"
          filter="url(#glow)"
        />

        {/* Constellation Nodes */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="5" fill="#6366F1" stroke="#FFFFFF" strokeWidth="1.5" />
            <circle cx={p.x} cy={p.y} r="10" fill="#6366F1" opacity="0.25" />
          </g>
        ))}
      </svg>

      {/* Skill Labels & Proficiency List */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-4">
        {skills.map((s, i) => (
          <div key={i} className="p-2.5 rounded-lg bg-surface-200/60 border border-white/5 flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-300 truncate">{s.name}</span>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs font-semibold text-indigo-400">
                {s.proficiency !== null ? `${s.proficiency}%` : 'Interest'}
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">{s.source}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
