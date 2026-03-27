import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  RotateCw, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  AlertTriangle,
  Zap,
  RefreshCw
} from 'lucide-react';
import { formatDistanceToNow, differenceInSeconds } from 'date-fns';
import { Button } from '../ui/Button';

export const EngineStatusPanel = ({ status, lastScanTime, nextScanTime, onRunScan, alerts = [] }) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!nextScanTime) return;
    
    const timer = setInterval(() => {
      const diff = differenceInSeconds(nextScanTime, new Date());
      setTimeLeft(diff > 0 ? diff : 0);
    }, 1000);

    return () => clearInterval(timer);
  }, [nextScanTime]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAlertCount = (source) => alerts.filter(a => a.moduleSource === source).length;

  const modules = [
    { name: 'Booking Reminder', status: 'Active', alerts: getAlertCount('BookingReminders') },
    { name: 'Forgotten Booking', status: 'Active', alerts: getAlertCount('ForgottenBookingDetector') },
    { name: 'Insurance Watchdog', status: 'Active', alerts: getAlertCount('InsuranceWatchdog') },
    { name: 'Capacity Planner', status: 'Active', alerts: getAlertCount('CapacityPlanner') },
    { name: 'Daily Briefing', status: 'Active', alerts: getAlertCount('DailyBriefingEngine') },
    { name: 'Park Fee Watchdog', status: 'Active', alerts: getAlertCount('ParkFeeWatchdog') },
  ];

  const stats = {
    critical: alerts.filter(a => a.type === 'CRITICAL').length,
    high: alerts.filter(a => a.type === 'HIGH').length,
    insights: alerts.filter(a => a.type === 'INSIGHT').length,
  };

  return (
    <div className="space-y-6">
      {/* Engine Status Card */}
      <div className="bg-safari-primary dark:bg-dark-card rounded-2xl p-6 shadow-xl relative overflow-hidden">
        {/* Background Decorative Element */}
        <div className="absolute -right-8 -top-8 opacity-10">
           <Zap size={160} className="text-white" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-3 h-3 bg-safari-success rounded-full animate-ping absolute inset-0" />
                <div className="w-3 h-3 bg-safari-success rounded-full relative" />
              </div>
              <h3 className="text-white font-dm-sans font-bold uppercase tracking-widest text-xs">AI Manager Engine — {status}</h3>
            </div>
            <button 
              onClick={onRunScan}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
              title="Manual Scan"
            >
              <RefreshCw size={18} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Last Scan</p>
              <div className="flex items-center gap-2 text-white">
                <Clock size={14} className="text-safari-gold" />
                <span className="text-sm font-medium">
                  {lastScanTime ? formatDistanceToNow(lastScanTime, { addSuffix: true }) : 'Never'}
                </span>
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Next Scan</p>
              <div className="flex items-center gap-2 text-white">
                <Activity size={14} className="text-safari-success" />
                <span className="text-sm font-jetbrains font-bold">{formatTime(timeLeft)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Module Status List */}
      <div className="bg-white dark:bg-dark-card rounded-2xl p-6 border border-gray-100 dark:border-dark-border shadow-sm">
        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
          <ShieldCheck size={14} className="text-safari-gold" /> Engine Module Activity
        </h4>
        <div className="space-y-4">
          {modules.map((m) => (
            <div key={m.name} className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className={`w-1.5 h-1.5 rounded-full ${m.status === 'Active' ? 'bg-safari-success' : 'bg-gray-300'}`} />
                <span className="text-sm font-medium text-safari-primary dark:text-dark-text group-hover:text-safari-gold transition-colors">{m.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-gray-400">{m.alerts} alerts</span>
                <Badge variant={m.status === 'Active' ? 'success' : 'gold'} className="text-[8px] py-0 px-1.5">Active</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alert Summary Stats */}
      <div className="bg-white dark:bg-dark-card rounded-2xl p-6 border border-gray-100 dark:border-dark-border shadow-sm">
          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Intelligence Stats</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Critical Alerts</span>
              <span className={`text-sm font-bold ${stats.critical > 0 ? 'text-red-500' : 'text-gray-400'}`}>{stats.critical}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">High Risk Issues</span>
              <span className={`text-sm font-bold ${stats.high > 0 ? 'text-orange-500' : 'text-gray-400'}`}>{stats.high}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Operational Insights</span>
              <span className="text-sm font-bold text-safari-success">{stats.insights}</span>
            </div>
            <div className="pt-3 border-t border-gray-50 dark:border-dark-border flex justify-between items-center">
              <span className="text-sm font-bold text-safari-primary dark:text-dark-text">Total Active Alerts</span>
              <span className="text-sm font-bold text-safari-gold text-lg">{alerts.length}</span>
            </div>
          </div>
      </div>
    </div>
  );
};
