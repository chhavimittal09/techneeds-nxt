import React from 'react';

export default function Avatar({ 
  avatar, 
  name = '', 
  size = 40, 
  className = '',
  showRing = true 
}) {
  const style = avatar?.style || 'orbit';
  const accent = avatar?.accent || '#6366F1';
  const initials = avatar?.initials || (name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'TN');

  const renderPattern = () => {
    switch (style) {
      case 'prism':
        return (
          <>
            <polygon points="0,0 100,0 50,100" fill="url(#prismGrad1)" opacity="0.6" />
            <polygon points="100,0 100,100 50,100" fill="url(#prismGrad2)" opacity="0.5" />
            <polygon points="0,0 0,100 50,100" fill="url(#prismGrad3)" opacity="0.4" />
          </>
        );
      case 'pixel':
        return (
          <>
            <rect x="10" y="10" width="20" height="20" fill={accent} opacity="0.8" />
            <rect x="40" y="20" width="20" height="20" fill="#8B5CF6" opacity="0.6" />
            <rect x="70" y="10" width="20" height="20" fill={accent} opacity="0.5" />
            <rect x="20" y="60" width="20" height="20" fill="#06B6D4" opacity="0.7" />
            <rect x="60" y="70" width="20" height="20" fill={accent} opacity="0.8" />
          </>
        );
      case 'wave':
        return (
          <>
            <path d="M0 40 Q25 20, 50 40 T100 40 V100 H0 Z" fill="url(#waveGrad)" opacity="0.7" />
            <path d="M0 60 Q25 40, 50 60 T100 60 V100 H0 Z" fill={accent} opacity="0.4" />
          </>
        );
      case 'grid':
        return (
          <>
            <line x1="25" y1="0" x2="25" y2="100" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <line x1="75" y1="0" x2="75" y2="100" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <line x1="0" y1="75" x2="100" y2="75" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <circle cx="50" cy="50" r="18" fill={accent} opacity="0.3" />
          </>
        );
      case 'orbit':
      default:
        return (
          <>
            <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeDasharray="3 3" />
            <circle cx="50" cy="50" r="26" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.6" />
            <circle cx="76" cy="50" r="4" fill={accent} />
            <circle cx="32" cy="68" r="3" fill="#8B5CF6" />
          </>
        );
    }
  };

  return (
    <div 
      className={`relative inline-flex items-center justify-center rounded-xl overflow-hidden shrink-0 select-none ${showRing ? 'ring-1 ring-white/10 shadow-sm' : ''} ${className}`}
      style={{ width: size, height: size, background: '#0F172A' }}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="prismGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={accent} />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
          <linearGradient id="prismGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor={accent} />
          </linearGradient>
          <linearGradient id="prismGrad3" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#090D16" />
          </linearGradient>
          <linearGradient id="waveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={accent} />
            <stop offset="100%" stopColor="#090D16" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill="#0D1322" />
        {renderPattern()}
      </svg>
      <span 
        className="relative z-10 font-bold text-white tracking-wider"
        style={{ fontSize: Math.max(10, Math.floor(size * 0.36)) }}
      >
        {initials}
      </span>
    </div>
  );
}
