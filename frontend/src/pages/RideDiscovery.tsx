import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { RideGroup } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { AlertBanner } from '../components/AlertBanner';
import { Search, MapPin, Clock, Users, ArrowRight, Filter, ShieldCheck, UserPlus } from 'lucide-react';

interface RideDiscoveryProps {
  onSelectGroup: (groupId: number) => void;
  onCreateNewRide: () => void;
}

export const RideDiscovery: React.FC<RideDiscoveryProps> = ({ onSelectGroup, onCreateNewRide }) => {
  const [groups, setGroups] = useState<RideGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);

  // Filters
  const [pickupFilter, setPickupFilter] = useState<string>('ALL');
  const [destFilter, setDestFilter] = useState<string>('ALL');

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const list = await api.getGroups();
      setGroups(list);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch available ride groups.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.MouseEvent, groupId: number) => {
    e.stopPropagation();
    setError(null);
    setJoinSuccess(null);

    try {
      const res = await api.joinGroup(groupId);
      setJoinSuccess(`Joined group successfully! Membership #${res.membership_id}`);
      setTimeout(() => {
        onSelectGroup(groupId);
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Unable to join group.');
    }
  };

  const filteredGroups = groups.filter(g => {
    if (pickupFilter !== 'ALL' && !g.pickup_location.toLowerCase().includes(pickupFilter.toLowerCase())) return false;
    if (destFilter !== 'ALL' && !g.destination.toLowerCase().includes(destFilter.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Campus Ride Discovery</h2>
          <p className="text-sm text-slate-400 mt-1">
            Browse open pooling groups or match with peers traveling within +-15 minutes.
          </p>
        </div>

        <button
          onClick={onCreateNewRide}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center space-x-2 shadow-lg shadow-emerald-600/20 transition self-start sm:self-auto"
        >
          <span>Post New Request</span>
          <ArrowRight size={15} />
        </button>
      </div>

      {error && <AlertBanner type="error" message={error} />}
      {joinSuccess && <AlertBanner type="success" message={joinSuccess} />}

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl glass-panel border border-slate-800 flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center space-x-2 text-slate-400 font-semibold">
          <Filter size={15} />
          <span>Filter Routes:</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-500">Pickup:</span>
          <select
            value={pickupFilter}
            onChange={(e) => setPickupFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Pickups</option>
            <option value="VIT Main Gate">VIT Main Gate</option>
            <option value="Katpadi Railway Station">Katpadi Railway Station</option>
            <option value="Vellore New Bus Stand">Vellore New Bus Stand</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-500">Destination:</span>
          <select
            value={destFilter}
            onChange={(e) => setDestFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Destinations</option>
            <option value="Katpadi Railway Station">Katpadi Station</option>
            <option value="Vellore New Bus Stand">New Bus Stand</option>
            <option value="CMC Hospital">CMC Hospital</option>
            <option value="Bagayam">Bagayam</option>
          </select>
        </div>

        <span className="text-slate-500 ml-auto font-medium">
          Showing {filteredGroups.length} available group(s)
        </span>
      </div>

      {/* Groups Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-500 glass-panel rounded-2xl">
          Loading available campus rides...
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="p-16 text-center glass-panel rounded-2xl border border-slate-800">
          <Search size={36} className="mx-auto text-slate-600 mb-3" />
          <h4 className="text-base font-semibold text-slate-300">No matching rides found</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your route filters or post a new companion request for your departure window.
          </p>
          <button
            onClick={onCreateNewRide}
            className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-slate-950 font-bold text-xs hover:bg-emerald-500 transition"
          >
            Post a Ride Request
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGroups.map((grp) => {
            const seatsLeft = 3 - grp.active_member_count;
            const isFull = seatsLeft <= 0;

            return (
              <div
                key={grp.group_id}
                onClick={() => onSelectGroup(grp.group_id)}
                className="p-6 rounded-2xl glass-panel-interactive border border-slate-800 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <StatusBadge status={grp.group_status} type="group" />
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${
                      isFull 
                        ? 'bg-rose-950/60 text-rose-400 border-rose-800/80' 
                        : 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80'
                    }`}>
                      {isFull ? 'Full (3/3)' : `${seatsLeft} seat(s) available`}
                    </span>
                  </div>

                  <div className="space-y-3 mb-5">
                    <div className="flex items-start space-x-2 text-sm font-semibold text-white">
                      <MapPin size={17} className="text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <div>{grp.pickup_location}</div>
                        <div className="text-xs text-slate-400 font-normal">to {grp.destination}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-xs text-slate-400">
                      <div className="flex items-center space-x-1">
                        <Clock size={13} className="text-slate-500" />
                        <span>{new Date(grp.departure_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users size={13} className="text-slate-500" />
                        <span>Lead: {grp.coordinator_name}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-500">Estimated Fare</span>
                    <div className="text-sm font-extrabold text-white">
                      ₹{grp.estimated_fare || 250}
                      <span className="text-[10px] text-slate-400 font-normal ml-1">
                        (~₹{Math.round((grp.estimated_fare || 250) / 3)}/ea)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {!isFull && grp.group_status === 'PENDING' && (
                      <button
                        onClick={(e) => handleJoin(e, grp.group_id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center space-x-1 transition"
                      >
                        <UserPlus size={13} />
                        <span>Join</span>
                      </button>
                    )}
                    <button
                      onClick={() => onSelectGroup(grp.group_id)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
