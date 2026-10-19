import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Car, Bell, Shield, User as UserIcon, LogOut, Compass, PlusCircle, CheckCircle } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab }) => {
  const { user, logout, isAdmin } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    if (user) {
      api.getNotifications()
        .then(list => {
          const unread = list.filter(n => n.is_read === 'N').length;
          setUnreadCount(unread);
        })
        .catch(() => {});
    }
  }, [user, currentTab]);

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <div 
          onClick={() => onSelectTab('dashboard')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition">
            <Car className="text-white" size={22} />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                SynRide
              </span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                VIT
              </span>
            </div>
            <p className="text-[11px] text-slate-400 -mt-0.5">Campus Ride-Pooling</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        {user && (
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                currentTab === 'dashboard' 
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => onSelectTab('rides')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                currentTab === 'rides' 
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Find Rides
            </button>
            <button
              onClick={() => onSelectTab('request')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                currentTab === 'request' 
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Post Ride
            </button>
            <button
              onClick={() => onSelectTab('routes')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                currentTab === 'routes' 
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Routes & Fares
            </button>

            {isAdmin && (
              <button
                onClick={() => onSelectTab('admin')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition ${
                  currentTab === 'admin' 
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' 
                    : 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/40'
                }`}
              >
                <Shield size={14} />
                <span>Admin Console</span>
              </button>
            )}
          </nav>
        )}

        {/* User Right Menu */}
        <div className="flex items-center space-x-3">
          {user ? (
            <>
              {/* Notifications Bell */}
              <button
                onClick={() => onSelectTab('notifications')}
                className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
                title="Notifications"
              >
                <Bell size={19} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-[10px] font-bold text-slate-950 flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Profile Pill */}
              <div 
                onClick={() => onSelectTab('profile')}
                className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-semibold text-xs border border-emerald-500/30">
                  {user.full_name.charAt(0)}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-white leading-tight">
                    {user.full_name}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase font-medium">
                    {user.user_role}
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition"
                title="Log Out"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onSelectTab('login')}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800 transition"
              >
                Sign In
              </button>
              <button
                onClick={() => onSelectTab('register')}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition"
              >
                Register
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
