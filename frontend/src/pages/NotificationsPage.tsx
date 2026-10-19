import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Notification } from '../types';
import { Bell, CheckCheck, Clock, ArrowRight } from 'lucide-react';
import { AlertBanner } from '../components/AlertBanner';

interface NotificationsPageProps {
  onNavigateGroup: (groupId: number) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ onNavigateGroup }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const list = await api.getNotifications();
      setNotifications(list);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (notifId: number) => {
    try {
      await api.markNotificationRead(notifId);
      setNotifications(prev => prev.map(n => n.notification_id === notifId ? { ...n, is_read: 'Y' } : n));
    } catch {
      // silently ignore
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Activity & Alerts</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time in-app notifications and email dispatch logs.
          </p>
        </div>
        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400">
          <Bell size={18} />
        </div>
      </div>

      {error && <AlertBanner type="error" message={error} />}

      {loading ? (
        <div className="p-16 text-center text-slate-500 glass-panel rounded-2xl">
          Loading notifications...
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-16 text-center glass-panel rounded-2xl border border-slate-800">
          <Bell size={32} className="mx-auto text-slate-600 mb-3" />
          <h4 className="text-sm font-semibold text-slate-300">No notifications yet</h4>
          <p className="text-xs text-slate-500 mt-1">
            Ride confirmations, coordinator updates, and departure reminders will show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const isUnread = n.is_read === 'N';

            return (
              <div
                key={n.notification_id}
                className={`p-4 rounded-2xl border transition flex items-start justify-between gap-4 ${
                  isUnread
                    ? 'bg-slate-900/90 border-emerald-500/40 shadow-sm shadow-emerald-500/5'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      isUnread ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {n.notification_type}
                    </span>
                    <span className="text-[11px] text-slate-500 flex items-center space-x-1">
                      <Clock size={11} />
                      <span>{new Date(n.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </span>
                  </div>

                  <p className={`text-xs ${isUnread ? 'text-slate-200 font-medium' : 'text-slate-400'}`}>
                    {n.message}
                  </p>

                  {n.group_id && (
                    <button
                      onClick={() => onNavigateGroup(n.group_id!)}
                      className="text-[11px] font-semibold text-emerald-400 hover:underline flex items-center space-x-1 pt-1"
                    >
                      <span>View Group #{n.group_id}</span>
                      <ArrowRight size={11} />
                    </button>
                  )}
                </div>

                {isUnread && (
                  <button
                    onClick={() => handleMarkRead(n.notification_id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-slate-800 transition shrink-0"
                    title="Mark as Read"
                  >
                    <CheckCheck size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
