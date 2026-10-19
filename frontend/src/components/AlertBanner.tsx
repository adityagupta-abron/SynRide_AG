import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

interface AlertBannerProps {
  type?: 'info' | 'warning' | 'error' | 'success';
  title?: string;
  message: string;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ 
  type = 'info', 
  title, 
  message 
}) => {
  let containerClasses = 'bg-sky-950/40 border-sky-800/80 text-sky-200';
  let icon = <Info className="text-sky-400 shrink-0 mt-0.5" size={18} />;

  if (type === 'warning') {
    containerClasses = 'bg-amber-950/40 border-amber-800/80 text-amber-200';
    icon = <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={18} />;
  } else if (type === 'error') {
    containerClasses = 'bg-rose-950/40 border-rose-800/80 text-rose-200';
    icon = <AlertCircle className="text-rose-400 shrink-0 mt-0.5" size={18} />;
  } else if (type === 'success') {
    containerClasses = 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200';
    icon = <CheckCircle className="text-emerald-400 shrink-0 mt-0.5" size={18} />;
  }

  return (
    <div className={`p-4 rounded-xl border flex items-start space-x-3 text-sm ${containerClasses}`}>
      {icon}
      <div className="flex-1">
        {title && <h5 className="font-semibold mb-0.5">{title}</h5>}
        <p className="leading-relaxed opacity-90">{message}</p>
      </div>
    </div>
  );
};
