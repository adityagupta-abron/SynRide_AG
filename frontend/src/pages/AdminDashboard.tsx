import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AdminReview, DashboardStats, RouteFare, User } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { AlertBanner } from '../components/AlertBanner';
import { Modal } from '../components/Modal';
import { 
  ShieldCheck, AlertTriangle, Users, Car, MapPin, 
  Clock, IndianRupee, CheckCircle2, XCircle, Plus, Edit2
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [routes, setRoutes] = useState<RouteFare[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [activeTab, setActiveTab] = useState<'reviews' | 'routes' | 'users'>('reviews');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Review Resolution Modal State
  const [selectedReview, setSelectedReview] = useState<AdminReview | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState<'RESOLVED' | 'DISMISSED'>('RESOLVED');
  const [outcomeNote, setOutcomeNote] = useState<string>('');

  // Route Upsert Modal State
  const [showRouteModal, setShowRouteModal] = useState<boolean>(false);
  const [pickup, setPickup] = useState<string>('VIT Main Gate');
  const [dest, setDest] = useState<string>('Katpadi Railway Station');
  const [fare, setFare] = useState<number>(250);
  const [duration, setDuration] = useState<number>(15);

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const loadAllAdminData = async () => {
    try {
      setLoading(true);
      const [s, revs, rts, us] = await Promise.all([
        api.getAdminDashboard(),
        api.getAdminReviews(),
        api.getRoutes(),
        api.getAdminUsers(),
      ]);
      setStats(s);
      setReviews(revs);
      setRoutes(rts);
      setUsers(us);
    } catch (err: any) {
      setError(err.message || 'Failed to load administrator data');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;
    try {
      await api.resolveAdminReview(selectedReview.review_id, resolutionStatus, outcomeNote);
      setSelectedReview(null);
      setOutcomeNote('');
      setSuccess(`Review #${selectedReview.review_id} resolved with recorded outcome note.`);
      loadAllAdminData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpsertRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.upsertRoute({
        pickup_location: pickup,
        destination: dest,
        estimated_fare: Number(fare),
        estimated_duration_minutes: Number(duration),
        is_active: 'Y',
      });
      setShowRouteModal(false);
      setSuccess('Route fare updated successfully.');
      loadAllAdminData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="text-indigo-400" size={24} />
            <h2 className="text-2xl font-bold text-white tracking-tight">Campus Administrator Console</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Audit logs, dispute review resolutions, route duration pricing, and user records.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'reviews' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Review Queue ({reviews.filter(r => ['PENDING', 'UNDER_REVIEW'].includes(r.review_status)).length})
          </button>
          <button
            onClick={() => setActiveTab('routes')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'routes' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Route Manager
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'users' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Users ({users.length})
          </button>
        </div>
      </div>

      {error && <AlertBanner type="error" message={error} />}
      {success && <AlertBanner type="success" message={success} />}

      {/* Metrics Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-4 rounded-2xl glass-panel border border-slate-800">
            <span className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">Total Users</span>
            <div className="text-xl font-extrabold text-white">{stats.total_users}</div>
          </div>
          <div className="p-4 rounded-2xl glass-panel border border-slate-800">
            <span className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">Active Groups</span>
            <div className="text-xl font-extrabold text-emerald-400">{stats.active_groups}</div>
          </div>
          <div className="p-4 rounded-2xl glass-panel border border-slate-800">
            <span className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">Completed Rides</span>
            <div className="text-xl font-extrabold text-teal-400">{stats.completed_rides}</div>
          </div>
          <div className="p-4 rounded-2xl glass-panel border border-slate-800">
            <span className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">Pending Reviews</span>
            <div className="text-xl font-extrabold text-amber-400">{stats.pending_admin_reviews}</div>
          </div>
          <div className="p-4 rounded-2xl glass-panel border border-slate-800">
            <span className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">Campus Routes</span>
            <div className="text-xl font-extrabold text-indigo-400">{stats.total_routes}</div>
          </div>
        </div>
      )}

      {/* TAB 1: REVIEW QUEUE */}
      {activeTab === 'reviews' && (
        <div className="p-6 rounded-3xl glass-panel border border-slate-800">
          <h3 className="text-base font-bold text-white mb-4">
            Dispute & Incident Review Queue
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3">ID</th>
                  <th className="pb-3">Reason / Context</th>
                  <th className="pb-3">Parties</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {reviews.map((rev) => (
                  <tr key={rev.review_id} className="hover:bg-slate-900/40">
                    <td className="py-3 font-mono font-bold text-slate-400">#{rev.review_id}</td>
                    <td className="py-3 max-w-xs">
                      <div className="font-semibold text-white">{rev.review_reason}</div>
                      {rev.outcome_note && (
                        <div className="text-[11px] text-emerald-400 mt-0.5">Note: {rev.outcome_note}</div>
                      )}
                    </td>
                    <td className="py-3 text-slate-400">
                      {rev.reporter_name && <div>By: {rev.reporter_name}</div>}
                      {rev.reported_user_name && <div>Against: {rev.reported_user_name}</div>}
                      {rev.cancelled_by_name && <div>Cancelled by: {rev.cancelled_by_name}</div>}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={rev.review_status} />
                    </td>
                    <td className="py-3 text-slate-500">
                      {new Date(rev.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-right">
                      {rev.review_status === 'PENDING' && (
                        <button
                          onClick={() => {
                            setSelectedReview(rev);
                            setOutcomeNote('');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition"
                        >
                          Review & Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ROUTE MANAGER */}
      {activeTab === 'routes' && (
        <div className="p-6 rounded-3xl glass-panel border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white">Maintained Campus Routes & Fares</h3>
            <button
              onClick={() => setShowRouteModal(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center space-x-1"
            >
              <Plus size={14} />
              <span>Add Route</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3">Route Origin</th>
                  <th className="pb-3">Destination</th>
                  <th className="pb-3">Est. Fare</th>
                  <th className="pb-3">Duration</th>
                  <th className="pb-3">Active</th>
                  <th className="pb-3 text-right">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {routes.map((rt) => (
                  <tr key={rt.route_id} className="hover:bg-slate-900/40">
                    <td className="py-3 font-semibold text-white">{rt.pickup_location}</td>
                    <td className="py-3 text-slate-300">{rt.destination}</td>
                    <td className="py-3 font-bold text-emerald-400">₹{rt.estimated_fare}</td>
                    <td className="py-3 text-slate-400">{rt.estimated_duration_minutes} mins</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        rt.is_active === 'Y' ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {rt.is_active === 'Y' ? 'YES' : 'NO'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => {
                          setPickup(rt.pickup_location);
                          setDest(rt.destination);
                          setFare(rt.estimated_fare);
                          setDuration(rt.estimated_duration_minutes);
                          setShowRouteModal(true);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-white"
                      >
                        <Edit2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: USERS AUDIT (EER Subtype Representation) */}
      {activeTab === 'users' && (
        <div className="p-6 rounded-3xl glass-panel border border-slate-800">
          <h3 className="text-base font-bold text-white mb-4">
            Campus Accounts & Subtype Profiles
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3">User ID</th>
                  <th className="pb-3">Full Name</th>
                  <th className="pb-3">Institutional Email</th>
                  <th className="pb-3">Role / Subtype</th>
                  <th className="pb-3">Registration / Employee ID</th>
                  <th className="pb-3">Programme / Department</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => (
                  <tr key={u.user_id} className="hover:bg-slate-900/40">
                    <td className="py-3 font-mono font-bold text-slate-400">#{u.user_id}</td>
                    <td className="py-3 font-semibold text-white">{u.full_name}</td>
                    <td className="py-3 text-slate-400">{u.email}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                        {u.user_role}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-emerald-400">{u.institutional_id || 'N/A'}</td>
                    <td className="py-3 text-slate-300">{u.programme || u.department || 'N/A'}</td>
                    <td className="py-3">
                      <StatusBadge status={u.account_status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RESOLUTION MODAL */}
      <Modal
        isOpen={!!selectedReview}
        onClose={() => setSelectedReview(null)}
        title={`Resolve Review #${selectedReview?.review_id}`}
      >
        <form onSubmit={handleResolveReview} className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
            <span className="font-semibold text-white">Reason: </span>
            <span className="text-slate-300">{selectedReview?.review_reason}</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Resolution Decision
            </label>
            <select
              value={resolutionStatus}
              onChange={(e) => setResolutionStatus(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
            >
              <option value="RESOLVED">Resolve (Affirm action or penalty)</option>
              <option value="DISMISSED">Dismiss (No violation or settled)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Mandatory Administrative Outcome Note
            </label>
            <textarea
              required
              rows={3}
              value={outcomeNote}
              onChange={(e) => setOutcomeNote(e.target.value)}
              placeholder="Record formal administrative determination..."
              className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition"
          >
            Record Formal Resolution
          </button>
        </form>
      </Modal>

      {/* ROUTE UPSERT MODAL */}
      <Modal
        isOpen={showRouteModal}
        onClose={() => setShowRouteModal(false)}
        title="Add or Edit Route Fare"
      >
        <form onSubmit={handleUpsertRoute} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Pickup Point
            </label>
            <input
              type="text"
              required
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Destination
            </label>
            <input
              type="text"
              required
              value={dest}
              onChange={(e) => setDest(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Estimated Fare (₹)
              </label>
              <input
                type="number"
                step="0.01"
                required
                min={0}
                value={fare}
                onChange={(e) => setFare(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Estimated Duration (mins)
              </label>
              <input
                type="number"
                required
                min={1}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition"
          >
            Save Route Fare
          </button>
        </form>
      </Modal>

    </div>
  );
};
