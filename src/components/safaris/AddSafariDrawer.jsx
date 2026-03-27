import React, { useState } from 'react';
import { 
  X, 
  User, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  CreditCard,
  Plus,
  Compass
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export const AddSafariDrawer = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    clientName: '',
    location: '',
    date: '',
    timeOfPickup: '',
    adults: 1,
    children: 0,
    type: 'Van',
    paymentStatus: 'Unpaid',
    status: 'Confirmed',
    notes: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.clientName || !formData.date || !formData.location) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const bookingData = {
        ...formData,
        adults: parseInt(formData.adults),
        children: parseInt(formData.children),
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        creatorName: user.username || 'Admin',
        // Default empty assignments for a new safari
        driverId: '',
        vehicleId: '',
      };

      await addDoc(collection(db, 'bookings'), bookingData);
      
      // Also add an internal notification for the new booking
      await addDoc(collection(db, 'notifications'), {
        title: 'New Safari Added',
        message: `New safari for ${formData.clientName} to ${formData.location} scheduled for ${formData.date}.`,
        date: new Date().toISOString(),
        read: false,
        type: 'SUCCESS',
        targetRole: 'both'
      });

      toast.success('Safari scheduled successfully!');
      onClose();
      // Reset form
      setFormData({
        clientName: '',
        location: '',
        date: '',
        timeOfPickup: '',
        adults: 1,
        children: 0,
        type: 'Van',
        paymentStatus: 'Unpaid',
        status: 'Confirmed',
        notes: ''
      });
    } catch (error) {
      console.error('Error adding safari:', error);
      toast.error('Failed to schedule safari');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="absolute inset-y-0 right-0 w-full max-w-lg bg-white dark:bg-dark-surface shadow-2xl animate-slide-in-right flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-dark-border flex items-center justify-between bg-safari-primary text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-safari-gold/20 flex items-center justify-center">
              <Compass className="text-safari-gold" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-playfair font-bold">Schedule New Safari</h2>
              <p className="text-[10px] text-white/60 uppercase tracking-widest font-bold font-dm-sans">Adding to Upcoming Expeditions</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-safari-gold mb-4 pb-2 border-b border-gray-50 dark:border-dark-border">Client Information</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 ml-1">Client Name *</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input 
                    value={formData.clientName}
                    onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                    placeholder="Full name of the lead client"
                    className="pl-10 h-12 rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-safari-gold mb-4 pb-2 border-b border-gray-50 dark:border-dark-border">Trip Details</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 ml-1">Destination / Location *</label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input 
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="e.g. Maasai Mara, Amboseli"
                    className="pl-10 h-12 rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 ml-1">Departure Date *</label>
                <div className="relative">
                  <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input 
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="pl-10 h-12 rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 ml-1">Pickup Time</label>
                <div className="relative">
                  <Clock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input 
                    type="time"
                    value={formData.timeOfPickup}
                    onChange={(e) => setFormData({...formData, timeOfPickup: e.target.value})}
                    className="pl-10 h-12 rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 ml-1">Adults</label>
                <div className="relative">
                  <Users size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input 
                    type="number"
                    min="1"
                    value={formData.adults}
                    onChange={(e) => setFormData({...formData, adults: e.target.value})}
                    className="pl-10 h-12 rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 ml-1">Children</label>
                <div className="relative">
                  <Users size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input 
                    type="number"
                    min="0"
                    value={formData.children}
                    onChange={(e) => setFormData({...formData, children: e.target.value})}
                    className="pl-10 h-12 rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 ml-1">Safari Vehicle Type</label>
                <select 
                  className="w-full h-12 rounded-xl border border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-surface px-4 text-sm outline-none focus:ring-2 focus:ring-safari-gold/20"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                >
                  <option value="Van">Safari Van</option>
                  <option value="Cruiser">Land Cruiser</option>
                  <option value="Luxury">Luxury SUV</option>
                  <option value="Bus">Tour Bus</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 ml-1">Payment Status</label>
                 <select 
                  className="w-full h-12 rounded-xl border border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-surface px-4 text-sm outline-none focus:ring-2 focus:ring-safari-gold/20"
                  value={formData.paymentStatus}
                  onChange={(e) => setFormData({...formData, paymentStatus: e.target.value})}
                >
                  <option value="Unpaid">Unpaid</option>
                  <option value="Partial">Partial Deposit</option>
                  <option value="Fully Paid">Fully Paid</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-safari-gold mb-4 pb-2 border-b border-gray-50 dark:border-dark-border">Internal Notes</h3>
            <textarea 
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Any special requests or instructions..."
              className="w-full h-24 rounded-xl border border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-surface p-4 text-sm outline-none focus:ring-2 focus:ring-safari-gold/20 resize-none"
            />
          </div>
        </form>

        {/* Action Button */}
        <div className="p-8 border-t border-gray-100 dark:border-dark-border bg-gray-50/50 dark:bg-dark-surface/50">
          <Button 
            onClick={handleSubmit}
            className="w-full h-14 rounded-2xl bg-safari-primary hover:bg-safari-primary/95 text-white font-bold text-lg shadow-xl hover:translate-y-[-2px] transition-all disabled:opacity-50"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Scheduling...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Plus size={20} />
                <span>Confirm Safari Schedule</span>
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
