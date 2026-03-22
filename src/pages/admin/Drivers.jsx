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
  Briefcase
} from 'lucide-react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useData } from '../../contexts/DataContext';
import { format, parseISO, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';

const DriverCard = ({ driver, onEdit, onSchedule }) => {
  const licenseExpiry = differenceInDays(parseISO(driver.licenseExpiry), new Date());
  const isExpired = licenseExpiry < 0;
  const isExpiringSoon = licenseExpiry >= 0 && licenseExpiry < 30;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Available': return <Badge variant="success">Available</Badge>;
      case 'On Trip': return <Badge variant="info">On Trip</Badge>;
      case 'Off Duty': return <Badge>Off Duty</Badge>;
      case 'On Leave': return <Badge variant="warning">On Leave</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  // Get initials for avatar
  const initials = driver.name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <Card className="hover:border-safari-gold group">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-safari-gold/10 text-safari-gold flex items-center justify-center text-xl font-playfair font-bold border border-safari-gold/20">
              {initials}
            </div>
            <div>
              <h3 className="font-bold text-safari-primary dark:text-dark-text group-hover:text-safari-gold transition-colors">{driver.name}</h3>
              <p className="text-xs text-gray-500 font-dm-sans">{driver.email}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {getStatusBadge(driver.status)}
            <div className="flex items-center gap-1 text-safari-gold">
              <Star size={14} fill="currentColor" />
              <span className="text-sm font-bold">{driver.rating}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 mt-6">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Phone size={14} className="text-gray-400" />
            <span>{driver.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Briefcase size={14} className="text-gray-400" />
            <span>Type: <span className="font-bold text-safari-primary dark:text-dark-text text-xs">{driver.type || 'Safari Guide'}</span></span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Briefcase size={14} className="text-gray-400" />
            <span>License: <span className="font-jetbrains font-bold text-xs">{driver.license}</span></span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar size={14} className="text-gray-400" />
            <span className={isExpired ? 'text-red-500 font-bold' : isExpiringSoon ? 'text-safari-warning font-bold' : 'text-gray-600 dark:text-gray-400'}>
              Exp: {format(parseISO(driver.licenseExpiry), 'MMM dd, yyyy')}
            </span>
            {(isExpired || isExpiringSoon) && <ShieldAlert size={14} className={isExpired ? 'text-red-500' : 'text-safari-warning'} />}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-dark-border flex items-center justify-between">
          <div className="text-xs">
            <span className="text-gray-400">Completed Trips: </span>
            <span className="font-bold text-safari-primary dark:text-dark-text">{driver.trips}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(driver)}>
              <Edit2 size={14} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500">
              <Trash2 size={14} />
            </Button>
          </div>
        </div>

        {(!driver.type || driver.type === 'Safari Guide') && (
           <Button variant="outline" size="sm" className="w-full mt-4 text-xs font-bold border-safari-gold text-safari-gold hover:bg-safari-gold hover:text-white" onClick={() => onSchedule(driver)}>
             <Calendar size={12} className="mr-2" /> Schedule Upcoming Safari
           </Button>
        )}
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

  const handleAddEdit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const driverData = Object.fromEntries(formData);
    
    if (editingDriver) {
      dispatch({ type: 'UPDATE_DRIVER', payload: { ...editingDriver, ...driverData } });
      toast.success('Driver updated successfully');
    } else {
      dispatch({ type: 'ADD_DRIVER', payload: { id: `d${Date.now()}`, ...driverData, status: 'Available', trips: 0, rating: 5.0 } });
      toast.success('Driver added successfully');
    }
    setIsModalOpen(false);
  };

  const filteredDrivers = state.drivers.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.phone.includes(search);
    const matchesType = driverTypeFilter === 'All' || (d.type || 'Safari Guide') === driverTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <PageWrapper 
      title="Drivers Management" 
      subtitle={`Track and manage your safari guides (${state.drivers.length} total)`}
      actions={
        <Button onClick={() => { setEditingDriver(null); setIsModalOpen(true); }} className="gap-2">
          <Plus size={18} /> Add Driver
        </Button>
      }
    >
      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar bg-white dark:bg-dark-card p-2 rounded-card border border-gray-100 dark:border-dark-border shadow-sm">
        {['All', 'Safari Guide', 'City Chauffeur', 'Transfer Driver'].map(type => (
          <button
            key={type}
            onClick={() => setDriverTypeFilter(type)}
            className={`px-4 py-2 rounded-button text-sm font-bold transition-all whitespace-nowrap ${
              driverTypeFilter === type 
                ? 'bg-safari-gold text-white shadow-md' 
                : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-surface'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="mb-6 bg-white dark:bg-dark-card p-4 rounded-card shadow-sm border border-gray-100 dark:border-dark-border">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name or phone..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-dark-bg border-none rounded-button text-sm focus:ring-2 focus:ring-safari-gold/20 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredDrivers.map(d => (
          <DriverCard 
            key={d.id} 
            driver={d} 
            onEdit={(d) => { setEditingDriver(d); setIsModalOpen(true); }} 
            onSchedule={(d) => { setSchedulingDriver(d); setIsScheduleModalOpen(true); }}
          />
        ))}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingDriver ? 'Edit Driver' : 'Add New Driver'}
      >
        <form onSubmit={handleAddEdit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Full Name" name="name" defaultValue={editingDriver?.name} required />
            <Input label="Phone Number" name="phone" defaultValue={editingDriver?.phone} required />
          </div>
          <Input label="Email Address" name="email" type="email" defaultValue={editingDriver?.email} required />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
               <label className="block text-sm font-medium text-safari-primary dark:text-dark-text font-dm-sans">Driver Type</label>
               <select name="type" defaultValue={editingDriver?.type || 'Safari Guide'} className="w-full px-4 py-2.5 bg-white dark:bg-dark-surface border-2 border-gray-100 dark:border-dark-border rounded-input outline-none focus:border-safari-gold focus:ring-4 focus:ring-safari-gold/5 transition-all text-sm" required>
                 <option value="Safari Guide">Safari Guide</option>
                 <option value="City Chauffeur">City Chauffeur</option>
                 <option value="Transfer Driver">Transfer Driver</option>
               </select>
            </div>
            <Input label="License Number" name="license" defaultValue={editingDriver?.license} required />
          </div>
          <Input label="License Expiry" name="licenseExpiry" type="date" defaultValue={editingDriver?.licenseExpiry} required />
          
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-dark-border">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editingDriver ? 'Update Driver' : 'Add Driver'}</Button>
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
