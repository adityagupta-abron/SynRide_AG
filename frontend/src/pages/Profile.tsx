import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { User } from '../types';
import { StarRating } from '../components/StarRating';
import { AlertBanner } from '../components/AlertBanner';
import { UserCheck, Mail, GraduationCap, Briefcase, Star, Bell, Shield, Calendar } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [ratings, setRatings] = useState<any[]>([]);
  const [emailEnabled, setEmailEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await api.getMe();
      setProfile(data);

      const pref = await api.getEmailPreference();
      setEmailEnabled(pref.email_enabled);

      if (data.user_id) {
        const reviewList = await api.getUserRatings(data.user_id);
        setRatings(reviewList);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEmail = async () => {
    const nextState = !emailEnabled;
    try {
      await api.updateEmailPreference(nextState);
      setEmailEnabled(nextState);
      setSuccess(`Email notifications ${nextState ? 'enabled' : 'disabled'} successfully.`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500 glass-panel rounded-2xl">
        Loading institutional profile...
      </div>
    );
  }

  const p = profile || user;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      
      {error && <AlertBanner type="error" message={error} />}
      {success && <AlertBanner type="success" message={success} />}

      {/* Main Profile Header */}
      <div className="p-8 rounded-3xl glass-panel border border-slate-700/60 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-extrabold text-2xl text-slate-950 shadow-xl shadow-emerald-500/20">
              {p?.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-2xl font-bold text-white tracking-tight">{p?.full_name}</h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {p?.user_role}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-0.5 flex items-center space-x-2">
                <Mail size={14} className="text-slate-500" />
                <span>{p?.email}</span>
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-right">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Peer Trust Score
            </div>
            <div className="flex items-center space-x-1 justify-end mt-0.5">
              <StarRating rating={Math.round(p?.average_rating || 5)} size={16} />
              <span className="text-sm font-bold text-white ml-1">
                {p?.average_rating ? p.average_rating.toFixed(1) : '5.0'}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {p?.total_reviews || ratings.length} peer review(s)
            </div>
          </div>
        </div>
      </div>

      {/* Specialization Attributes (EER Subtype Mapping) */}
      <div className="p-6 rounded-3xl glass-panel border border-slate-800">
        <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-slate-800">
          {p?.user_role === 'STUDENT' ? (
            <GraduationCap className="text-emerald-400" size={20} />
          ) : (
            <Briefcase className="text-indigo-400" size={20} />
          )}
          <h3 className="text-base font-bold text-white">
            {p?.user_role === 'STUDENT' ? 'Student Subtype Profile' : 'Faculty/Staff Subtype Profile'}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-500 font-semibold uppercase tracking-wider block mb-1">
              {p?.user_role === 'STUDENT' ? 'Registration Number' : 'Employee ID'}
            </span>
            <span className="text-sm font-bold text-white font-mono">
              {p?.institutional_id || 'N/A'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-500 font-semibold uppercase tracking-wider block mb-1">
              {p?.user_role === 'STUDENT' ? 'Academic Programme' : 'Staff Category'}
            </span>
            <span className="text-sm font-bold text-white">
              {p?.programme || p?.staff_category || 'N/A'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-500 font-semibold uppercase tracking-wider block mb-1">
              {p?.user_role === 'STUDENT' ? 'Study Year' : 'Department'}
            </span>
            <span className="text-sm font-bold text-white">
              {p?.user_role === 'STUDENT' ? `Year ${p?.study_year || 2}` : p?.department || 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Preferences & Email Notification Settings */}
      <div className="p-6 rounded-3xl glass-panel border border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400">
              <Bell size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Institutional Email Notifications</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Receive email alerts for ride confirmations, coordinator handovers, and departure reminders.
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleEmail}
            className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none ${
              emailEnabled ? 'bg-emerald-600' : 'bg-slate-700'
            }`}
          >
            <span
              className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                emailEnabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Peer Reviews History */}
      <div className="p-6 rounded-3xl glass-panel border border-slate-800">
        <h3 className="text-base font-bold text-white mb-4 flex items-center space-x-2">
          <Star className="text-amber-400 fill-amber-400" size={17} />
          <span>Peer Reviews & Ratings</span>
        </h3>

        {ratings.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">
            No peer reviews received yet. Complete a shared ride to receive peer ratings.
          </p>
        ) : (
          <div className="space-y-3">
            {ratings.map((r, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-slate-300">
                    {r.reviewer_name}
                  </span>
                  <StarRating rating={r.rating} size={14} />
                </div>
                {r.review_text && (
                  <p className="text-slate-400 italic">"{r.review_text}"</p>
                )}
                <div className="text-[10px] text-slate-600 mt-1">
                  {new Date(r.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
