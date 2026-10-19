import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { RouteFare } from '../types';
import { MapPin, Clock, IndianRupee, Users, Compass, ArrowRight } from 'lucide-react';
import { AlertBanner } from '../components/AlertBanner';

interface RoutesViewProps {
  onSelectRoute: (pickup: string, destination: string) => void;
}

export const RoutesView: React.FC<RoutesViewProps> = ({ onSelectRoute }) => {
  const [routes, setRoutes] = useState<RouteFare[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    api.getRoutes()
      .then(list => setRoutes(list))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = routes.filter(r => 
    r.pickup_location.toLowerCase().includes(search.toLowerCase()) ||
    r.destination.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Maintained Route Fares</h2>
          <p className="text-xs text-slate-400 mt-1">
            Standard campus-to-city transportation benchmarks, typical duration, and 3-person pooling cost estimates.
          </p>
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by pickup or destination..."
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-full sm:w-64"
        />
      </div>

      {error && <AlertBanner type="error" message={error} />}

      {loading ? (
        <div className="p-16 text-center text-slate-500 glass-panel rounded-2xl">
          Loading routes...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(rt => {
            const share3 = Math.round(rt.estimated_fare / 3);
            const share2 = Math.round(rt.estimated_fare / 2);

            return (
              <div 
                key={rt.route_id}
                className="p-5 rounded-2xl glass-panel-interactive border border-slate-800 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start space-x-2 text-sm font-bold text-white mb-3">
                    <MapPin size={17} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div>{rt.pickup_location}</div>
                      <div className="text-xs text-slate-400 font-normal">to {rt.destination}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-xs text-slate-400 mb-4">
                    <span className="flex items-center space-x-1">
                      <Clock size={13} className="text-slate-500" />
                      <span>~{rt.estimated_duration_minutes} mins</span>
                    </span>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold">Active Benchmark</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-xs text-slate-500">Benchmark Total:</span>
                    <span className="text-lg font-extrabold text-white">₹{rt.estimated_fare}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 grid grid-cols-2 gap-2 text-center text-[11px] mb-3">
                    <div>
                      <span className="text-slate-500 block">3-Person Pool</span>
                      <span className="font-bold text-emerald-400">₹{share3}/each</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">2-Person Pool</span>
                      <span className="font-bold text-teal-400">₹{share2}/each</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectRoute(rt.pickup_location, rt.destination)}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-1 transition"
                  >
                    <span>Post Ride for This Route</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
