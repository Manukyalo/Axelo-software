import React, { useState } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { useData } from '../../contexts/DataContext';
import { 
  ShieldAlert, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  ExternalLink,
  History,
  Phone,
  MessageSquare,
  Trash2,
  AlertCircle,
  X as CloseIcon
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export const SOSAlerts = () => {
  const { state, dispatch } = useData();
  const [activeTab, setActiveTab] = useState('ACTIVE'); // ACTIVE, RESOLVED
  const [confirmDelete, setConfirmDelete] = useState(null); // null, 'all', or alertId

  const alerts = state.sosAlerts || [];
  const activeAlerts = alerts.filter(a => a.status !== 'Resolved')
    .sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
  const resolvedAlerts = alerts.filter(a => a.status === 'Resolved')
    .sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await dispatch({ 
        type: 'UPDATE_SOSALERT', 
        payload: { 
          id, 
          status: newStatus,
          updatedAt: new Date().toISOString()
        } 
      });
      toast.success(`Alert marked as ${newStatus}`);
    } catch (err) {
      toast.error('Failed to update alert');
    }
  };

  const handleDeleteAlert = async (id) => {
    try {
      await dispatch({ type: 'DELETE_SOSALERT', payload: id });
      toast.success('Alert permanently deleted');
      setConfirmDelete(null);
    } catch (err) {
      toast.error('Failed to delete alert');
    }
  };

  const handleClearAllResolved = async () => {
    try {
      const deletePromises = resolvedAlerts.map(a => 
        dispatch({ type: 'DELETE_SOSALERT', payload: a.id })
      );
      await Promise.all(deletePromises);
      toast.success('All resolved alerts cleared');
      setConfirmDelete(null);
    } catch (err) {
      toast.error('Failed to clear history');
    }
  };

  const getUrgencyColor = (type) => {
    switch (type) {
      case 'Emergency': return 'bg-red-500';
      case 'Mechanical': return 'bg-orange-500';
      case 'Stuck': return 'bg-yellow-500';
      default: return 'bg-safari-gold';
    }
  };

  return (
    <PageWrapper title="Emergency SOS Management">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex gap-4">
          <button 
            onClick={() => setActiveTab('ACTIVE')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'ACTIVE' ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'bg-white text-gray-400 border border-gray-100 dark:bg-dark-card dark:border-white/5'}`}
          >
            <ShieldAlert size={16} /> Active Emergencies ({activeAlerts.length})
          </button>
          <button 
            onClick={() => setActiveTab('RESOLVED')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'RESOLVED' ? 'bg-safari-primary text-white shadow-lg shadow-safari-primary/20' : 'bg-white text-gray-400 border border-gray-100 dark:bg-dark-card dark:border-white/5'}`}
          >
            <History size={16} /> Resolved History ({resolvedAlerts.length})
          </button>
        </div>

        {activeTab === 'RESOLVED' && resolvedAlerts.length > 0 && (
          <Button 
            variant="outline" 
            onClick={() => setConfirmDelete('all')}
            className="border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white uppercase font-black text-[10px] tracking-[0.2em] h-11 px-6 rounded-2xl transition-all"
          >
            <Trash2 size={14} className="mr-2" /> Clear All Resolved
          </Button>
        )}
      </div>

      {activeTab === 'ACTIVE' ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {activeAlerts.length === 0 ? (
            <div className="col-span-full py-24 text-center bg-white dark:bg-dark-card rounded-3xl border border-dashed border-gray-200 dark:border-white/5">
               <CheckCircle2 size={48} className="mx-auto text-emerald-400 mb-4" />
               <p className="font-dm-sans text-gray-500 dark:text-gray-400 font-medium">All clear. No active SOS alerts.</p>
            </div>
          ) : (
            activeAlerts.map(alert => (
              <Card key={alert.id} className={`border-none ring-1 ring-inset ${alert.status === 'Active' ? 'ring-red-100 bg-red-50/10 dark:bg-red-500/5' : 'ring-gray-100 dark:ring-white/5'}`}>
                <CardContent className="p-6">
                   <div className="flex justify-between items-start mb-6">
                      <div className="flex gap-4">
                         <div className={`w-12 h-12 rounded-2xl ${getUrgencyColor(alert.emergencyType)} flex items-center justify-center text-white shrink-0 shadow-lg`}>
                            <ShieldAlert size={24} />
                         </div>
                         <div>
                            <h3 className="font-bold text-lg text-safari-primary dark:text-white">{alert.driverName}</h3>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
                               <Clock size={14} /> Reported {alert.createdAt?.seconds ? formatDistanceToNow(alert.createdAt.seconds * 1000, { addSuffix: true }) : 'just now'}
                            </p>
                         </div>
                      </div>
                      <Badge variant={alert.status === 'Active' ? 'danger' : 'warning'} className="uppercase font-black text-[10px] tracking-widest px-3">
                         {alert.status}
                      </Badge>
                   </div>

                   <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="bg-white dark:bg-dark-surface p-4 rounded-2xl border border-gray-50 dark:border-white/5">
                         <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Location</p>
                         <p className="text-sm font-bold text-safari-primary dark:text-white flex items-center gap-1.5">
                            <MapPin size={14} className="text-safari-gold" /> {alert.parkName}
                         </p>
                      </div>
                      <div className="bg-white dark:bg-dark-surface p-4 rounded-2xl border border-gray-50 dark:border-white/5">
                         <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Emergency Type</p>
                         <p className="text-sm font-bold text-safari-primary dark:text-white flex items-center gap-1.5">
                            <AlertTriangle size={14} className="text-red-500" /> {alert.emergencyType}
                         </p>
                      </div>
                   </div>

                   <div className="flex gap-3">
                      <Button 
                        onClick={() => handleStatusUpdate(alert.id, 'Acknowledged')}
                        disabled={alert.status === 'Acknowledged'}
                        className="flex-1 bg-white dark:bg-dark-surface border-gray-100 dark:border-white/5 text-safari-primary dark:text-white hover:bg-gray-50 uppercase font-black text-[10px] tracking-widest"
                      >
                         Acknowledge
                      </Button>
                      <Button 
                        onClick={() => handleStatusUpdate(alert.id, 'Resolved')}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 border-none text-white uppercase font-black text-[10px] tracking-widest"
                      >
                         Resolve Alert
                      </Button>
                      <Button 
                        onClick={() => window.open(`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`)}
                        className="bg-safari-primary hover:bg-safari-gold border-none text-white uppercase font-black text-[10px] tracking-widest px-4"
                      >
                         <ExternalLink size={16} />
                      </Button>
                   </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <Card className="border-gray-100 dark:border-white/5 shadow-xl shadow-safari-primary/5">
           <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left">
                 <thead className="bg-gray-50/50 dark:bg-white/5">
                    <tr>
                       <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Time</th>
                       <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Personnel</th>
                       <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Type</th>
                       <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                    {resolvedAlerts.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="py-20 text-center opacity-40">
                          <History size={32} className="mx-auto mb-3" />
                          <p className="text-xs uppercase font-black tracking-widest">No resolution history found</p>
                        </td>
                      </tr>
                    ) : (
                      resolvedAlerts.map(alert => (
                        <tr key={alert.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group">
                           <td className="px-6 py-4">
                              <p className="text-xs font-bold font-jetbrains text-gray-600 dark:text-gray-400">
                                 {alert.createdAt?.seconds ? new Date(alert.createdAt.seconds * 1000).toLocaleString() : 'N/A'}
                              </p>
                           </td>
                           <td className="px-6 py-4">
                              <p className="text-sm font-bold text-safari-primary dark:text-white">{alert.driverName}</p>
                              <p className="text-[10px] text-gray-400 font-medium">Booking ID: {alert.bookingId || 'N/A'}</p>
                           </td>
                           <td className="px-6 py-4">
                              <Badge variant="outline" className="text-[9px] uppercase tracking-widest border-gray-100 dark:border-white/10">{alert.emergencyType}</Badge>
                           </td>
                           <td className="px-6 py-4 flex items-center justify-center gap-3">
                               <Button 
                                 variant="ghost" 
                                 size="sm" 
                                 className="h-8 w-8 p-0 text-safari-gold hover:bg-safari-gold/10"
                                 title="View Details"
                               >
                                  <ExternalLink size={14} />
                               </Button>
                               <Button 
                                 variant="ghost" 
                                 size="sm" 
                                 onClick={() => setConfirmDelete(alert.id)}
                                 className="h-8 w-8 p-0 text-red-400 hover:bg-red-500 hover:text-white transition-all rounded-lg"
                                 title="Delete Permanently"
                               >
                                  <Trash2 size={14} />
                               </Button>
                           </td>
                        </tr>
                      ))
                    )}
                 </tbody>
              </table>
           </CardContent>
        </Card>
      )}

      {/* Confirmation Overlay / Bottom Sheet */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-dark-card w-full max-w-md rounded-[32px] p-8 shadow-2xl animate-in slide-in-from-bottom-8 duration-500 border border-white/10">
             <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-red-50 dark:bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500">
                   <AlertCircle size={32} />
                </div>
                <button onClick={() => setConfirmDelete(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full text-gray-400 transition-colors">
                   <CloseIcon size={20} />
                </button>
             </div>
             
             <h3 className="text-2xl font-black text-safari-primary dark:text-white mb-2 leading-tight">
                {confirmDelete === 'all' ? 'Purge Resolution History?' : 'Delete Alert Record?'}
             </h3>
             <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-8">
                This action is irreversible. The record will be permanently deleted from the production database.
             </p>
             
             <div className="flex gap-3">
                <Button 
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 bg-gray-50 dark:bg-white/5 border-none text-gray-500 dark:text-gray-400 uppercase font-black text-[10px] tracking-widest h-14 rounded-2xl"
                >
                   Cancel
                </Button>
                <Button 
                  onClick={() => confirmDelete === 'all' ? handleClearAllResolved() : handleDeleteAlert(confirmDelete)}
                  className="flex-1 bg-red-500 hover:bg-red-600 border-none text-white uppercase font-black text-[10px] tracking-widest h-14 rounded-2xl shadow-lg shadow-red-200 dark:shadow-none"
                >
                   Confirm Delete
                </Button>
             </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
};
