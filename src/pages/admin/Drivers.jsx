import React, { useState } from 'react';
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
  UserPlus
} from 'lucide-react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useData } from '../../contexts/DataContext';
import { format, parseISO, differenceInDays } from 'date-fns';
import { validateString, validateEmail } from '../../utils/validation';
import toast from 'react-hot-toast';

const DriverCard = ({ driver, onEdit, onSchedule, onDelete }) => {
  const licenseExpiry = differenceInDays(parseISO(driver.licenseExpiry), new Date());
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

  const initials = driver.name.split(' ').map(n => n[0]).join('').toUpperCase();

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
              {format(parseISO(driver.licenseExpiry), 'MMM dd, yyyy')}
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

export const Drivers = () => {
  const { state, dispatch } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [schedulingDriver, setSchedulingDriver] = useState(null);
  const [search, setSearch] = useState('');
  const [driverTypeFilter, setDriverTypeFilter] = useState('All');

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
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
        {/* Tabs */}
        <div className="flex gap-1.5 bg-white/50 dark:bg-dark-card/50 backdrop-blur-md p-1.5 rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm w-full md:w-auto overflow-x-auto no-scrollbar">
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

        <div className="relative w-full max-w-sm group">
          <div className="absolute inset-0 bg-safari-gold/5 rounded-2xl blur-xl group-focus-within:bg-safari-gold/10 transition-all duration-500" />
          <div className="relative flex items-center bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-2xl px-4 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-safari-gold/20 transition-all">
            <Search className="text-gray-400 mr-2" size={18} />
            <input 
              type="text" 
              placeholder="Search by name, phone or license..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-none text-sm outline-none font-dm-sans placeholder:text-gray-400"
            />
          </div>
        </div>
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
