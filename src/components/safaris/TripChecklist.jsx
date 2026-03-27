import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Square, 
  Loader2, 
  CheckCircle2, 
  Circle,
  Truck,
  UserCheck,
  PhoneCall,
  DollarSign,
  Send,
  MapPin
} from 'lucide-react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import toast from 'react-hot-toast';

export const TripChecklist = ({ bookingId }) => {
  const [checklist, setChecklist] = useState({
    driverConfirmed: false,
    vehicleInspected: false,
    clientContacted: false,
    depositReceived: false,
    fullPaymentReceived: false,
    itinerarySent: false,
    pickupConfirmed: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) return;

    const unsub = onSnapshot(doc(db, 'upcomingChecklists', bookingId), (snapshot) => {
      if (snapshot.exists()) {
        setChecklist(snapshot.data());
      }
      setLoading(false);
    });

    return () => unsub();
  }, [bookingId]);

  const toggleItem = async (key) => {
    const newValue = !checklist[key];
    const newChecklist = { ...checklist, [key]: newValue, updatedAt: serverTimestamp() };
    
    try {
      await setDoc(doc(db, 'upcomingChecklists', bookingId), newChecklist, { merge: true });
      toast.success(newValue ? 'Item completed' : 'Item unchecked', { id: `check-${key}` });
    } catch (err) {
      toast.error('Failed to update checklist');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="animate-spin text-safari-gold" />
    </div>
  );

  const items = [
    { key: 'driverConfirmed', label: 'Driver confirmed and briefed', icon: UserCheck },
    { key: 'vehicleInspected', label: 'Vehicle inspected and fueled', icon: Truck },
    { key: 'clientContacted', label: 'Client contacted (24h before)', icon: PhoneCall },
    { key: 'depositReceived', label: 'Deposit received', icon: DollarSign },
    { key: 'fullPaymentReceived', label: 'Full payment received', icon: DollarSign },
    { key: 'itinerarySent', label: 'Itinerary sent to client', icon: Send },
    { key: 'pickupConfirmed', label: 'Pickup location confirmed with client', icon: MapPin },
  ];

  const completedCount = Object.values(checklist).filter(v => v === true).length;
  const totalCount = items.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-safari-primary dark:text-dark-text text-sm uppercase tracking-widest">Trip Preparation</h4>
        <span className="text-xs font-bold text-safari-gold bg-safari-gold/10 px-2 py-0.5 rounded-full">
          {completedCount}/{totalCount} Done
        </span>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => toggleItem(item.key)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 text-left group
              ${checklist[item.key] 
                ? 'bg-safari-success/5 border-safari-success/20 text-safari-success' 
                : 'bg-white dark:bg-dark-surface border-gray-100 dark:border-dark-border text-gray-600 dark:text-gray-400 hover:border-safari-gold/30'}
            `}
          >
            {checklist[item.key] ? (
              <CheckCircle2 size={20} className="shrink-0" />
            ) : (
              <Circle size={20} className="shrink-0 group-hover:text-safari-gold" />
            )}
            
            <div className="flex items-center gap-2">
              <item.icon size={16} className={checklist[item.key] ? 'text-safari-success' : 'text-gray-400'} />
              <span className={`text-sm ${checklist[item.key] ? 'line-through opacity-70' : 'font-medium'}`}>
                {item.label}
              </span>
            </div>
          </button>
        ))}
      </div>
      
      {completedCount === totalCount && (
        <div className="p-4 bg-safari-success/10 border border-safari-success/20 rounded-xl flex items-center gap-3">
          <CheckCircle2 size={20} className="text-safari-success" />
          <p className="text-xs font-bold text-safari-success uppercase tracking-wider">All preparations complete! Ready to depart.</p>
        </div>
      )}
    </div>
  );
};
