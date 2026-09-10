import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  RefreshCw, 
  ShieldCheck, 
  BrainCircuit, 
  Activity,
  History,
  AlertTriangle,
  CheckCircle2,
  CloudRain
} from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { functions, db } from '../config/firebase';
import { syncAllParksWeather } from '../services/weatherService';
import { httpsCallable } from 'firebase/functions';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export const AIManager = () => {
  const [syncingWeather, setSyncingWeather] = useState(false);
  const [sweepingOps, setSweepingOps] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'aiLogs'), orderBy('timestamp', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingLogs(false);
    });
    return () => unsubscribe();
  }, []);

  const handleWeatherSync = async () => {
    setSyncingWeather(true);
    try {
      const results = await syncAllParksWeather();
      toast.success(`Weather synchronized for ${results.length} national parks via OpenWeatherMap`);
    } catch (err) {
      console.error('Weather sync failed:', err);
      toast.error('Failed to sync weather.');
    } finally {
      setSyncingWeather(false);
    }
  };

  const handleOpsSweep = async () => {
    setSweepingOps(true);
    const manualOperationsSweep = httpsCallable(functions, 'manualOperationsSweep');
    try {
      const result = await manualOperationsSweep();
      toast.success(result.data.message || 'Operations sweep completed');
    } catch (err) {
      console.error('Ops sweep failed:', err);
      toast.error(err.message || 'Failed to trigger sweep. Admin permissions required.');
    } finally {
      setSweepingOps(false);
    }
  };

  return (
    <PageWrapper 
      title="AI Manager Hub" 
      subtitle="Operational Intelligence & Safari Watchdog Control Center"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Controls */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-l-4 border-l-safari-gold bg-gradient-to-br from-safari-gold/5 to-transparent">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-safari-gold/10 text-safari-gold rounded-xl">
                    <CloudRain size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-safari-primary dark:text-dark-text">Weather Intelligence</h3>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">OpenWeatherMap + Safari Decision Engine</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-500 leading-relaxed">
                  Fetches live conditions and 5-day forecasts via OpenWeatherMap API and calculates domain-specific safari advisories.
                </p>
                <Button 
                  className="w-full gap-2 py-6 text-sm font-bold shadow-lg shadow-safari-gold/20"
                  onClick={handleWeatherSync}
                  disabled={syncingWeather}
                >
                  {syncingWeather ? <RefreshCw size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                  {syncingWeather ? 'SYNCING OPENWEATHER...' : 'FORCE WEATHER SYNC'}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-safari-success bg-gradient-to-br from-safari-success/5 to-transparent">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-safari-success/10 text-safari-success rounded-xl">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-safari-primary dark:text-dark-text">Operations Watchdog</h3>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">Policy Enforcement Engine</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-500 leading-relaxed">
                  Performs a manual sweep of all bookings, vehicles, and insurance records. Generates priority alerts for expiring documents or missing assignments.
                </p>
                <Button 
                  variant="success"
                  className="w-full gap-2 py-6 text-sm font-bold shadow-lg shadow-safari-success/20"
                  onClick={handleOpsSweep}
                  disabled={sweepingOps}
                >
                  {sweepingOps ? <RefreshCw size={18} className="animate-spin" /> : <Zap size={18} />}
                  {sweepingOps ? 'SWEEPING RECORDS...' : 'TRIGGER OPS SWEEP'}
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-50 dark:border-dark-border">
              <div className="flex items-center gap-2">
                <History size={20} className="text-safari-gold" />
                <h3 className="font-bold text-safari-primary dark:text-dark-text">Recent Intelligence Activity</h3>
              </div>
              <Badge variant="gold">LIVE FEED</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-50 dark:divide-dark-border">
                {loadingLogs ? (
                  <div className="p-8 text-center text-gray-400 text-sm">Loading activity logs...</div>
                ) : logs.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm">No activity recorded yet.</div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="p-4 flex items-start gap-4 group hover:bg-gray-50 dark:hover:bg-dark-surface/50 transition-colors">
                      <div className={`mt-1 p-1.5 rounded-lg ${log.module === 'Watchdog' ? 'bg-safari-success/10 text-safari-success' : 'bg-safari-gold/10 text-safari-gold'}`}>
                        <Activity size={16} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-black uppercase text-gray-400 tracking-tighter">{log.module || 'SYSTEM'}</p>
                          <p className="text-[10px] font-jetbrains text-gray-400">
                            {log.timestamp?.seconds ? format(new Date(log.timestamp.seconds * 1000), 'MMM dd, HH:mm:ss') : 'Just now'}
                          </p>
                        </div>
                        <p className="text-sm font-dm-sans text-safari-primary dark:text-dark-text">{log.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Health */}
        <div className="space-y-8">
          <Card className="bg-safari-primary text-white border-none shadow-2xl">
            <CardHeader>
              <h3 className="font-bold flex items-center gap-2">
                <BrainCircuit size={18} className="text-safari-gold" /> Neural Engine Status
              </h3>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/60">Cloud Functions Connectivity</span>
                  <span className="text-safari-gold">Optimal</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full w-[94%] bg-safari-gold" />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold">Weather Sync</p>
                    <p className="text-white/40">Next run: In 2h 45m</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold">Operations Watchdog</p>
                    <p className="text-white/40">Running every 15 mins</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <AlertTriangle size={16} className="text-amber-400" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold">Billing Verification</p>
                    <p className="text-white/40">Verification Pending</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-bold text-safari-primary dark:text-dark-text">AI Configuration</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-dark-surface border border-gray-100 dark:border-dark-border">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Weather & Advisory Engine</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-safari-primary dark:text-dark-text">OpenWeatherMap + Safari Rules</p>
                  <Badge variant="info">Active</Badge>
                </div>
              </div>
              
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-dark-surface border border-gray-100 dark:border-dark-border">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Secret Management</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-safari-primary dark:text-dark-text">Firebase Secrets</p>
                  <Badge variant="success">Secured</Badge>
                </div>
              </div>

              <div className="pt-4">
                <p className="text-[10px] text-gray-400 text-center leading-relaxed italic">
                  All AI logic is now executed server-side. Local API keys have been deprecated for maximum security.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
};
