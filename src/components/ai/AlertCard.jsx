import React from 'react';
import { 
  AlertCircle, 
  Info, 
  Lightbulb, 
  CheckCircle2, 
  X, 
  ExternalLink,
  ShieldAlert,
  Calendar,
  Car,
  Users,
  TrendingUp,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';

export const AlertCard = ({ alert, onResolve, onDismiss, onRead }) => {
  const navigate = useNavigate();

  const getPriorityColor = () => {
    switch (alert.type) {
      case 'CRITICAL': return 'border-l-red-500 bg-red-50/30';
      case 'HIGH': return 'border-l-orange-500 bg-orange-50/30';
      case 'MEDIUM': return 'border-l-yellow-500 bg-yellow-50/30';
      case 'LOW': return 'border-l-blue-500 bg-blue-50/30';
      case 'INFO': return 'border-l-gray-400 bg-gray-50/30';
      case 'INSIGHT': return 'border-l-safari-gold bg-safari-gold/5';
      default: return 'border-l-gray-200';
    }
  };

  const getCategoryIcon = () => {
    switch (alert.category) {
      case 'booking': return <Calendar size={16} />;
      case 'vehicle': return <Car size={16} />;
      case 'driver': return <Users size={16} />;
      case 'revenue': return <TrendingUp size={16} />;
      case 'capacity': return <ShieldAlert size={16} />;
      default: return <Info size={16} />;
    }
  };

  const handleViewEntity = () => {
    if (onRead) onRead(alert.id);
    
    switch (alert.entityType) {
      case 'booking': navigate('/admin/bookings'); break;
      case 'vehicle': navigate('/admin/vehicles'); break;
      case 'driver': navigate('/admin/drivers'); break;
      default: break;
    }
  };

  const isHighPriority = alert.type === 'CRITICAL' || alert.type === 'INSIGHT';

  return (
    <div 
      className={`
        relative overflow-hidden group border border-gray-100 dark:border-dark-border rounded-2xl transition-all duration-300 p-5 border-l-4
        ${getPriorityColor()} ${alert.read ? 'opacity-80' : 'shadow-md'}
      `}
      onClick={() => onRead && !alert.read && onRead(alert.id)}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <Badge variant={alert.type.toLowerCase()} className="text-[10px] font-bold uppercase tracking-wider">
            {alert.type}
          </Badge>
          <div className="text-gray-400 dark:text-gray-500">
            {getCategoryIcon()}
          </div>
          <span className="text-[10px] text-gray-500 font-medium">
            {alert.createdAt?.toDate ? formatDistanceToNow(alert.createdAt.toDate(), { addSuffix: true }) : 'just now'}
          </span>
        </div>
        {!alert.read && (
          <div className="w-2 h-2 bg-safari-gold rounded-full animate-pulse" />
        )}
      </div>

      <h3 className={`
        mb-2 text-safari-primary dark:text-dark-text
        ${isHighPriority ? 'font-playfair font-bold text-lg' : 'font-dm-sans font-bold text-base'}
      `}>
        {alert.title}
      </h3>

      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
        {alert.message}
      </p>

      {alert.recommendedAction && (
        <div className="flex items-start gap-2 p-3 bg-white/50 dark:bg-dark-surface/50 rounded-xl mb-4 border border-white/20">
          <Lightbulb size={14} className="text-safari-gold mt-0.5 shrink-0" />
          <p className="text-xs italic text-safari-earthy dark:text-safari-gold/80 leading-tight">
            <span className="font-bold not-italic mr-1">Recommended:</span>
            {alert.recommendedAction}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-100/50 dark:border-dark-border/50">
        <button 
          onClick={(e) => { e.stopPropagation(); handleViewEntity(); }}
          className="flex items-center gap-1.5 text-xs font-bold text-safari-primary dark:text-dark-text hover:text-safari-gold transition-colors"
        >
          View {alert.entityType || 'Details'} <ChevronRight size={14} />
        </button>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={(e) => { e.stopPropagation(); onDismiss(alert.id); }}
            className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
            title="Dismiss"
          >
            <X size={16} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={(e) => { e.stopPropagation(); onResolve(alert.id); }}
            className="h-8 w-8 text-gray-400 hover:text-safari-success hover:bg-safari-success/5"
            title="Mark Resolved"
          >
            <CheckCircle2 size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

const ChevronRight = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m9 18 6-6-6-6"/>
  </svg>
);
