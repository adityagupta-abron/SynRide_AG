import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { UserCheck, Mail, Lock, KeyRound, GraduationCap, Briefcase, ArrowRight, CheckCircle2 } from 'lucide-react';
import { AlertBanner } from '../components/AlertBanner';
import { Modal } from '../components/Modal';

interface RegisterProps {
  onSuccess: () => void;
  onNavigateLogin: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onSuccess, onNavigateLogin }) => {
  const { login } = useAuth();

  // Form State
  const [role, setRole] = useState<'STUDENT' | 'FACULTY'>('STUDENT');
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  // Student Subtype Attributes
  const [registrationNo, setRegistrationNo] = useState<string>('');
  const [programme, setProgramme] = useState<string>('B.Tech Computer Science');
  const [studyYear, setStudyYear] = useState<number>(3);

  // Faculty Subtype Attributes
  const [employeeId, setEmployeeId] = useState<string>('');
  const [staffCategory, setStaffCategory] = useState<'TEACHING' | 'NON_TEACHING'>('TEACHING');
  const [department, setDepartment] = useState<string>('School of Computer Science & Engineering (SCOPE)');

  // OTP Verification State
  const [showOtpModal, setShowOtpModal] = useState<boolean>(false);
  const [otpCode, setOtpCode] = useState<string>('');
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload: any = {
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      password,
      user_role: role,
    };

    if (role === 'STUDENT') {
      payload.student_profile = {
        registration_no: registrationNo.trim().toUpperCase(),
        programme,
        study_year: Number(studyYear),
      };
    } else {
      payload.faculty_profile = {
        employee_id: employeeId.trim().toUpperCase(),
        staff_category: staffCategory,
        department,
      };
    }

    try {
      const res = await api.register(payload);
      if (res.dev_otp) {
        setDevOtp(res.dev_otp);
      }
      setShowOtpModal(true);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please verify institutional email.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);
    setLoading(true);

    try {
      const data = await api.verifyOtp(email.trim().toLowerCase(), otpCode.trim());
      login(data.access_token, {
        user_id: data.user_id,
        full_name: data.full_name,
        email: data.email,
        user_role: data.user_role as any,
        account_status: 'ACTIVE',
      });
      setShowOtpModal(false);
      onSuccess();
    } catch (err: any) {
      setOtpError(err.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-10 p-8 glass-panel rounded-3xl border border-slate-700/60 shadow-2xl">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white tracking-tight">Institutional Registration</h2>
        <p className="text-sm text-slate-400 mt-1">
          VIT University Campus Ride-Pooling Verification
        </p>
      </div>

      {error && (
        <div className="mb-6">
          <AlertBanner type="error" message={error} />
        </div>
      )}

      {/* Role Selection Tabs (Demonstrating EER Subtype Structure) */}
      <div className="flex p-1 bg-slate-900 rounded-2xl border border-slate-800 mb-6">
        <button
          type="button"
          onClick={() => {
            setRole('STUDENT');
            setEmail('');
          }}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 transition ${
            role === 'STUDENT'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <GraduationCap size={18} />
          <span>Student Subtype</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setRole('FACULTY');
            setEmail('');
          }}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 transition ${
            role === 'FACULTY'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Briefcase size={18} />
          <span>Faculty/Staff Subtype</span>
        </button>
      </div>

      <form onSubmit={handleRegisterSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Full Name
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. John Doe"
            className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            {role === 'STUDENT' ? 'Student Email (@vitstudent.ac.in)' : 'Staff Email (@vit.ac.in)'}
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3 text-slate-500" size={18} />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={role === 'STUDENT' ? 'name.reg@vitstudent.ac.in' : 'faculty.name@vit.ac.in'}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition text-sm"
            />
          </div>
        </div>

        {/* Dynamic Subtype Fields */}
        {role === 'STUDENT' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-900/60 border border-emerald-950/80">
            <div className="col-span-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Reg No.
              </label>
              <input
                type="text"
                required
                value={registrationNo}
                onChange={(e) => setRegistrationNo(e.target.value)}
                placeholder="22BCE1001"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs uppercase focus:border-emerald-500"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Programme
              </label>
              <input
                type="text"
                required
                value={programme}
                onChange={(e) => setProgramme(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-emerald-500"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Study Year
              </label>
              <select
                value={studyYear}
                onChange={(e) => setStudyYear(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-emerald-500"
              >
                <option value={1}>1st Year</option>
                <option value={2}>2nd Year</option>
                <option value={3}>3rd Year</option>
                <option value={4}>4th Year</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-900/60 border border-indigo-950/80">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Employee ID
              </label>
              <input
                type="text"
                required
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="EMP50102"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs uppercase focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Staff Category
              </label>
              <select
                value={staffCategory}
                onChange={(e) => setStaffCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500"
              >
                <option value="TEACHING">Teaching Faculty</option>
                <option value="NON_TEACHING">Non-Teaching Staff</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Department
              </label>
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Password (Min 8 characters)
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3 text-slate-500" size={18} />
            <input
              type="password"
              required
              minLength={8}
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
            <span>Sending Verification OTP...</span>
          ) : (
            <>
              <span>Verify Institutional Email</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-400">
        Already verified?{' '}
        <button
          onClick={onNavigateLogin}
          className="text-emerald-400 font-semibold hover:underline"
        >
          Sign In
        </button>
      </div>

      {/* OTP Verification Modal */}
      <Modal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        title="Institutional Email Verification"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Enter the 6-digit verification code sent to <strong className="text-emerald-400">{email}</strong>.
            This code expires in 10 minutes.
          </p>

          {devOtp && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-200 text-xs">
              <span className="font-semibold">Development Simulated OTP: </span>
              <code className="text-sm font-bold text-emerald-400 ml-1 bg-black/40 px-2 py-0.5 rounded">
                {devOtp}
              </code>
            </div>
          )}

          {otpError && <AlertBanner type="error" message={otpError} />}

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                6-Digit Verification OTP
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3 text-slate-500" size={18} />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="e.g. 123456"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white tracking-widest text-center text-lg font-bold focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold transition disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Complete Registration'}
            </button>
          </form>
        </div>
      </Modal>
    </div>
  );
};
