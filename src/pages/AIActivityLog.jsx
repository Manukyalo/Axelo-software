import React, { useState, useEffect } from 'react';
import { 
  History, 
  Terminal, 
  Search, 
  Download, 
  Filter, 
  Clock, 
  Server,
  Activity,
  AlertCircle,
  ShieldCheck,
  Brain
} from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { format } from 'date-fns';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const AIActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const q = query(collection(db, 'aiLogs'), orderBy('timestamp', 'desc'), limit(100));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogs(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredLogs = logs.filter(log => {
    if (filter === 'All') return true;
    return log.module === filter;
  });

  const getModuleIcon = (module) => {
    switch (module) {
      case 'Engine': return <Server size={14} className="text-safari-primary" />;
      case 'Loop': return <Activity size={14} className="text-safari-success" />;
      case 'Error': return <AlertCircle size={14} className="text-red-500" />;
      default: return <Terminal size={14} className="text-safari-gold" />;
    }
  };

  return (
    <PageWrapper 
      title="AI Activity Log" 
      subtitle="Full operational history of the Autonomous Intelligence Engine"
      actions={
        <div className="flex gap-2">
           <Button variant="outline" size="sm" className="gap-2">
             <Download size={16} /> Export CSV
           </Button>
        </div>
      }
    >
      <div className="bg-white dark:bg-dark-card rounded-3xl border border-gray-100 dark:border-dark-border shadow-sm overflow-hidden">
        
        {/* Table Header/Filters */}
        <div className="p-6 border-b border-gray-50 dark:border-dark-border flex items-center justify-between bg-gray-50/50 dark:bg-dark-surface/50">
           <div className="flex items-center gap-3">
             <Brain size={20} className="text-safari-primary" />
             <h3 className="font-bold text-safari-primary dark:text-dark-text uppercase tracking-widest text-xs">Engine Runtime Records</h3>
           </div>
           <div className="flex items-center gap-2">
             {['All', 'Engine', 'Loop', 'Error'].map(f => (
               <button
                 key={f}
                 onClick={() => setFilter(f)}
                 className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                   filter === f 
                    ? 'bg-safari-primary text-white' 
                    : 'bg-white dark:bg-dark-card text-gray-400 hover:text-safari-gold'
                 }`}
               >
                 {f}
               </button>
             ))}
           </div>
        </div>

        {/* Console-style Log View */}
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white dark:bg-dark-card border-b border-gray-50 dark:border-dark-border">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Timestamp</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Module</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Activity Detail</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-dark-border">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-dark-surface/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs font-jetbrains font-bold text-gray-500">
                      <Clock size={12} className="text-safari-gold" />
                      {log.timestamp?.toDate ? format(log.timestamp.toDate(), 'HH:mm:ss') : 'Just now'}
                      <span className="text-[10px] text-gray-300 ml-1">{log.timestamp?.toDate ? format(log.timestamp.toDate(), 'dd MMM') : ''}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-safari-primary dark:text-dark-text">
                      {getModuleIcon(log.module)}
                      {log.module}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className={`text-xs ${log.module === 'Error' ? 'text-red-500 font-bold' : 'text-gray-600 dark:text-gray-400'}`}>
                      {log.message}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Badge variant={log.module === 'Error' ? 'danger' : 'success'} className="text-[8px] py-0 px-1.5 font-bold">
                      {log.module === 'Error' ? 'FAILED' : 'SUCCESS'}
                    </Badge>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && !loading && (
                <tr>
                  <td colSpan="4" className="px-6 py-20 text-center text-gray-400 font-playfair italic">
                    No activity logs recorded for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageWrapper>
  );
};
