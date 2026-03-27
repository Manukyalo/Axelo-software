import React from 'react';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Car, 
  User, 
  ArrowRight,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { Badge } from '../ui/Badge';
import { Card, CardContent } from '../ui/Card';

export const SafariCard = ({ safari, drivers = [], vehicles = [], onClick }) => {
  let daysUntil = 0;
  try {
    if (safari.date) {
      daysUntil = differenceInDays(parseISO(safari.date), new Date());
    }
  } catch (e) {
    console.error('Date error:', e);
  }
  
  const getStatusColor = () => {
    if (daysUntil < 1 && (!safari.driverId || !safari.vehicleId)) return 'border-l-red-500 animate-pulse-subtle';
    if (daysUntil < 3) return 'border-l-red-500';
    if (daysUntil < 7 || !safari.driverId || !safari.vehicleId) return 'border-l-safari-warning';
    if (safari.driverId && safari.vehicleId && safari.paymentStatus === 'Fully Paid') return 'border-l-safari-success';
    return 'border-l-safari-gold';
  };

  const getCountdownBadge = () => {
    let variant = 'gold';
    if (daysUntil < 3) variant = 'danger';
    else if (daysUntil <= 7) variant = 'warning';
    
    return (
      <Badge variant={variant} className={`text-[10px] font-bold ${daysUntil < 3 ? 'animate-pulse' : ''}`}>
        {daysUntil === 0 ? 'Starts Today' : daysUntil === 1 ? 'Starts Tomorrow' : `In ${daysUntil} Days`}
      </Badge>
    );
  };

  const driver = drivers?.find(d => d.id === safari.driverId);
  const vehicle = vehicles?.find(v => v.id === safari.vehicleId);

  return (
    <Card 
      onClick={onClick}
      className={`relative overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-l-4 ${getStatusColor()}`}
    >
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-playfair font-bold text-xl text-safari-primary dark:text-dark-text">{safari.clientName}</h3>
            <p className="text-xs text-safari-gold font-jetbrains font-bold uppercase tracking-widest mt-0.5">{safari.packageName || 'Custom Safari'}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {getCountdownBadge()}
            <Badge variant={safari.type === 'Safari' ? 'gold' : 'info'}>{safari.type || 'Safari'}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar size={14} className="text-safari-gold" />
            <span className="font-jetbrains font-bold">
              {safari.date ? (
                (() => {
                  try {
                    return format(parseISO(safari.date), 'MMM dd, yyyy');
                  } catch (e) {
                    return safari.date;
                  }
                })()
              ) : 'No date'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Clock size={14} className="text-safari-gold" />
            <span className="font-jetbrains">{safari.timeOfPickup || 'TBD'}</span>
          </div>
          <div className="col-span-2 flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
            <MapPin size={14} className="text-safari-gold mt-1 shrink-0" />
            <div className="flex flex-col">
              <span className="line-clamp-1">{safari.location || safari.destinations}</span>
              {safari.nationalPark && (
                <span className="text-[10px] text-safari-gold font-bold uppercase tracking-wider">{safari.nationalPark}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 py-3 border-t border-b border-gray-50 dark:border-dark-border mb-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-safari-primary dark:text-dark-text">
            <Users size={14} className="text-gray-400" />
            {(safari.pax?.adults || 0) + (safari.pax?.children || 0) + (safari.pax?.infants || 0)} Pax
          </div>
          <div className="h-4 w-px bg-gray-100 dark:bg-dark-border" />
          <div className="text-xs text-gray-500 italic">
            {safari.durationText || 'Standard Duration'}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <User size={13} className={driver ? 'text-safari-success' : 'text-safari-warning'} />
              <span className={driver ? 'font-medium' : 'italic text-safari-warning'}>
                {driver ? driver.name : '⚠ No Driver Assigned'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Car size={13} className={vehicle || safari.vehicleId === 'custom' ? 'text-safari-success' : 'text-safari-warning'} />
              <span className={vehicle || safari.vehicleId === 'custom' ? 'font-medium font-jetbrains' : 'italic text-safari-warning'}>
                {vehicle ? vehicle.plate : (safari.vehicleId === 'custom' ? safari.customVehicle : '⚠ No Vehicle')}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-2">
            <Badge variant={safari.paymentStatus === 'Fully Paid' ? 'success' : 'gold'}>{safari.paymentStatus}</Badge>
            <Badge variant={safari.status === 'Confirmed' ? 'info' : 'gold'}>{safari.status}</Badge>
          </div>
          <ArrowRight 
            size={18} 
            className="text-gray-300 hover:text-safari-gold transition-colors cursor-pointer" 
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};
