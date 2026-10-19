import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Car, Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { AlertBanner } from '../components/AlertBanner';

interface LoginProps {
  onSuccess: () => void;
  onNavigateRegister: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess, onNavigateRegister }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState<string>('test.coordinator@synride.example');
  const [password, setPassword] = useState<string>('Password@123');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await api.login(email.trim(), password);
      login(data.access_token, {
        user_id: data.user_id,
        full_name: data.full_name,
        email: data.email,
        user_role: data.user_role as any,
        account_status: 'ACTIVE',
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoRole: string) => {
    setEmail(demoEmail);
    setPassword('Password@123');
  };

  return (
    <div className="max-w-md mx-auto my-12 p-8 glass-panel rounded-3xl border border-slate-700/60 shadow-2xl">
      <div className="text-center mb-8">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-xl shadow-emerald-500/20">
          <Car className="text-white" size={30} />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Welcome to SynRide</h2>
        <p className="text-sm text-slate-400 mt-1">Campus Ride-Pooling Coordination Platform</p>
      </div>

      {error && (
        <div className="mb-6">
          <AlertBanner type="error" message={error} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Institutional Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3 text-slate-500" size={18} />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. name@vitstudent.ac.in"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3 text-slate-500" size={18} />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
        >
          {loading ? (
            <span>Signing In...</span>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      {/* Demo Credentials Helper for Evaluators */}
      <div className="mt-8 pt-6 border-t border-slate-800">
        <p className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider text-center mb-3">
          Evaluation Quick-Select Accounts
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleQuickLogin('test.coordinator@synride.example', 'STUDENT')}
            className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 text-slate-300 text-left transition"
          >
            <div className="font-semibold text-white flex items-center space-x-1">
              <UserCheck size={13} className="text-emerald-400" />
              <span>Coordinator (U1)</span>
            </div>
            <div className="text-[10px] text-slate-500 truncate">Group 1 Lead</div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin('test.passenger1@synride.example', 'STUDENT')}
            className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 text-slate-300 text-left transition"
          >
            <div className="font-semibold text-white flex items-center space-x-1">
              <UserCheck size={13} className="text-teal-400" />
              <span>Passenger (U2)</span>
            </div>
            <div className="text-[10px] text-slate-500 truncate">Group 1 Member</div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin('test.passenger3@synride.example', 'STUDENT')}
            className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 text-slate-300 text-left transition"
          >
            <div className="font-semibold text-white flex items-center space-x-1">
              <UserCheck size={13} className="text-sky-400" />
              <span>Student (U21)</span>
            </div>
            <div className="text-[10px] text-slate-500 truncate">Available Member</div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin('admin@vit.ac.in', 'ADMIN')}
            className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 text-slate-300 text-left transition"
          >
            <div className="font-semibold text-white flex items-center space-x-1">
              <ShieldCheck size={13} className="text-indigo-400" />
              <span>Admin (U22)</span>
            </div>
            <div className="text-[10px] text-slate-500 truncate">Review Authority</div>
          </button>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-slate-400">
        New to SynRide?{' '}
        <button
          onClick={onNavigateRegister}
          className="text-emerald-400 font-semibold hover:underline"
        >
          Create Institutional Account
        </button>
      </div>
    </div>
  );
};
