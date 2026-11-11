'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { Bell, Check, Clock, ExternalLink } from './Icons';
import Link from 'next/link';

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data.items || []);
      setUnreadCount(data.unread || 0);
    } catch (e) {
      // Ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markNotificationsRead([]);
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      // Ignore
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-background animate-pulse" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-surface-200 border border-white/10 shadow-2xl overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-surface-300/60">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/20 text-indigo-400">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                <Check size={12} /> Mark read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No notifications yet.</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`p-3.5 hover:bg-white/5 transition-colors ${!n.read ? 'bg-indigo-950/20' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium text-slate-200">{n.title}</p>
                    <span className="text-[10px] text-slate-500 shrink-0">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {n.body && <p className="text-[11px] text-slate-400 mt-0.5">{n.body}</p>}
                  {n.link && (
                    <Link
                      href={n.link}
                      onClick={() => setOpen(false)}
                      className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 mt-1.5"
                    >
                      View details <ExternalLink size={10} />
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
