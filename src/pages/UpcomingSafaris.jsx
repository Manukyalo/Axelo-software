import React, { useState, useMemo } from 'react';
import { 
  CalendarDays, 
  MapPin, 
  List, 
  LayoutGrid, 
  Calendar, 
  Filter, 
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  UserX,
  CreditCard
} from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { useData } from '../contexts/DataContext';
import { 
  format, 
  parseISO, 
  isWithinInterval, 
  addDays, 
  addMonths, 
  startOfDay, 
  endOfDay,
  isAfter,
  isBefore
} from 'date-fns';
import { SafariTimeline } from '../components/safaris/SafariTimeline';
import { SafariCard } from '../components/safaris/SafariCard';
import { SafariCalendar } from '../components/safaris/SafariCalendar';
import { SafariDetailDrawer } from '../components/safaris/SafariDetailDrawer';
import { Button } from '../components/ui/Button';

export const UpcomingSafaris = () => {
  const { state } = useData();
  const [viewMode, setViewMode] = useState('timeline');
  const [timeFilter, setTimeFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedSafari, setSelectedSafari] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Filter Logic
  const filteredSafaris = useMemo(() => {
    const today = startOfDay(new Date());
    
    return state.bookings
      .filter(b => {
        const bookingDate = parseISO(b.date);
        
        // Basic requirement: Pending/Confirmed and Date >= Today
        const isUpcoming = (b.status === 'Confirmed' || b.status === 'Pending') && 
                          (isAfter(bookingDate, today) || isBefore(bookingDate, endOfDay(today)));
        
        if (!isUpcoming) return false;

        // Time Filter
        if (timeFilter === 'This Week') {
          return isWithinInterval(bookingDate, { start: today, end: addDays(today, 7) });
        }
        if (timeFilter === 'This Month') {
          return isWithinInterval(bookingDate, { start: today, end: addMonths(today, 1) });
        }
        if (timeFilter === 'Next 3 Months') {
          return isWithinInterval(bookingDate, { start: today, end: addMonths(today, 3) });
        }

        return true;
      })
      .filter(b => typeFilter === 'All' || b.type === typeFilter)
      .filter(b => statusFilter === 'All' || b.status === statusFilter)
      .sort((a, b) => parseISO(a.date) - parseISO(b.date));
  }, [state.bookings, timeFilter, typeFilter, statusFilter]);

  // Stats Calculations
  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    const thisWeek = filteredSafaris.filter(s => isWithinInterval(parseISO(s.date), { start: today, end: addDays(today, 7) }));
    const unassigned = filteredSafaris.filter(s => !s.driverId || s.driverId === '');
    const pendingPayment = filteredSafaris.filter(s => s.paymentStatus !== 'Fully Paid');
    const ready = filteredSafaris.filter(s => s.driverId && s.vehicleId && s.paymentStatus === 'Fully Paid');

    return {
      departingThisWeek: thisWeek.length,
      unassignedDrivers: unassigned.length,
      pendingPayments: pendingPayment.length,
      readyToGo: ready.length
    };
  }, [filteredSafaris]);

  const handleSafariClick = (safari) => {
    setSelectedSafari(safari);
    setIsDrawerOpen(true);
  };

  return (
    <PageWrapper 
      title="Upcoming Safaris" 
      subtitle="All confirmed expeditions on the horizon"
      actions={
        <div className="flex items-center gap-2 bg-white dark:bg-dark-card p-1 rounded-button shadow-sm border border-gray-100 dark:border-dark-border">
          <button 
            onClick={() => setViewMode('timeline')}
            className={`p-2 rounded-button transition-all ${viewMode === 'timeline' ? 'bg-safari-gold text-white shadow-md' : 'text-gray-400 hover:text-safari-gold'}`}
            title="Timeline View"
          >
            <List size={18} />
          </button>
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-button transition-all ${viewMode === 'grid' ? 'bg-safari-gold text-white shadow-md' : 'text-gray-400 hover:text-safari-gold'}`}
            title="Grid View"
          >
            <LayoutGrid size={18} />
          </button>
          <button 
            onClick={() => setViewMode('calendar')}
            className={`p-2 rounded-button transition-all ${viewMode === 'calendar' ? 'bg-safari-gold text-white shadow-md' : 'text-gray-400 hover:text-safari-gold'}`}
            title="Calendar View"
          >
            <Calendar size={18} />
          </button>
        </div>
      }
    >
      {/* Time Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar bg-white dark:bg-dark-card p-1.5 rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm">
        {['All Upcoming', 'This Week', 'This Month', 'Next 3 Months'].map(tab => (
          <button
            key={tab}
            onClick={() => setTimeFilter(tab)}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              timeFilter === tab 
                ? 'bg-safari-primary text-white shadow-lg' 
                : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-surface'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <button 
          onClick={() => { setTimeFilter('This Week'); setStatusFilter('All'); }}
          className="p-4 bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm flex items-center gap-3 hover:border-safari-gold transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-full bg-safari-gold/10 flex items-center justify-center text-safari-gold shrink-0">
            <Clock size={18} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-tighter">This Week</p>
            <p className="text-lg font-playfair font-bold text-safari-primary dark:text-dark-text">{stats.departingThisWeek}</p>
          </div>
        </button>
        <button 
          onClick={() => { setStatusFilter('All'); setTypeFilter('All'); /* Logic to filter unassigned could be added */ }}
          className="p-4 bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm flex items-center gap-3 hover:border-safari-gold transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
            <UserX size={18} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-tighter">No Driver</p>
            <p className="text-lg font-playfair font-bold text-safari-primary dark:text-dark-text">{stats.unassignedDrivers}</p>
          </div>
        </button>
        <button 
          className="p-4 bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm flex items-center gap-3 hover:border-safari-gold transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
            <CreditCard size={18} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-tighter">Pending Pay</p>
            <p className="text-lg font-playfair font-bold text-safari-primary dark:text-dark-text">{stats.pendingPayments}</p>
          </div>
        </button>
        <button 
          className="p-4 bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm flex items-center gap-3 hover:border-safari-gold transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-full bg-safari-success/10 flex items-center justify-center text-safari-success shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-tighter">Ready to Go</p>
            <p className="text-lg font-playfair font-bold text-safari-primary dark:text-dark-text">{stats.readyToGo}</p>
          </div>
        </button>
      </div>

      {/* Main Content */}
      <div className="mb-10">
        {viewMode === 'timeline' && (
          <SafariTimeline 
            safaris={filteredSafaris} 
            drivers={state.drivers} 
            vehicles={state.vehicles}
            onSafariClick={handleSafariClick}
          />
        )}
        
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSafaris.length > 0 ? (
              filteredSafaris.map(s => (
                <SafariCard 
                  key={s.id} 
                  safari={s} 
                  drivers={state.drivers} 
                  vehicles={state.vehicles} 
                  onClick={() => handleSafariClick(s)} 
                />
              ))
            ) : (
              <div className="col-span-full py-20 text-center text-gray-400">
                <p className="text-lg font-playfair font-bold">No safaris matching your filters.</p>
              </div>
            )}
          </div>
        )}

        {viewMode === 'calendar' && (
          <SafariCalendar 
            safaris={filteredSafaris} 
            onSafariClick={handleSafariClick} 
          />
        )}
      </div>

      {/* Detail Slide-over */}
      <SafariDetailDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        safari={selectedSafari}
        drivers={state.drivers}
        vehicles={state.vehicles}
      />
    </PageWrapper>
  );
};
