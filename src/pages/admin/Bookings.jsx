import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload,
  Eye, 
  Trash2, 
  MoreVertical,
  Calendar,
  Clock,
  User,
  MapPin,
  Banknote,
  Printer,
  Share2
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { BookingDetailModal } from '../../components/bookings/BookingDetailModal';
import { ImportModal } from '../../components/bookings/ImportModal';
import { PrintBooking } from '../../components/bookings/PrintBooking';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { validateString, validateEmail, validateNumber } from '../../utils/validation';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

export const Bookings = () => {
  const { state, dispatch } = useData();
  const { user } = useAuth();
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [bookingTypeFilter, setBookingTypeFilter] = useState('All');
  const [formBookingType, setFormBookingType] = useState('Safari');
  const [migrationDone, setMigrationDone] = useState(false);
  const [selectedPorters, setSelectedPorters] = useState([]);

  const togglePorter = (porterId) => {
    setSelectedPorters(prev =>
      prev.includes(porterId) ? prev.filter(id => id !== porterId) : [...prev, porterId]
    );
  };

  // One-time fix for 2026 Safari bookings
  useEffect(() => {
    if (!migrationDone && state.bookings.length > 0) {
      const bookingsToUpdate = state.bookings.filter(b => 
        (b.type || 'Safari') === 'Safari' && 
        b.status === 'Pending' && 
        b.date && b.date.includes('2026')
      );

      if (bookingsToUpdate.length > 0) {
        bookingsToUpdate.forEach(b => {
          dispatch({
            type: 'UPDATE_BOOKING',
            payload: { id: b.id, status: 'Confirmed' }
          });
        });
        toast.success(`System: Migrated ${bookingsToUpdate.length} 2026 Safari bookings to Confirmed status.`, {
          icon: '🔄',
          duration: 4000
        });
      }
      setMigrationDone(true);
    }
  }, [state.bookings, migrationDone, dispatch]);
  
  // Handle automatic modal opening for "New Booking" route
  useEffect(() => {
    if (location.pathname === '/reservations/new-booking') {
      setIsModalOpen(true);
    }
  }, [location.pathname]);

  const isAdmin = user?.role === 'admin';

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending': return <Badge variant="gold">Pending</Badge>;
      case 'Confirmed': return <Badge variant="info">Confirmed</Badge>;
      case 'On Trip': return <Badge variant="success">On Trip</Badge>;
      case 'Completed': return <Badge>Completed</Badge>;
      case 'Cancelled': return <Badge variant="danger">Cancelled</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getPaymentBadge = (status) => {
    switch (status) {
      case 'Unpaid': return <Badge variant="danger">Unpaid</Badge>;
      case 'Partially Paid': return <Badge variant="gold">Partial</Badge>;
      case 'Fully Paid': return <Badge variant="success">Paid</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to permanently delete this booking? This action cannot be undone.')) {
      dispatch({ type: 'DELETE_BOOKING', payload: id });
      toast.success('Booking deleted');
    }
  };

  const handlePrint = (e, booking) => {
    e.stopPropagation();
    setSelectedBooking(booking);
    setIsPrinting(true);
    // Give state time to update before triggering print dialog
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 500);
  };

  const handleView = (e, booking) => {
    e.stopPropagation();
    setSelectedBooking(booking);
    setIsDetailModalOpen(true);
  };

  const filteredBookings = state.bookings.filter(b => {
    // If on "My Bookings" page, only show bookings created by the current user
    if (location.pathname === '/reservations/my-bookings' && b.createdById !== user?.username) {
      return false;
    }

    const nameMatch = b.clientName?.toLowerCase().includes(search.toLowerCase()) || false;
    const idMatch = b.id?.toLowerCase().includes(search.toLowerCase()) || false;
    const matchesSearch = nameMatch || idMatch;
    const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
    const matchesType = bookingTypeFilter === 'All' || (b.type || 'Safari') === bookingTypeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleCreateBooking = (e) => {
    e.preventDefault();
    try {
      const formData = new FormData(e.target);
      const bookingData = Object.fromEntries(formData);
      
      const clientName = validateString(bookingData.clientName, 150, 'Client Full Name');
      const clientEmail = validateEmail(bookingData.clientEmail);
      
      const totalAmountRaw = bookingData.totalAmount || 0;
      const paidAmountRaw = bookingData.paidAmount || 0;
      
      const totalAmount = validateNumber(totalAmountRaw, 0, 'Total Amount', false);
      const paidAmount = validateNumber(paidAmountRaw, 0, 'Initial Amount Paid', false);
      
      const adults = validateNumber(bookingData.adults, 1, 'Adults');
      const children = validateNumber(bookingData.children || 0, 0, 'Children', false);

      const destinations = validateString(bookingData.destinations || '', 500, 'Destinations', false);
      const durationText = validateString(bookingData.durationText || '', 100, 'Duration', false);
      
      let location = '';
      if (formBookingType === 'Safari') {
        location = validateString(bookingData.location || '', 300, 'Location/Destination', false);
      } else {
        const fromLoc = validateString(bookingData.pickupLocation || '', 150, 'From Location', false);
        const toLoc = validateString(bookingData.dropoffLocation || '', 150, 'To Destination', false);
        location = `${fromLoc} to ${toLoc}`;
      }
      
      const date = validateString(bookingData.date, 30, 'Date');
      const timeOfPickup = validateString(bookingData.timeOfPickup || '', 20, 'Time of Pickup', false);
      
      const packageId = bookingData.packageId || null;
      const packageName = validateString(bookingData.packageName || '', 150, 'Package Name', false);
      const driverId = bookingData.driverId || null;
      const vehicleId = bookingData.vehicleId || null;

      const nextId = `TRP-2025-${(state.bookings.length + 1).toString().padStart(4, '0')}`;
      
      let paymentStatus = 'Unpaid';
      if (paidAmount >= totalAmount && totalAmount > 0) paymentStatus = 'Fully Paid';
      else if (paidAmount > 0) paymentStatus = 'Partially Paid';
      else if (paidAmount >= totalAmount && totalAmount === 0) paymentStatus = 'Fully Paid';

      const newBooking = {
        clientName, clientEmail, totalAmount, paidAmount,
        destinations, durationText, location, date, timeOfPickup,
        packageId, packageName, driverId, vehicleId,
        porterIds: formBookingType !== 'Safari' ? selectedPorters : [],
        id: nextId,
        type: formBookingType,
        pax: { adults, children, infants: 0 },
        status: 'Pending',
        paymentStatus,
        createdById: user.username,
        paymentLog: paidAmount > 0 ? [{
          amount: paidAmount,
          method: 'Initial Deposit',
          date: new Date().toISOString(),
          recordedBy: user.username || 'System'
        }] : []
      };

      dispatch({ type: 'ADD_BOOKING', payload: newBooking });
      
      if (!isAdmin) {
         dispatch({ 
            type: 'ADD_NOTIFICATION', 
            payload: {
              title: "Booking Approval Required",
              message: `Agent ${user.username} submitted a new booking [${nextId}] for ${clientName}.`,
              date: new Date().toISOString(),
              read: false,
              type: 'WARNING',
              targetRole: 'admin'
            }
         });
      }

      toast.success(`Booking ${nextId} created!`);
      setIsModalOpen(false);
      setFormBookingType('Safari');
      setSelectedPorters([]);
    } catch(err) {
      toast.error(err.message);
    }
  };

  return (
    <PageWrapper 
      title="Bookings Engine" 
      subtitle={`Manage and track all tour reservations (${state.bookings.length})`}
      actions={
        <div className="flex gap-2 mb-4 md:mb-0">
          {(isAdmin || user?.role === 'agent') && (
            <>
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => setIsImportModalOpen(true)}
              >
                <Upload size={18} /> Bulk Import
              </Button>
              <Button variant="outline" className="gap-2">
                <Download size={18} /> Export CSV
              </Button>
            </>
          )}
          <Button 
             onClick={() => {
                setFormBookingType(bookingTypeFilter === 'All' ? 'Safari' : bookingTypeFilter);
                setIsModalOpen(true);
             }} 
             className="gap-2 shadow-lg shadow-safari-gold/20"
          >
            <Plus size={18} /> 
            {bookingTypeFilter === 'All' ? 'New Reservation' : `New ${bookingTypeFilter}`}
          </Button>
        </div>
      }
    >
      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar bg-white dark:bg-dark-card p-2 rounded-card border border-gray-100 dark:border-dark-border shadow-sm">
        {['All', 'Safari', 'City Tour', 'Drop Off', 'Pick Up'].map(type => (
          <button
            key={type}
            onClick={() => setBookingTypeFilter(type)}
            className={`px-4 py-2 rounded-button text-sm font-bold transition-all whitespace-nowrap ${
              bookingTypeFilter === type 
                ? 'bg-safari-gold text-white shadow-md' 
                : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-surface'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 bg-white dark:bg-dark-card p-4 rounded-card shadow-sm border border-gray-100 dark:border-dark-border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by client or booking ID..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-dark-bg border-none rounded-button text-sm outline-none focus:ring-2 focus:ring-safari-gold/20"
          />
        </div>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-gray-50 dark:bg-dark-bg border-none rounded-button px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-safari-gold/20"
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Confirmed">Confirmed</option>
          <option value="On Trip">On Trip</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-dark-bg border-b border-gray-100 dark:border-dark-border">
                <th className="px-6 py-4 font-playfair font-bold text-safari-primary dark:text-dark-text text-sm">Booking ID</th>
                <th className="px-6 py-4 font-playfair font-bold text-safari-primary dark:text-dark-text text-sm">Client Name</th>
                <th className="px-6 py-4 font-playfair font-bold text-safari-primary dark:text-dark-text text-sm">Details / Location</th>
                <th className="px-6 py-4 font-playfair font-bold text-safari-primary dark:text-dark-text text-sm">Trip Date</th>
                <th className="px-6 py-4 font-playfair font-bold text-safari-primary dark:text-dark-text text-sm">Driver</th>
                <th className="px-6 py-4 font-playfair font-bold text-safari-primary dark:text-dark-text text-sm">Status</th>
                {isAdmin && <th className="px-6 py-4 font-playfair font-bold text-safari-primary dark:text-dark-text text-sm">Payment</th>}
                <th className="px-6 py-4 font-playfair font-bold text-safari-primary dark:text-dark-text text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-dark-border">
              {filteredBookings.map((booking) => (
                <tr 
                  key={booking.id} 
                  className="hover:bg-safari-gold/5 transition-colors group cursor-pointer"
                  onClick={(e) => handleView(e, booking)}
                >
                  <td className="px-6 py-4 font-jetbrains font-bold text-xs text-safari-gold">{booking.id}</td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-safari-primary dark:text-dark-text text-sm">{booking.clientName}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-tighter">{booking.clientEmail}</p>
                  </td>
                  <td className="px-6 py-4">
                    { (!booking.type || booking.type === 'Safari') ? (
                      <span className="text-sm">{booking.packageName || state.packages.find(p => p.id === booking.packageId)?.name || 'Custom Package'}</span>
                    ) : (
                      <div>
                          <p className="text-sm font-bold text-safari-primary dark:text-dark-text">{booking.location}</p>
                          <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-1"><Clock size={10} /> Pickup: {booking.timeOfPickup}</p>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar size={14} className="text-gray-400" />
                      {booking.date ? format(parseISO(booking.date), 'MMM dd, yyyy') : 'No Date'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {booking.driverId ? (
                      <span className="text-sm font-medium">{state.drivers.find(d => d.id === booking.driverId)?.name}</span>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(booking.status)}</td>
                  {isAdmin && <td className="px-6 py-4">{getPaymentBadge(booking.paymentStatus)}</td>}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => handlePrint(e, booking)}
                        className="h-8 w-8 hover:text-safari-gold transition-colors"
                      >
                        <Printer size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => handleView(e, booking)}
                        className="h-8 w-8 hover:text-safari-gold transition-colors"
                      >
                        <Eye size={16} />
                      </Button>
                      {isAdmin && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => handleDelete(e, booking.id)} 
                          className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredBookings.length === 0 && (
            <div className="py-20 text-center">
               <p className="text-gray-400 font-dm-sans">No bookings found matching your filters.</p>
            </div>
          )}
        </div>
      </Card>

      {/* Booking Detail Modal */}
      <BookingDetailModal 
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        booking={selectedBooking}
      />

      {/* Invisible Print View Holder */}
      {isPrinting && <PrintBooking booking={selectedBooking} state={state} />}

      {/* Bulk Import Modal */}
      <ImportModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      {/* New Reservation Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Reservation">
        <form onSubmit={handleCreateBooking} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Input label="Client Full Name" name="clientName" placeholder="e.g. Alice Johnson" required />
             <Input label="Client Email" name="clientEmail" type="email" placeholder="alice@example.com" required />
          </div>
          
          <div className="space-y-1.5 border-t border-b border-gray-100 dark:border-dark-border py-4">
            <label className="block text-sm font-medium text-safari-primary dark:text-dark-text font-dm-sans mb-2">Service Type</label>
            <div className="flex gap-4">
              {['Safari', 'City Tour', 'Drop Off', 'Pick Up'].map(type => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="type" 
                    value={type} 
                    checked={formBookingType === type}
                    onChange={(e) => setFormBookingType(e.target.value)}
                    className="text-safari-gold focus:ring-safari-gold"
                  />
                  <span className="text-sm">{type}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {formBookingType === 'Safari' ? (
               <Input label="Tour Package" name="packageName" placeholder="e.g. 15 Days Kenya Safari" required />
             ) : (
               <div className="grid grid-cols-2 gap-2">
                 <Input label="From (Pickup)" name="pickupLocation" placeholder="e.g. JKIA" required />
                 <Input label="To (Dropoff)" name="dropoffLocation" placeholder="e.g. Hilton Hotel" required />
               </div>
             )}
             
             <Input label="Date" name="date" type="date" required />
          </div>
          
          {formBookingType === 'Safari' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                 <Input label="Destinations (Parks/Reserves)" name="destinations" placeholder="e.g. Masai Mara, Amboseli" />
                 <Input label="Duration (Days/Nights)" name="durationText" placeholder="e.g. 7 Days, 6 Nights" />
              </div>
              <div className="grid grid-cols-1 gap-4 mt-4">
                  <div className="space-y-1.5">
                   <label className="block text-sm font-medium text-safari-primary dark:text-dark-text font-dm-sans">Allocate Driver</label>
                   <select name="driverId" className="w-full px-4 py-2.5 bg-white dark:bg-dark-surface border-2 border-gray-100 dark:border-dark-border rounded-input outline-none focus:border-safari-gold focus:ring-4 focus:ring-safari-gold/5 transition-all text-sm">
                     <option value="">Auto-Assign Later</option>
                     {state.drivers.filter(d => d.status === 'Available' && d.role === 'safari_driver').map(d => (
                       <option key={d.id} value={d.id}>{d.name} ({d.trips} trips)</option>
                     ))}
                   </select>
                 </div>
              </div>
            </>
          )}

          {formBookingType !== 'Safari' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Input label="Time of Pickup" name="timeOfPickup" type="time" required />
                 <div className="space-y-1.5">
                   <label className="block text-sm font-medium text-safari-primary dark:text-dark-text font-dm-sans">Allocate Driver</label>
                   <select name="driverId" className="w-full px-4 py-2.5 bg-white dark:bg-dark-surface border-2 border-gray-100 dark:border-dark-border rounded-input outline-none focus:border-safari-gold focus:ring-4 focus:ring-safari-gold/5 transition-all text-sm">
                     <option value="">Auto-Assign Later</option>
                     {state.drivers.filter(d => d.status === 'Available').map(d => (
                       <option key={d.id} value={d.id}>{d.name} ({d.trips} trips)</option>
                     ))}
                   </select>
                 </div>
              </div>

              {/* Porters Section */}
              {state.porters?.filter(p => p.status === 'Active').length > 0 && (
                <div className="space-y-3 border border-gray-100 dark:border-dark-border rounded-2xl p-4 bg-gray-50/50 dark:bg-white/[0.02]">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-bold text-safari-primary dark:text-dark-text font-dm-sans">
                      Assign Porters
                    </label>
                    {selectedPorters.length > 0 && (
                      <span className="text-[10px] font-black uppercase tracking-widest text-safari-gold bg-safari-gold/10 px-2 py-0.5 rounded-full">
                        {selectedPorters.length} Selected
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {state.porters.filter(p => p.status === 'Active').map(porter => {
                      const isSelected = selectedPorters.includes(porter.id);
                      return (
                        <button
                          key={porter.id}
                          type="button"
                          onClick={() => togglePorter(porter.id)}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                            isSelected
                              ? 'border-safari-gold bg-safari-gold/5 text-safari-primary dark:text-white'
                              : 'border-gray-100 dark:border-dark-border text-gray-500 hover:border-safari-gold/40'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 transition-all ${
                            isSelected ? 'bg-safari-gold text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-400'
                          }`}>
                            {porter.name?.[0] || 'P'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate">{porter.name}</p>
                            <p className="text-[9px] uppercase tracking-widest text-gray-400 font-medium">{porter.totalTrips || 0} missions</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
          <div className="grid grid-cols-3 gap-4">
             <Input label="Adults" name="adults" type="number" min="1" defaultValue="1" required />
             <Input label="Children" name="children" type="number" min="0" defaultValue="0" />
             <div className="space-y-1.5">
               <label className="block text-sm font-medium text-safari-primary dark:text-dark-text font-dm-sans">Vehicle Pref.</label>
               <select name="vehicleId" className="w-full px-4 py-2.5 bg-white dark:bg-dark-surface border-2 border-gray-100 dark:border-dark-border rounded-input outline-none focus:border-safari-gold focus:ring-4 focus:ring-safari-gold/5 transition-all text-sm">
                 <option value="">Auto-Assign</option>
                 {state.vehicles.filter(v => v.status === 'Active').map(v => (
                   <option key={v.id} value={v.id}>{v.plate} - {v.name}</option>
                 ))}
               </select>
             </div>
          </div>
          
          {isAdmin && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 dark:border-dark-border pt-4">
               <Input label={`Total Amount (${formBookingType === 'Safari' ? 'USD' : 'KES'})`} name="totalAmount" type="number" min="0" placeholder="e.g. 150000" required />
               <Input label={`Initial Amount Paid (${formBookingType === 'Safari' ? 'USD' : 'KES'})`} name="paidAmount" type="number" min="0" defaultValue="0" required />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-dark-border">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Complete Reservation</Button>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  );
};
