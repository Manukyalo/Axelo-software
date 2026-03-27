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
  MessageSquare
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export const SOSAlerts = () => {
  const { state, dispatch } = useData();
  const [activeTab, setActiveTab] = useState('ACTIVE'); // ACTIVE, RESOLVED

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
      <div className="flex gap-4 mb-8">
        <button 
          onClick={() => setActiveTab('ACTIVE')}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'ACTIVE' ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'bg-white text-gray-400 border border-gray-100'}`}
        >
          <ShieldAlert size={16} /> Active Emergencies ({activeAlerts.length})
        </button>
        <button 
          onClick={() => setActiveTab('RESOLVED')}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'RESOLVED' ? 'bg-safari-primary text-white shadow-lg shadow-safari-primary/20' : 'bg-white text-gray-400 border border-gray-100'}`}
        >
          <History size={16} /> Resolved History ({resolvedAlerts.length})
        </button>
      </div>

      {activeTab === 'ACTIVE' ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {activeAlerts.length === 0 ? (
            <div className="col-span-full py-24 text-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
               <CheckCircle2 size={48} className="mx-auto text-emerald-400 mb-4" />
               <p className="font-dm-sans text-gray-500 font-medium">All clear. No active SOS alerts.</p>
            </div>
          ) : (
            activeAlerts.map(alert => (
              <Card key={alert.id} className={`border-none ring-1 ring-inset ${alert.status === 'Active' ? 'ring-red-100 bg-red-50/30' : 'ring-gray-100'}`}>
                <CardContent className="p-6">
                   <div className="flex justify-between items-start mb-6">
                      <div className="flex gap-4">
                         <div className={`w-12 h-12 rounded-2xl ${getUrgencyColor(alert.emergencyType)} flex items-center justify-center text-white shrink-0 shadow-lg`}>
                            <ShieldAlert size={24} />
                         </div>
                         <div>
                            <h3 className="font-bold text-lg text-safari-primary">{alert.driverName}</h3>
                            <p className="text-sm font-medium text-gray-500 flex items-center gap-1.5 mt-0.5">
                               <Clock size={14} /> Reported {alert.createdAt?.seconds ? formatDistanceToNow(alert.createdAt.seconds * 1000, { addSuffix: true }) : 'just now'}
                            </p>
                         </div>
                      </div>
                      <Badge variant={alert.status === 'Active' ? 'danger' : 'warning'} className="uppercase font-black text-[10px] tracking-widest px-3">
                         {alert.status}
                      </Badge>
                   </div>

                   <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="bg-white p-4 rounded-2xl border border-gray-50">
                         <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Location</p>
                         <p className="text-sm font-bold text-safari-primary flex items-center gap-1.5">
                            <MapPin size={14} className="text-safari-gold" /> {alert.parkName}
                         </p>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-gray-50">
                         <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Emergency Type</p>
                         <p className="text-sm font-bold text-safari-primary flex items-center gap-1.5">
                            <AlertTriangle size={14} className="text-red-500" /> {alert.emergencyType}
                         </p>
                      </div>
                   </div>

                   <div className="flex gap-3">
                      <Button 
                        onClick={() => handleStatusUpdate(alert.id, 'Acknowledged')}
                        disabled={alert.status === 'Acknowledged'}
                        className="flex-1 bg-white border-gray-100 text-safari-primary hover:bg-gray-50 uppercase font-black text-[10px] tracking-widest"
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
        <Card className="border-gray-100">
           <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left">
                 <thead className="bg-gray-50/50">
                    <tr>
                       <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Time</th>
                       <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Personnel</th>
                       <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Type</th>
                       <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Resolution</th>
                       <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Details</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                    {resolvedAlerts.map(alert => (
                      <tr key={alert.id} className="hover:bg-gray-50/50 transition-colors">
                         <td className="px-6 py-4">
                            <p className="text-xs font-bold font-jetbrains text-gray-600">
                               {alert.createdAt?.seconds ? new Date(alert.createdAt.seconds * 1000).toLocaleString() : 'N/A'}
                            </p>
                         </td>
                         <td className="px-6 py-4">
                            <p className="text-sm font-bold text-safari-primary">{alert.driverName}</p>
                            <p className="text-[10px] text-gray-400 font-medium">Booking ID: {alert.bookingId || 'N/A'}</p>
                         </td>
                         <td className="px-6 py-4">
                            <Badge variant="outline" className="text-[9px] uppercase tracking-widest">{alert.emergencyType}</Badge>
                         </td>
                         <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-xs font-medium text-emerald-600">
                               <CheckCircle2 size={14} /> Resolved
                            </div>
                         </td>
                         <td className="px-6 py-4 text-right">
                             <Button variant="ghost" size="sm" className="text-[10px] uppercase font-bold tracking-widest text-safari-gold">View Report</Button>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </CardContent>
        </Card>
      )}
    </PageWrapper>
  );
};
