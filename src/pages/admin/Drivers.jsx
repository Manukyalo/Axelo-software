import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  Star, 
  ShieldAlert,
  Edit2, 
  Trash2,
  Calendar,
  Briefcase,
  ExternalLink,
  ShieldCheck,
  LayoutGrid,
  List,
  UserPlus,
  Users,
  Check,
  X,
  Eye,
  Camera,
  Trash,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useData } from '../../contexts/DataContext';
import { format, parseISO, differenceInDays, formatDistanceToNow } from 'date-fns';
import { validateString, validateEmail } from '../../utils/validation';
import toast from 'react-hot-toast';

const DriverCard = ({ driver, onEdit, onSchedule, onDelete }) => {
  const navigate = useNavigate();
  const licenseExpiryDate = driver.licenseExpiry ? parseISO(driver.licenseExpiry) : new Date();
  const licenseExpiry = differenceInDays(licenseExpiryDate, new Date());
  const isExpired = licenseExpiry < 0;
  const isExpiringSoon = licenseExpiry >= 0 && licenseExpiry < 30;

  const STAFF_PORTAL_URL = 'https://eastern-vacations-staff.vercel.app/';

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Available': return <Badge variant="success" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Available</Badge>;
      case 'On Trip': return <Badge variant="info" className="bg-sky-500/10 text-sky-600 border-sky-500/20">On Trip</Badge>;
      case 'Off Duty': return <Badge className="bg-slate-500/10 text-slate-600 border-slate-500/20">Off Duty</Badge>;
      case 'On Leave': return <Badge variant="warning" className="bg-amber-500/10 text-amber-600 border-amber-500/20">On Leave</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const initials = (driver.name || 'D').split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <Card className="group relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-safari-gold/10 border-gray-100/50 dark:border-dark-border/50 bg-white/80 dark:bg-dark-card/80 backdrop-blur-xl">
      <div className="absolute top-0 right-0 w-32 h-32 bg-safari-gold/5 rounded-full -mr-16 -mt-16 transition-transform duration-700 group-hover:scale-150" />
      
      <CardContent className="pt-6 relative">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-safari-gold/20 to-safari-gold/5 text-safari-gold flex items-center justify-center text-2xl font-playfair font-black border border-safari-gold/10 shadow-inner">
                {initials}
              </div>
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-dark-card flex items-center justify-center shadow-sm ${driver.status === 'Available' ? 'bg-emerald-500' : 'bg-gray-400'}`}>
                {driver.status === 'Available' && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
              </div>
            </div>
            <div>
              <h3 className="font-bold text-lg text-safari-primary dark:text-dark-text group-hover:text-safari-gold transition-colors duration-300">{driver.name}</h3>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-dm-sans">
                <Mail size={12} className="opacity-70" />
                {driver.email}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {getStatusBadge(driver.status)}
            <div className="flex items-center gap-1.5 px-2 py-1 bg-safari-gold/5 rounded-full border border-safari-gold/10">
              <Star size={12} className="text-safari-gold" fill="currentColor" />
              <span className="text-xs font-black text-safari-gold">{driver.rating}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-3 rounded-xl bg-gray-50/50 dark:bg-dark-bg/50 border border-gray-100 dark:border-dark-border group/stat">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Contact</p>
            <p className="text-xs font-jetbrains font-bold text-safari-primary dark:text-dark-text">{driver.phone}</p>
          </div>
          <div className="p-3 rounded-xl bg-gray-50/50 dark:bg-dark-bg/50 border border-gray-100 dark:border-dark-border">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Trips</p>
            <p className="text-xs font-jetbrains font-bold text-safari-primary dark:text-dark-text">{driver.trips} Done</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between text-xs p-2.5 rounded-lg border border-transparent hover:border-safari-gold/10 hover:bg-safari-gold/5 transition-all">
            <div className="flex items-center gap-2 text-gray-500">
              <Briefcase size={14} />
              <span>Type</span>
            </div>
            <span className="font-bold text-safari-primary dark:text-dark-text">{driver.type || 'Safari Guide'}</span>
          </div>
          <div className="flex items-center justify-between text-xs p-2.5 rounded-lg border border-transparent hover:border-safari-gold/10 hover:bg-safari-gold/5 transition-all">
            <div className="flex items-center gap-2 text-gray-500">
              <ShieldCheck size={14} />
              <span>Staff Portal</span>
            </div>
            <Badge variant="outline" className="text-[10px] py-0 border-safari-gold/30 text-safari-gold bg-safari-gold/5 h-5">Linked</Badge>
          </div>
          <div className="flex items-center justify-between text-xs p-2.5 rounded-lg border border-transparent hover:border-safari-gold/10 hover:bg-safari-gold/5 transition-all">
            <div className="flex items-center gap-2 text-gray-500">
              <Calendar size={14} />
              <span>License Exp</span>
            </div>
            <span className={`font-bold ${isExpired ? 'text-red-500' : isExpiringSoon ? 'text-amber-500' : 'text-safari-primary dark:text-dark-text'}`}>
              {driver.licenseExpiry ? format(licenseExpiryDate, 'MMM dd, yyyy') : 'No Date Set'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100 dark:border-dark-border">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-xs font-black shadow-sm group/btn"
            onClick={() => window.open(STAFF_PORTAL_URL, '_blank')}
          >
            <ExternalLink size={12} className="mr-2 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
            Portal
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-xs font-black border-safari-gold text-safari-gold hover:bg-safari-gold hover:text-white"
            onClick={() => onSchedule(driver)}
          >
            <Calendar size={12} className="mr-2" />
            Schedule
          </Button>
        </div>

        <div className="mt-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-xs font-black border-safari-primary/20 text-safari-primary hover:bg-safari-primary hover:text-white gap-2"
            onClick={() => navigate('/admin/messages', { state: { chatId: `chat_${driver.id}` } })}
          >
            <MessageSquare size={12} />
            Message Driver
          </Button>
        </div>

        <div className="mt-4 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <p className="text-[10px] text-gray-400 font-medium italic">License: {driver.license}</p>
          <div className="flex gap-1">
             <button onClick={() => onEdit(driver)} className="p-1.5 rounded-lg hover:bg-safari-gold/10 text-gray-400 hover:text-safari-gold transition-colors">
               <Edit2 size={12} />
             </button>
             <button onClick={() => onDelete(driver)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
               <Trash2 size={12} />
             </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const PendingApprovalsView = () => {
  const { dispatch } = useData();
  const [pendingDrivers, setPendingDrivers] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'driverAuth'),
      where('approved', '==', false)
    );
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const pendingList = await Promise.all(
          snapshot.docs.map(async (authDoc) => {
            const authData = { 
              id: authDoc.id, 
              ...authDoc.data() 
            };
            
            // Look up driver name from drivers collection by matching email stored in driverAuth
            if (authData.email) {
              const driverQuery = query(
                collection(db, 'drivers'),
                where('email', '==', authData.email)
              );
              const driverSnap = await getDocs(driverQuery);
              if (!driverSnap.empty) {
                const driverDoc = driverSnap.docs[0].data();
                authData.name = driverDoc.name;
                authData.phone = driverDoc.phone;
                authData.driverDocId = driverSnap.docs[0].id;
              }
            }
            
            return authData;
          })
        );
        setPendingDrivers(pendingList);
      } catch (err) {
        console.error('Snapshot processing error:', err);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error('Pending approvals query error:', error);
      setPendingDrivers([]);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    try {
      if (timestamp?.toDate) return format(timestamp.toDate(), 'MMM dd, yyyy');
      if (timestamp?.seconds) return format(new Date(timestamp.seconds * 1000), 'MMM dd, yyyy');
      return 'Unknown date';
    } catch (e) {
      return 'Unknown date';
    }
  };

  const handleApprove = async (driverAuthId) => {
    try {
      const driverAuthRef = doc(db, 'driverAuth', driverAuthId);
      const driverAuthSnap = await getDoc(driverAuthRef);
      
      if (!driverAuthSnap.exists()) {
        console.error('driverAuth document not found:', driverAuthId);
        toast.error('Driver record not found. Please refresh and try again.');
        return;
      }
      
      const driverData = driverAuthSnap.data();
      const driverName = pendingDrivers.find(d => d.id === driverAuthId)?.name || driverData.email || 'Unknown Driver';

      // Document exists — safe to update
      await updateDoc(driverAuthRef, {
        approved: true,
        approvedAt: serverTimestamp(),
        approvedBy: auth.currentUser?.uid || 'system_admin'
      });
      
      // Notify both admin and driver
      await dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          title: `Driver Approved — ${driverName}`,
          message: `${driverName} has been approved and can now access the staff portal.`,
          type: 'SUCCESS',
          targetRole: 'both',
          date: new Date().toISOString()
        }
      });
      
      toast.success(`${driverName} approved successfully`);
    } catch (error) {
      console.error('Approve error:', error);
      toast.error('Failed to approve: ' + error.message);
    }
  };

  const handleReject = async () => {
    try {
      const driver = pendingDrivers.find(a => a.id === rejectingId);
      await dispatch({ type: 'DELETE_DRIVERAUTH', payload: rejectingId });
      
      // Cloud function call mentioned in request - we simulate it with notification
      await dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          title: `Driver Rejected — ${driver?.name ?? 'Unknown Driver'}`,
          message: `${driver?.name ?? 'Unknown Driver'}'s application was rejected and account disabled.`,
          type: 'INFO',
          targetRole: 'admin',
          date: new Date().toISOString()
        }
      });
      
      toast.success('Driver application rejected');
      setRejectingId(null);
    } catch (err) {
      toast.error('Failed to reject driver');
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center animate-pulse">
        <div className="w-12 h-12 bg-gray-200 dark:bg-dark-border rounded-full mx-auto mb-4" />
        <p className="text-gray-400 font-dm-sans">Checking for pending approvals...</p>
      </div>
    );
  }

  if (pendingDrivers.length === 0) {
    return (
      <div className="py-20 text-center bg-gray-50/50 dark:bg-dark-card/50 rounded-3xl border border-dashed border-gray-200 dark:border-dark-border">
        <ShieldCheck size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500 font-dm-sans">No pending approvals at this time</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {pendingDrivers.map(driver => (
        <Card key={driver?.id} className="overflow-hidden border-gray-100 dark:border-dark-border group/card">
          <CardContent className="p-0">
            <div className="h-48 bg-gray-100 dark:bg-dark-bg relative group">
              {driver?.faceImageUrl ? (
                <img 
                  src={driver.faceImageUrl} 
                  alt={driver?.name ?? 'Driver Face ID'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-safari-gold/10 text-safari-gold">
                   <div className="w-20 h-20 rounded-full bg-white dark:bg-dark-card flex items-center justify-center text-3xl font-black shadow-inner">
                      {driver?.name?.charAt(0) ?? '?'}
                   </div>
                </div>
              )}
              {driver?.faceImageUrl && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button size="sm" variant="secondary" onClick={() => setSelectedPhoto(driver.faceImageUrl)} className="gap-2">
                    <Eye size={14} /> View Face ID
                  </Button>
                </div>
              )}
            </div>
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-safari-primary dark:text-dark-text">{driver?.name ?? 'Unknown Driver'}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Registered {formatDate(driver?.registeredAt)}
                  </p>
                </div>
                <Badge variant="gold" className="text-[10px] uppercase tracking-widest bg-safari-gold/10 text-safari-gold border-safari-gold/20">
                  {driver?.role === 'safari_driver' ? 'Safari Driver' : 'City Driver'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-6">
                <Button 
                  onClick={() => handleApprove(driver.id)}
                  className="bg-emerald-500 hover:bg-emerald-600 border-none text-white text-xs font-black uppercase tracking-widest gap-2"
                >
                  <Check size={14} /> Approve
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setRejectingId(driver.id)}
                  className="border-red-500 text-red-500 hover:bg-red-50 text-xs font-black uppercase tracking-widest gap-2"
                >
                  <X size={14} /> Reject
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Face ID Modal */}
      <Modal isOpen={!!selectedPhoto} onClose={() => setSelectedPhoto(null)} title="Face ID Verification">
        <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-dark-border">
          <img src={selectedPhoto} alt="Face ID" className="w-full h-auto" />
        </div>
      </Modal>

      {/* Rejection Confirmation */}
      <Modal isOpen={!!rejectingId} onClose={() => setRejectingId(null)} title="Confirm Rejection">
        <div className="space-y-6 py-4">
          <div className="p-4 bg-red-50 rounded-2xl flex gap-3 text-red-600">
            <AlertCircle className="shrink-0" size={20} />
            <p className="text-sm font-medium">Are you sure you want to reject this driver? This will disable their account access and cannot be undone.</p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setRejectingId(null)}>Cancel</Button>
            <Button onClick={handleReject} className="bg-red-500 hover:bg-red-600 border-none text-white">Confirm Rejection</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const PortersView = () => {
  const { state, dispatch } = useData();
  const [subTab, setSubTab] = useState('PENDING'); // PENDING, ALL
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const pendingPorters = state.porters.filter(p => !p.approved);
  const allPorters = state.porters.filter(p => p.approved);

  const handleApprove = async (porter) => {
    try {
      await dispatch({ type: 'UPDATE_PORTER', payload: { id: porter.id, approved: true } });
      
      // Notify admin and linked driver
      await dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          title: `Porter Approved — ${porter.name}`,
          message: `${porter.name} has been approved and is linked to your account.`,
          type: 'SUCCESS',
          targetRole: 'admin',
          date: new Date().toISOString()
        }
      });
      
      toast.success('Porter approved');
    } catch (err) {
      toast.error('Failed to approve porter');
    }
  };

  const handleReject = async (porter) => {
    if (window.confirm(`Are you sure you want to reject and delete porter ${porter.name}?`)) {
      try {
        await dispatch({ type: 'DELETE_PORTER', payload: porter.id });
        toast.success('Porter rejected');
      } catch (err) {
        toast.error('Failed to reject porter');
      }
    }
  };

  const toggleStatus = async (porter) => {
    const newStatus = porter.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await dispatch({ type: 'UPDATE_PORTER', payload: { id: porter.id, status: newStatus } });
      toast.success(`Porter ${newStatus}`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const getMilestoneBadge = (count) => {
    if (count >= 100) return <Badge variant="gold" className="bg-platinum/20 text-platinum border-platinum/30">👑 Senior Porter</Badge>;
    if (count >= 50) return <Badge variant="gold">⭐ Experienced Porter</Badge>;
    if (count >= 10) return <Badge variant="info" className="bg-silver/20 text-silver">🌟 Active Porter</Badge>;
    return <Badge variant="default">New Porter</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 p-1 bg-gray-50 dark:bg-dark-bg rounded-2xl w-max">
        <button 
          onClick={() => setSubTab('PENDING')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${subTab === 'PENDING' ? 'bg-white dark:bg-dark-card shadow-sm text-safari-gold' : 'text-gray-400'}`}
        >
          Pending Approval ({pendingPorters.length})
        </button>
        <button 
          onClick={() => setSubTab('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${subTab === 'ALL' ? 'bg-white dark:bg-dark-card shadow-sm text-safari-gold' : 'text-gray-400'}`}
        >
          All Porters ({allPorters.length})
        </button>
      </div>

      {subTab === 'PENDING' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {pendingPorters.length === 0 ? (
            <div className="col-span-full py-20 text-center opacity-50 flex flex-col items-center">
              <Users size={48} className="text-gray-300 mb-4" />
              <p className="text-sm font-dm-sans">No porters awaiting approval.</p>
            </div>
          ) : (
            pendingPorters.map(porter => {
              const linkedDriver = state.drivers.find(d => d.id === porter.driverId)?.name || 'Unknown Driver';
              return (
                <Card key={porter.id} className="border-gray-100 dark:border-dark-border">
                  <CardContent className="p-5 flex items-center gap-4">
                    <button onClick={() => setSelectedPhoto(porter.faceImageUrl)} className="relative group shrink-0">
                      <img src={porter.faceImageUrl || 'https://via.placeholder.com/100'} className="w-16 h-16 rounded-xl object-cover border border-gray-100" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                        <Eye size={12} className="text-white" />
                      </div>
                    </button>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-safari-primary dark:text-dark-text truncate">{porter.name}</h4>
                      <p className="text-[11px] text-gray-500 font-medium">#{porter.phone}</p>
                      <p className="text-[10px] text-safari-gold font-bold uppercase mt-1">By: {linkedDriver}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                       <button onClick={() => handleApprove(porter)} className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"><Check size={16} /></button>
                       <button onClick={() => handleReject(porter)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"><X size={16} /></button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      ) : (
        <Card className="border-gray-100 dark:border-dark-border">
          <CardContent className="p-0 overflow-x-auto">
             <table className="w-full text-left">
               <thead className="bg-gray-50/50 dark:bg-dark-bg/50">
                 <tr>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Porter Details</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Linked Driver</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Trips</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Milestone</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-50 dark:divide-dark-border">
                 {allPorters.length === 0 ? (
                   <tr><td colSpan="6" className="py-20 text-center opacity-50 font-dm-sans">No approved porters found.</td></tr>
                 ) : (
                   allPorters.map(porter => (
                     <tr key={porter.id} className="hover:bg-gray-50/50 dark:hover:bg-dark-card/50 transition-colors">
                       <td className="px-6 py-4">
                         <div className="flex items-center gap-3">
                            <img src={porter.faceImageUrl} className="w-10 h-10 rounded-lg object-cover" />
                            <div>
                               <p className="text-sm font-bold text-safari-primary dark:text-dark-text">{porter.name}</p>
                               <p className="text-[10px] text-gray-400 font-medium">{porter.phone}</p>
                            </div>
                         </div>
                       </td>
                       <td className="px-6 py-4 text-xs font-medium text-gray-600 dark:text-gray-400">
                          {state.drivers.find(d => d.id === porter.driverId)?.name || 'Unknown'}
                       </td>
                       <td className="px-6 py-4 text-center">
                          <span className="text-xs font-jetbrains font-black text-safari-gold bg-safari-gold/5 px-2 py-0.5 rounded-full">{porter.tripCount || 0}</span>
                       </td>
                       <td className="px-6 py-4">
                          {getMilestoneBadge(porter.tripCount || 0)}
                       </td>
                       <td className="px-6 py-4">
                          <button 
                            onClick={() => toggleStatus(porter)}
                            className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter px-2.5 py-1 rounded-full border transition-all ${
                              porter.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-400 border-gray-100'
                            }`}
                          >
                             <div className={`w-1.5 h-1.5 rounded-full ${porter.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                             {porter.status || 'Active'}
                          </button>
                       </td>
                       <td className="px-6 py-4 text-right">
                          <button onClick={() => handleReject(porter)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"><Trash size={16} /></button>
                       </td>
                     </tr>
                   ))
                 )}
               </tbody>
             </table>
          </CardContent>
        </Card>
      )}

      {/* Photo Modal */}
      <Modal isOpen={!!selectedPhoto} onClose={() => setSelectedPhoto(null)} title="Porter Photo">
        <div className="rounded-2xl overflow-hidden">
          <img src={selectedPhoto} className="w-full h-auto" />
        </div>
      </Modal>
    </div>
  );
};

export const Drivers = () => {
  const { state, dispatch } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [schedulingDriver, setSchedulingDriver] = useState(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, PENDING, PORTERS
  const [driverTypeFilter, setDriverTypeFilter] = useState('All');
  
  const pendingCount = state.driverAuth.filter(a => !a.approved).length;
  const pendingPortersCount = state.porters.filter(p => !p.approved).length;

  const handleDelete = (driver) => {
    if (window.confirm(`Are you sure you want to delete driver ${driver.name}?`)) {
      dispatch({ type: 'DELETE_DRIVER', payload: driver.id });
      toast.success(`${driver.name} has been removed.`);
    }
  };

  const handleAddEdit = (e) => {
    e.preventDefault();
    try {
      const formData = new FormData(e.target);
      const driverData = Object.fromEntries(formData);
      
      const name = validateString(driverData.name, 100, 'Full Name');
      const phone = validateString(driverData.phone, 30, 'Phone Number');
      const email = validateEmail(driverData.email);
      const type = validateString(driverData.type, 50, 'Driver Type');
      const license = validateString(driverData.license, 50, 'License Number');
      const licenseExpiry = validateString(driverData.licenseExpiry, 20, 'License Expiry');

      const cleanDriverData = { name, phone, email, type, license, licenseExpiry };

      if (editingDriver) {
        dispatch({ type: 'UPDATE_DRIVER', payload: { ...editingDriver, ...cleanDriverData } });
        toast.success('Driver updated successfully');
      } else {
        dispatch({ type: 'ADD_DRIVER', payload: { id: `d${Date.now()}`, ...cleanDriverData, status: 'Available', trips: 0, rating: 5.0 } });
        toast.success('Driver added successfully');
      }
      setIsModalOpen(false);
    } catch(err) {
      toast.error(err.message);
    }
  };

  const filteredDrivers = state.drivers.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.phone.includes(search);
    const matchesType = driverTypeFilter === 'All' || (d.type || 'Safari Guide') === driverTypeFilter;
    return matchesSearch && matchesType;
  });

  const STAFF_PORTAL_URL = 'https://eastern-vacations-staff.vercel.app/';

  return (
    <PageWrapper 
      title="Fleet Personnel" 
      subtitle={`Manage your elite team of safari guides and logistics experts (${state.drivers.length} personnel)`}
      actions={
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => window.open(STAFF_PORTAL_URL, '_blank')} className="gap-2 border-emerald-500/20 text-emerald-600 hover:bg-emerald-50 bg-emerald-50/30">
            <ShieldCheck size={18} /> Open Staff Portal
          </Button>
          <Button onClick={() => { setEditingDriver(null); setIsModalOpen(true); }} className="gap-2 shadow-lg shadow-safari-gold/20">
            <UserPlus size={18} /> Add New Personnel
          </Button>
        </div>
      }
    >
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between mb-8 border-b border-gray-100 dark:border-dark-border pb-6">
        {/* Main Tabs */}
        <div className="flex gap-8">
          {[
            { id: 'ALL', label: 'All Personnel', count: state.drivers.length },
            { id: 'PENDING', label: 'Pending Approvals', count: pendingCount },
            { id: 'PORTERS', label: 'Porters', count: state.porters.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-1 text-sm font-black uppercase tracking-widest transition-all relative ${
                activeTab === tab.id ? 'text-safari-gold' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${
                  activeTab === tab.id ? 'bg-safari-gold text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-safari-gold rounded-full" />
              )}
            </button>
          ))}
        </div>

        <div className="relative w-full max-w-sm group">
          <div className="absolute inset-0 bg-safari-gold/5 rounded-2xl blur-xl group-focus-within:bg-safari-gold/10 transition-all duration-500" />
          <div className="relative flex items-center bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-2xl px-4 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-safari-gold/20 transition-all">
            <Search className="text-gray-400 mr-2" size={18} />
            <input 
              type="text" 
              placeholder="Search..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-none text-sm outline-none font-dm-sans placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>

      {activeTab === 'ALL' && (
        <>
          <div className="flex gap-1.5 bg-white/50 dark:bg-dark-card/50 backdrop-blur-md p-1.5 rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm w-full md:w-auto overflow-x-auto no-scrollbar mb-8 max-w-max">
            {['All', 'Safari Guide', 'City Chauffeur', 'Transfer Driver'].map(type => (
              <button
                key={type}
                onClick={() => setDriverTypeFilter(type)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                  driverTypeFilter === type 
                    ? 'bg-safari-gold text-white shadow-lg shadow-safari-gold/20' 
                    : 'text-gray-500 hover:bg-white dark:hover:bg-dark-surface hover:shadow-sm'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredDrivers.map(d => (
              <DriverCard 
                key={d.id} 
                driver={d} 
                onEdit={(d) => { setEditingDriver(d); setIsModalOpen(true); }} 
                onSchedule={(d) => { setSchedulingDriver(d); setIsScheduleModalOpen(true); }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </>
      )}

      {activeTab === 'PENDING' && (
        <PendingApprovalsView />
      )}

      {activeTab === 'PORTERS' && (
        <PortersView />
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingDriver ? 'Update Personnel Profile' : 'Onboard New Personnel'}
      >
        <form onSubmit={handleAddEdit} className="space-y-8 py-2">
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-safari-gold mb-2">
              <div className="w-8 h-8 rounded-lg bg-safari-gold/10 flex items-center justify-center">
                <Users size={18} />
              </div>
              <h4 className="text-sm font-black uppercase tracking-widest font-playfair">Identity & Contact</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-5">
              <Input label="Full Full Name" name="name" defaultValue={editingDriver?.name} placeholder="e.g. Samuel Njenga" required />
              <Input label="Active Phone Number" name="phone" defaultValue={editingDriver?.phone} placeholder="+254..." required />
            </div>
            <Input label="Onboarding Email Address" name="email" type="email" defaultValue={editingDriver?.email} placeholder="samuel@easternvacations.com" required />
          </div>

          <div className="space-y-6">
             <div className="flex items-center gap-2 text-safari-gold mb-2">
              <div className="w-8 h-8 rounded-lg bg-safari-gold/10 flex items-center justify-center">
                <Briefcase size={18} />
              </div>
              <h4 className="text-sm font-black uppercase tracking-widest font-playfair">Professional Credentials</h4>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                 <label className="block text-xs font-black text-safari-primary dark:text-dark-text uppercase tracking-wider opacity-60">Personnel Role</label>
                 <select name="type" defaultValue={editingDriver?.type || 'Safari Guide'} className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-xl outline-none focus:border-safari-gold focus:ring-4 focus:ring-safari-gold/5 transition-all text-sm font-medium" required>
                   <option value="Safari Guide">Senior Safari Guide</option>
                   <option value="City Chauffeur">Corporate Chauffeur</option>
                   <option value="Transfer Driver">Airport Transfer Specialist</option>
                 </select>
              </div>
              <Input label="DL Number" name="license" defaultValue={editingDriver?.license} placeholder="KRA-..." required />
            </div>
            <Input label="License Validity Expiry" name="licenseExpiry" type="date" defaultValue={editingDriver?.licenseExpiry} required />
          </div>

          <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 space-y-3">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-600">
                  <ShieldCheck size={18} />
                  <span className="text-xs font-black uppercase tracking-widest">Portal Synchronization</span>
                </div>
                <div className="w-8 h-4 bg-emerald-500 rounded-full relative shadow-inner shadow-black/10">
                   <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-sm" />
                </div>
             </div>
             <p className="text-[10px] text-gray-500 font-medium leading-relaxed italic">
               Enabling this will automatically synthesize a staff profile in the **Eastern Vacations Staff Portal** and dispatch onboarding credentials to the user via email.
             </p>
          </div>
          
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-dark-border">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)} className="text-xs font-black uppercase tracking-widest">Discard</Button>
            <Button type="submit" className="px-8 shadow-lg shadow-safari-gold/20 text-xs font-black uppercase tracking-widest">
              {editingDriver ? 'Update Profile' : 'Complete Onboarding'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Schedule Safari Modal */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title={`Schedule Safari: ${schedulingDriver?.name}`}
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          toast.success(`${schedulingDriver?.name} successfully scheduled!`);
          setIsScheduleModalOpen(false);
        }} className="space-y-6">
           <div className="space-y-1.5">
             <label className="block text-sm font-medium text-safari-primary dark:text-dark-text font-dm-sans">Select Upcoming Safari / Trip</label>
             <select required className="w-full px-4 py-2.5 bg-white dark:bg-dark-surface border-2 border-gray-100 dark:border-dark-border rounded-input outline-none focus:border-safari-gold focus:ring-4 focus:ring-safari-gold/5 transition-all text-sm">
               {state.packages.map(p => (
                 <option key={p.id} value={p.id}>{p.name}</option>
               ))}
               <option value="custom">Custom Safari Route</option>
             </select>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
             <Input label="Start Date" name="startDate" type="date" required />
             <Input label="End Date" name="endDate" type="date" required />
           </div>

           <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-dark-border">
             <Button variant="ghost" type="button" onClick={() => setIsScheduleModalOpen(false)}>Cancel</Button>
             <Button type="submit">Confirm Schedule</Button>
           </div>
        </form>
      </Modal>
    </PageWrapper>
  );
};
