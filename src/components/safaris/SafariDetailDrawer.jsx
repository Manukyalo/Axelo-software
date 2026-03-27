import React from 'react';
import { 
  X, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  Car, 
  User, 
  Phone, 
  Mail, 
  MessageCircle, 
  Printer, 
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { TripChecklist } from './TripChecklist';
import { useNavigate } from 'react-router-dom';

export const SafariDetailDrawer = ({ safari, isOpen, onClose, drivers, vehicles }) => {
  const navigate = useNavigate();
  if (!safari) return null;

  const driver = drivers?.find(d => d.id === safari.driverId);
  const vehicle = vehicles?.find(v => v.id === safari.vehicleId);

  const handleWhatsApp = () => {
    let dateStr = safari.date;
    try {
      if (safari.date) dateStr = format(parseISO(safari.date), 'MMM dd, yyyy');
    } catch (e) {}

    const text = `Dear ${safari.clientName}, your safari to ${safari.destinations || safari.location} departs on ${dateStr} at ${safari.timeOfPickup || 'TBD'}. Please be ready at ${safari.location || 'the meetup point'}. Thank you — Eastern Vacations Team.`;
    window.open(`https://wa.me/${safari.clientPhone || ''}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-safari-primary/40 backdrop-blur-sm z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`fixed right-0 top-0 h-screen w-full max-w-[480px] bg-white dark:bg-dark-bg shadow-2xl z-50 transform transition-transform duration-500 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col h-screen overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-dark-border bg-safari-bg dark:bg-dark-surface">
            <div>
              <h2 className="text-2xl font-playfair font-bold text-safari-primary dark:text-dark-text">Trip Details</h2>
              <p className="text-xs text-safari-gold font-jetbrains font-bold uppercase tracking-widest">{safari.id}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white dark:hover:bg-dark-card rounded-full transition-colors text-gray-400 hover:text-safari-gold"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
            {/* Quick Info */}
            <div className="bg-safari-gold/5 border border-safari-gold/20 rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Info size={100} className="text-safari-gold" />
              </div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-playfair font-bold text-safari-primary dark:text-dark-text">{safari.clientName}</h3>
                  <Badge variant={safari.status === 'Confirmed' ? 'success' : 'gold'}>{safari.status}</Badge>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar size={16} className="text-safari-gold" />
                    <span className="font-jetbrains font-bold">
                       {(() => {
                         try {
                           return safari.date ? format(parseISO(safari.date), 'EEEE, MMM dd, yyyy') : 'No date';
                         } catch (e) {
                           return safari.date || 'Invalid date';
                         }
                       })()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <Clock size={16} className="text-safari-gold" />
                    <span>Pickup: <span className="font-bold text-safari-primary dark:text-dark-text">{safari.timeOfPickup || 'TBD'}</span></span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin size={16} className="text-safari-gold shrink-0" />
                    <div>
                      <p>{safari.location || safari.destinations}</p>
                      {safari.nationalPark && (
                        <p className="text-[10px] text-safari-gold font-bold uppercase tracking-wider mt-1 flex items-center gap-1">
                          <Compass size={10} /> {safari.nationalPark}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Itinerary Section */}
            {safari.itinerary && safari.itinerary.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-bold text-safari-primary dark:text-dark-text text-sm uppercase tracking-widest flex items-center gap-2">
                  <ChevronRight size={16} className="text-safari-gold" /> Safari Itinerary
                </h4>
                <div className="space-y-3 pl-4 border-l-2 border-safari-gold/20">
                  {safari.itinerary.map((stop, idx) => (
                    <div key={idx} className="relative pl-6 pb-4 last:pb-0">
                      <div className="absolute left-[-1.15rem] top-1 w-3 h-3 rounded-full bg-safari-gold border-2 border-white dark:border-dark-bg" />
                      <div className="flex flex-col">
                        <p className="text-sm font-bold text-safari-primary dark:text-dark-text">
                          {stop.lodge || 'TBD Lodge'}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-0.5">
                          <span className="flex items-center gap-1"><MapPin size={10} /> {stop.park || 'Unknown Park'}</span>
                          <span className="flex items-center gap-1 italic"><Home size={10} /> {stop.nights} {stop.nights === 1 ? 'Night' : 'Nights'}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            stop.parkFeeStatus === 'Paid' ? 'bg-safari-success/20 text-safari-success' :
                            stop.parkFeeStatus === 'Partial' ? 'bg-safari-gold/20 text-safari-gold' :
                            'bg-red-500/20 text-red-500'
                          }`}>
                            Fee: {stop.parkFeeStatus || 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assignments */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-dark-border">
                <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Assigned Driver</p>
                {driver ? (
                   <div className="flex items-center justify-between w-full">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-safari-gold/10 flex items-center justify-center text-safari-gold">
                         <User size={18} />
                       </div>
                       <div>
                         <p className="text-sm font-bold text-safari-primary dark:text-dark-text">{driver.name}</p>
                         <p className="text-[10px] text-safari-success font-bold uppercase tracking-tighter">Available</p>
                       </div>
                     </div>
                     <button 
                       onClick={() => window.open('https://eastern-vacations-staff.vercel.app/', '_blank')}
                       className="p-2 rounded-lg hover:bg-safari-gold/5 text-safari-gold transition-all"
                       title="View in Staff Portal"
                     >
                       <ExternalLink size={16} />
                     </button>
                   </div>
                ) : (
                   <p className="text-sm text-red-500 italic">No driver assigned</p>
                )}
              </div>
              <div className="p-4 bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-dark-border">
                <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Assigned Vehicle</p>
                {vehicle || safari.vehicleId === 'custom' ? (
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-safari-gold/10 flex items-center justify-center text-safari-gold">
                       <Car size={18} />
                     </div>
                     <div>
                       <p className="text-sm font-bold text-safari-primary dark:text-dark-text font-jetbrains uppercase">
                         {vehicle ? vehicle.plate : safari.customVehicle}
                       </p>
                       <p className="text-[10px] text-gray-500">{vehicle ? vehicle.name : 'Manual Entry'}</p>
                     </div>
                   </div>
                ) : (
                   <p className="text-sm text-red-500 italic">No vehicle assigned</p>
                )}
              </div>
            </div>

            {/* Trip Checklist */}
            <TripChecklist bookingId={safari.id} />

            {/* Contact Client */}
            <div className="space-y-4">
               <h4 className="font-bold text-safari-primary dark:text-dark-text text-sm uppercase tracking-widest">Client Contact</h4>
               <div className="flex gap-2">
                 <Button variant="outline" className="flex-1 gap-2" onClick={() => window.open(`tel:${safari.clientPhone || ''}`)}>
                   <Phone size={16} /> Call
                 </Button>
                 <Button variant="outline" className="flex-1 gap-2" onClick={() => window.open(`mailto:${safari.clientEmail || ''}`)}>
                   <Mail size={16} /> Email
                 </Button>
                 <Button className="flex-1 gap-2 bg-safari-success hover:bg-safari-success/90 border-none" onClick={handleWhatsApp}>
                   <MessageCircle size={16} /> WhatsApp
                 </Button>
               </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-surface shrink-0">
             <div className="grid grid-cols-2 gap-3">
               <Button variant="outline" className="gap-2" onClick={() => window.print()}>
                 <Printer size={18} /> Trip Manifest
               </Button>
               <Button className="gap-2" onClick={() => navigate('/admin/bookings')}>
                 <ExternalLink size={18} /> Full Booking
               </Button>
             </div>
          </div>
        </div>
      </div>
    </>
  );
};
