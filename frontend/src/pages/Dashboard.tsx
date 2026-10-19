import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { RideGroup } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { AlertBanner } from '../components/AlertBanner';
import { Car, Clock, Users, IndianRupee, MapPin, ArrowRight, ShieldAlert, Sparkles, Star } from 'lucide-react';

interface DashboardProps {
  onNavigateTab: (tab: string, groupId?: number) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const [myGroups, setMyGroups] = useState<RideGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const groups = await api.getMyGroups();
      setMyGroups(groups);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const activeGroups = myGroups.filter(g => ['PENDING', 'CONFIRMED'].includes(g.group_status));
  const completedCount = myGroups.filter(g => g.group_status === 'COMPLETED').length;

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden p-8 rounded-3xl glass-panel border border-slate-700/60 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold mb-3">
              <Sparkles size={14} />
              <span>Verified Campus Coordination</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Hello, {user?.full_name}!
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Connect with fellow VIT {user?.user_role === 'STUDENT' ? 'students' : 'colleagues'} to coordinate shared rides, reduce individual travel costs, and manage group travel transparently.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => onNavigateTab('request')}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold text-sm flex items-center space-x-2 shadow-lg shadow-emerald-600/25 transition"
            >
              <Car size={18} />
              <span>Post Ride</span>
            </button>
            <button
              onClick={() => onNavigateTab('rides')}
              className="px-5 py-3 rounded-2xl bg-slate-900/90 border border-slate-700 hover:border-slate-600 text-white font-medium text-sm flex items-center space-x-2 transition"
            >
              <span>Find Companions</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Background decorative glow */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      </div>

      {error && <AlertBanner type="error" message={error} />}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl glass-panel border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Trips</span>
            <Clock size={18} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{activeGroups.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">Pending or Confirmed</p>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed</span>
            <Users size={18} className="text-teal-400" />
          </div>
          <div className="text-2xl font-bold text-white">{completedCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Finished shared rides</p>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Peer Rating</span>
            <Star size={18} className="text-amber-400 fill-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {user?.average_rating ? user.average_rating.toFixed(1) : '5.0'}
            <span className="text-xs text-slate-400 font-normal ml-1">/ 5.0</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{user?.total_reviews || 0} peer review(s)</p>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Estimated Savings</span>
            <IndianRupee size={18} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            ₹{completedCount > 0 ? completedCount * 160 : 160}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Cost split efficiency</p>
        </div>
      </div>

      {/* Active Groups Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <span>My Active Ride Groups</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
              {activeGroups.length}
            </span>
          </h2>
          <button
            onClick={() => onNavigateTab('rides')}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
          >
            <span>Browse All Groups</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 glass-panel rounded-2xl">
            Loading your ride groups...
          </div>
        ) : activeGroups.length === 0 ? (
          <div className="p-12 text-center glass-panel rounded-2xl border border-slate-800">
            <Car size={36} className="mx-auto text-slate-600 mb-3" />
            <h4 className="text-base font-semibold text-slate-300">No active ride groups currently</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Join an existing route or post a ride to Katpadi Station, Bus Stand, or CMC to start coordinating.
            </p>
            <button
              onClick={() => onNavigateTab('rides')}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-white hover:bg-slate-800 transition"
            >
              Explore Available Rides
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeGroups.map((grp) => (
              <div
                key={grp.group_id}
                onClick={() => onNavigateTab('group_detail', grp.group_id)}
                className="p-6 rounded-2xl glass-panel-interactive border border-slate-800 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <StatusBadge status={grp.group_status} type="group" />
                    <span className="text-xs font-semibold text-slate-400 flex items-center space-x-1">
                      <Users size={13} />
                      <span>{grp.active_member_count}/3 seats</span>
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-start space-x-2 text-sm font-semibold text-white">
                      <MapPin size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <div>{grp.pickup_location}</div>
                        <div className="text-xs text-slate-400 font-normal">to {grp.destination}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-xs text-slate-400 pt-1">
                      <Clock size={14} className="text-slate-500" />
                      <span>{new Date(grp.departure_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500">Est. Total: </span>
                    <span className="font-bold text-white">₹{grp.estimated_fare || 250}</span>
                  </div>
                  <span className="font-semibold text-emerald-400 hover:underline flex items-center space-x-1">
                    <span>Manage</span>
                    <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
