import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'group' | 'payment' | 'role' | 'confirmation';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'group' }) => {
  const s = status.toUpperCase();

  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';

  if (s === 'CONFIRMED' || s === 'PAID' || s === 'RESOLVED' || s === 'ACTIVE') {
    colorClasses = 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80';
  } else if (s === 'PENDING' || s === 'UNDER_REVIEW') {
    colorClasses = 'bg-amber-950/60 text-amber-400 border-amber-800/80';
  } else if (s === 'COMPLETED') {
    colorClasses = 'bg-blue-950/60 text-blue-400 border-blue-800/80';
  } else if (s === 'CANCELLED' || s === 'DECLINED' || s === 'FAILED' || s === 'EXPIRED') {
    colorClasses = 'bg-rose-950/60 text-rose-400 border-rose-800/80';
  } else if (s === 'DISPUTED') {
    colorClasses = 'bg-purple-950/60 text-purple-400 border-purple-800/80';
  } else if (s === 'COORDINATOR') {
    colorClasses = 'bg-indigo-950/60 text-indigo-400 border-indigo-800/80 font-semibold';
  } else if (s === 'PASSENGER') {
    colorClasses = 'bg-slate-800/80 text-slate-300 border-slate-700';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses}`}>
      {status}
    </span>
  );
};
