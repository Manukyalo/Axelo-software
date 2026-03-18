import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Trash2, 
  MoreVertical,
  Calendar,
  User,
  MapPin,
  Banknote,
  Printer,
  Share2
} from 'lucide-react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

export const Bookings = () => {
  const { state, dispatch } = useData();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

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

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      dispatch({ type: 'DELETE_BOOKING', payload: id });
      toast.success('Booking deleted');
    }
  };

  const filteredBookings = state.bookings.filter(b => {
    const matchesSearch = b.clientName.toLowerCase().includes(search.toLowerCase()) || b.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateBooking = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const bookingData = Object.fromEntries(formData);
    
    // Auto-generate ID: TRP-2025-XXXX
    const nextId = `TRP-2025-${(state.bookings.length + 1).toString().padStart(4, '0')}`;
    
    const newBooking = {
      ...bookingData,
      id: nextId,
      pax: { adults: parseInt(bookingData.adults), children: parseInt(bookingData.children || 0), infants: 0 },
      status: 'Pending',
      paymentStatus: 'Unpaid',
      paidAmount: 0,
      totalAmount: 100000, // Dummy calculation for now
      createdById: user.role
    };

    dispatch({ type: 'ADD_BOOKING', payload: newBooking });
    toast.success(`Booking ${nextId} created!`);
    setIsModalOpen(false);
  };

  return (
    <PageWrapper 
      title="Bookings Engine" 
      subtitle={`Manage and track all tour reservations (${state.bookings.length})`}
      actions={
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="outline" className="gap-2">
              <Download size={18} /> Export CSV
            </Button>
          )}
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus size={18} /> New Booking
          </Button>
        </div>
      }
    >
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 bg-white dark:bg-dark-card p-4 rounded-card shadow-sm border border-gray-100 dark:border-dark-border">
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
                <th className="px-6 py-4 font-playfair font-bold text-safari-primary dark:text-dark-text text-sm">Tour Package</th>
                <th className="px-6 py-4 font-playfair font-bold text-safari-primary dark:text-dark-text text-sm">Trip Date</th>
                <th className="px-6 py-4 font-playfair font-bold text-safari-primary dark:text-dark-text text-sm">Pax</th>
                <th className="px-6 py-4 font-playfair font-bold text-safari-primary dark:text-dark-text text-sm">Status</th>
                <th className="px-6 py-4 font-playfair font-bold text-safari-primary dark:text-dark-text text-sm">Payment</th>
                <th className="px-6 py-4 font-playfair font-bold text-safari-primary dark:text-dark-text text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-dark-border">
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-safari-gold/5 transition-colors group">
                  <td className="px-6 py-4 font-jetbrains font-bold text-xs text-safari-gold">{booking.id}</td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-safari-primary dark:text-dark-text text-sm">{booking.clientName}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-tighter">{booking.clientEmail}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm">{state.packages.find(p => p.id === booking.packageId)?.name || 'Custom Package'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar size={14} className="text-gray-400" />
                      {format(parseISO(booking.date), 'MMM dd, yyyy')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold">{booking.pax.adults + booking.pax.children} Pax</td>
                  <td className="px-6 py-4">{getStatusBadge(booking.status)}</td>
                  <td className="px-6 py-4">{getPaymentBadge(booking.paymentStatus)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-safari-gold">
                        <Printer size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-safari-gold">
                        <Eye size={16} />
                      </Button>
                      {isAdmin && (
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(booking.id)} className="h-8 w-8 text-red-500 hover:bg-red-50">
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* New Booking Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Reservation">
        <form onSubmit={handleCreateBooking} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Input label="Client Full Name" name="clientName" placeholder="e.g. Alice Johnson" required />
             <Input label="Client Email" name="clientEmail" type="email" placeholder="alice@example.com" required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-1.5">
               <label className="block text-sm font-medium text-safari-primary dark:text-dark-text font-dm-sans">Tour Package</label>
               <select name="packageId" className="w-full px-4 py-2.5 bg-white dark:bg-dark-surface border-2 border-gray-100 dark:border-dark-border rounded-input outline-none focus:border-safari-gold focus:ring-4 focus:ring-safari-gold/5 transition-all text-sm" required>
                 {state.packages.map(p => (
                   <option key={p.id} value={p.id}>{p.name}</option>
                 ))}
               </select>
             </div>
             <Input label="Departure Date" name="date" type="date" required />
          </div>
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
          
          <div className="p-4 bg-safari-gold/5 rounded-xl border border-safari-gold/10">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-safari-earthy">Estimated Total:</span>
              <span className="text-xl font-jetbrains font-bold text-safari-gold">KES 0.00</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">* Pricing will be finalized based on selected package and seasonal rates.</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-dark-border">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Complete Reservation</Button>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  );
};
