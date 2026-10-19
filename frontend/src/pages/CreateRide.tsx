import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { RouteFare } from '../types';
import { Car, Users, MapPin, Clock, Calendar, IndianRupee, ArrowRight, Info } from 'lucide-react';
import { AlertBanner } from '../components/AlertBanner';

interface CreateRideProps {
  onRideCreated: (groupId: number) => void;
  onCancel: () => void;
}

const COMMON_LOCATIONS = [
  'VIT Main Gate',
  'Katpadi Railway Station',
  'Vellore New Bus Stand',
  'CMC Hospital',
  'Bagayam',
  'Green Circle',
  'Chennai Airport (MAA)',
  'Bengaluru Airport (BLR)',
];

export const CreateRide: React.FC<CreateRideProps> = ({ onRideCreated, onCancel }) => {
  const [requestType, setRequestType] = useState<'LOOKING_FOR_COMPANIONS' | 'VEHICLE_ARRANGED'>('LOOKING_FOR_COMPANIONS');
  const [pickup, setPickup] = useState<string>('VIT Main Gate');
  const [destination, setDestination] = useState<string>('Katpadi Railway Station');

  // Format default departure time to tomorrow 09:00 AM
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  const defaultTimeStr = tomorrow.toISOString().slice(0, 16);

  const [departureTime, setDepartureTime] = useState<string>(defaultTimeStr);
  const [routes, setRoutes] = useState<RouteFare[]>([]);
  const [matchedRoute, setMatchedRoute] = useState<RouteFare | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getRoutes()
      .then(list => setRoutes(list))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const match = routes.find(
      r => r.pickup_location.toLowerCase() === pickup.toLowerCase() &&
           r.destination.toLowerCase() === destination.toLowerCase()
    );
    setMatchedRoute(match || null);
  }, [pickup, destination, routes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (pickup.trim().toLowerCase() === destination.trim().toLowerCase()) {
      setError('Pickup location and destination cannot be identical.');
      return;
    }

    setLoading(true);

    try {
      // 1. Create Ride Request
      const req = await api.createRideRequest({
        request_type: requestType,
        pickup_location: pickup,
        destination: destination,
        departure_time: new Date(departureTime).toISOString(),
      });

      // 2. Form RIDE_GROUP automatically
      const estFare = matchedRoute ? matchedRoute.estimated_fare : 250.0;
      const grp = await api.createGroup(
        req.request_id,
        new Date(departureTime).toISOString(),
        estFare
      );

      onRideCreated(grp.group_id);
    } catch (err: any) {
      setError(err.message || 'Failed to post ride. Please check overlapping trips.');
    } finally {
      setLoading(false);
    }
  };

  const estimatedSharePerPerson = matchedRoute ? Math.round(matchedRoute.estimated_fare / 3) : 83;

  return (
    <div className="max-w-2xl mx-auto p-8 glass-panel rounded-3xl border border-slate-700/60 shadow-2xl animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white tracking-tight">Post a Campus Ride</h2>
        <p className="text-sm text-slate-400 mt-1">
          Coordinate companion travel or share an arranged vehicle along campus routes.
        </p>
      </div>

      {error && (
        <div className="mb-6">
          <AlertBanner type="error" message={error} />
        </div>
      )}

      {/* Ride Type Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div
          onClick={() => setRequestType('LOOKING_FOR_COMPANIONS')}
          className={`p-5 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
            requestType === 'LOOKING_FOR_COMPANIONS'
              ? 'bg-emerald-950/40 border-emerald-500/80 shadow-lg shadow-emerald-500/10'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <Users className={requestType === 'LOOKING_FOR_COMPANIONS' ? 'text-emerald-400' : 'text-slate-500'} size={24} />
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
              requestType === 'LOOKING_FOR_COMPANIONS' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
            }`}>
              Type A
            </span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-1">Looking for Companions</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Plan to travel and want fellow campus members to share an auto/cab fare.
            </p>
          </div>
        </div>

        <div
          onClick={() => setRequestType('VEHICLE_ARRANGED')}
          className={`p-5 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
            requestType === 'VEHICLE_ARRANGED'
              ? 'bg-teal-950/40 border-teal-500/80 shadow-lg shadow-teal-500/10'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <Car className={requestType === 'VEHICLE_ARRANGED' ? 'text-teal-400' : 'text-slate-500'} size={24} />
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
              requestType === 'VEHICLE_ARRANGED' ? 'bg-teal-500/20 text-teal-300' : 'bg-slate-800 text-slate-400'
            }`}>
              Type B
            </span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-1">Vehicle Already Arranged</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Auto or cab already booked with up to 2 vacant seats available.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Origin & Destination */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Pickup Point
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3 text-slate-500" size={17} />
              <select
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 text-sm"
              >
                {COMMON_LOCATIONS.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Destination
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3 text-slate-500" size={17} />
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 text-sm"
              >
                {COMMON_LOCATIONS.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Departure Time */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Target Departure Date & Time
          </label>
          <div className="relative">
            <Calendar className="absolute left-3.5 top-3 text-slate-500" size={17} />
            <input
              type="datetime-local"
              required
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Matching automatically finds companions departing within +-15 minutes.
          </p>
        </div>

        {/* Route Estimate Preview Card */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-400">Predefined Route Estimate</div>
            <div className="text-sm font-bold text-white flex items-center space-x-2">
              <span>{pickup}</span>
              <span className="text-slate-500">→</span>
              <span>{destination}</span>
            </div>
            <div className="text-xs text-slate-500 flex items-center space-x-3 pt-1">
              <span className="flex items-center space-x-1">
                <Clock size={13} />
                <span>~{matchedRoute ? matchedRoute.estimated_duration_minutes : 15} mins</span>
              </span>
              <span>•</span>
              <span>Max 3 Passengers</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-400">Estimated Total</div>
            <div className="text-xl font-extrabold text-emerald-400">
              ₹{matchedRoute ? matchedRoute.estimated_fare : 250}
            </div>
            <div className="text-[11px] text-slate-500">
              ~₹{estimatedSharePerPerson}/person (3 pooled)
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center space-x-4 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="w-1/3 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-semibold text-sm hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
          >
            {loading ? (
              <span>Forming Group...</span>
            ) : (
              <>
                <span>Publish Ride Group</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
