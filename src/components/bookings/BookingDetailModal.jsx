import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  CreditCard,
  Plus,
  Compass,
  Trash2,
  Car,
  Home,
  Save,
  Printer,
  ChevronRight,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  History,
  DollarSign
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

export const BookingDetailModal = ({ isOpen, onClose, booking }) => {
  const { state, dispatch } = useData();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'assignment', 'payments'
  
  const [formData, setFormData] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentRef, setPaymentRef] = useState('');

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (booking) {
      setFormData({
        ...booking,
        pax: booking.pax || { adults: 1, children: 0, infants: 0 },
        paymentLog: booking.paymentLog || []
      });
      setIsEditing(false);
      setActiveTab('details');
    }
  }, [booking, isOpen]);

  if (!isOpen || !formData) return null;

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await dispatch({
        type: 'UPDATE_BOOKING',
        payload: { ...formData }
      });
      
      // If driver is assigned, update driver status (logic can be expanded)
      if (formData.driverId && formData.driverId !== booking.driverId) {
        const driver = state.drivers.find(d => d.id === formData.driverId);
        if (driver) {
          await dispatch({
            type: 'UPDATE_DRIVER',
            payload: { id: driver.id, status: 'On Trip' }
          });
        }
      }

      toast.success('Booking updated successfully');
      setIsEditing(false);
    } catch (err) {
      toast.error('Failed to update booking');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!paymentAmount || isNaN(paymentAmount)) {
      toast.error('Please enter a valid amount');
      return;
    }

    const amount = parseFloat(paymentAmount);
    const newPaidAmount = (formData.paidAmount || 0) + amount;
    const totalAmount = formData.totalAmount || 0;

    let newStatus = 'Unpaid';
    if (newPaidAmount >= totalAmount && totalAmount > 0) newStatus = 'Fully Paid';
    else if (newPaidAmount > 0) newStatus = 'Partially Paid';

    const paymentEntry = {
      amount,
      method: paymentMethod,
      reference: paymentRef,
      date: new Date().toISOString(),
      recordedBy: user.username || user.email
    };

    const updatedLog = [...(formData.paymentLog || []), paymentEntry];

    try {
      await dispatch({
        type: 'UPDATE_BOOKING',
        payload: {
          id: formData.id,
          paidAmount: newPaidAmount,
          paymentStatus: newStatus,
          paymentLog: updatedLog
        }
      });

      setFormData(prev => ({
        ...prev,
        paidAmount: newPaidAmount,
        paymentStatus: newStatus,
        paymentLog: updatedLog
      }));

      setPaymentAmount('');
      setPaymentRef('');
      toast.success('Payment recorded successfully');
    } catch (err) {
      toast.error('Failed to record payment');
    }
  };

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

  const balance = (formData.totalAmount || 0) - (formData.paidAmount || 0);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Booking Details: ${formData.id}`}
      maxWidth="max-w-4xl"
    >
      <div className="flex flex-col md:flex-row gap-6 h-full min-h-[500px]">
        {/* Navigation Sidebar */}
        <div className="w-full md:w-64 flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'details' ? 'bg-safari-gold text-white shadow-lg shadow-safari-gold/20' : 'hover:bg-gray-100 dark:hover:bg-dark-card'}`}
          >
            <Compass size={18} />
            <span className="font-bold text-sm">Trip Info</span>
          </button>
          <button 
            onClick={() => setActiveTab('assignment')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'assignment' ? 'bg-safari-gold text-white shadow-lg shadow-safari-gold/20' : 'hover:bg-gray-100 dark:hover:bg-dark-card'}`}
          >
            <Car size={18} />
            <span className="font-bold text-sm">Fleet Allocation</span>
          </button>
          {isAdmin && (
            <button 
              onClick={() => setActiveTab('payments')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'payments' ? 'bg-safari-gold text-white shadow-lg shadow-safari-gold/20' : 'hover:bg-gray-100 dark:hover:bg-dark-card'}`}
            >
              <CreditCard size={18} />
              <span className="font-bold text-sm">Payments Hub</span>
            </button>
          )}
          
          <div className="mt-auto pt-6 border-t border-gray-100 dark:border-dark-border">
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-dark-bg/50 border border-dashed border-gray-200 dark:border-dark-border">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-2">Booking Status</p>
              <div className="flex items-center justify-between">
                {getStatusBadge(formData.status)}
                {isAdmin && getPaymentBadge(formData.paymentStatus)}
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 flex flex-col">
          {activeTab === 'details' && (
            <form onSubmit={handleUpdate} className="space-y-6 flex-1 overflow-y-auto pr-2 no-scrollbar">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-playfair font-bold text-safari-primary dark:text-dark-text">Reservation Overview</h3>
                <button 
                  type="button" 
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-xs font-bold text-safari-gold hover:underline"
                >
                  {isEditing ? 'Cancel Edit' : 'Edit Details'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  label="Client Name" 
                  value={formData.clientName} 
                  disabled={!isEditing}
                  onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                />
                <Input 
                  label="Client Email" 
                  value={formData.clientEmail} 
                  disabled={!isEditing}
                  onChange={(e) => setFormData({...formData, clientEmail: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  label="Trip Date" 
                  type="date" 
                  value={formData.date} 
                  disabled={!isEditing}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
                <Input 
                  label="Time of Pickup" 
                  type="time" 
                  value={formData.timeOfPickup || ''} 
                  disabled={!isEditing}
                  onChange={(e) => setFormData({...formData, timeOfPickup: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  label="Location / Destination" 
                  value={formData.location} 
                  disabled={!isEditing}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-safari-primary dark:text-dark-text">Status</label>
                  <select 
                    disabled={!isEditing}
                    className="w-full h-[46px] rounded-input border-2 border-gray-100 dark:border-dark-border bg-white dark:bg-dark-surface px-4 text-sm outline-none focus:border-safari-gold disabled:opacity-60"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="On Trip">On Trip</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input 
                  label="Adults" 
                  type="number" 
                  value={formData.pax.adults} 
                  disabled={!isEditing}
                  onChange={(e) => setFormData({...formData, pax: {...formData.pax, adults: parseInt(e.target.value)}})}
                />
                <Input 
                  label="Children" 
                  type="number" 
                  value={formData.pax.children} 
                  disabled={!isEditing}
                  onChange={(e) => setFormData({...formData, pax: {...formData.pax, children: parseInt(e.target.value)}})}
                />
                <Input 
                  label="Infants" 
                  type="number" 
                  value={formData.pax.infants} 
                  disabled={!isEditing}
                  onChange={(e) => setFormData({...formData, pax: {...formData.pax, infants: parseInt(e.target.value)}})}
                />
              </div>

              {isEditing && (
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={loading} className="gap-2">
                    <Save size={18} />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </form>
          )}

          {activeTab === 'assignment' && (
            <div className="space-y-8 flex-1 overflow-y-auto pr-2">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-safari-gold font-bold">
                  <User size={18} />
                  <h3 className="text-lg">Driver Assignment</h3>
                </div>
                
                <div className="bg-gray-50 dark:bg-dark-bg/30 p-6 rounded-2xl border border-gray-100 dark:border-dark-border">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 block">Available Personnel</label>
                  <select 
                    className="w-full h-12 rounded-xl border-2 border-transparent bg-white dark:bg-dark-surface px-4 text-sm outline-none focus:border-safari-gold shadow-sm transition-all"
                    value={formData.driverId || ''}
                    onChange={async (e) => {
                      const newId = e.target.value;
                      setLoading(true);
                      try {
                        await dispatch({
                          type: 'UPDATE_BOOKING',
                          payload: { id: formData.id, driverId: newId }
                        });
                        setFormData({...formData, driverId: newId});
                        toast.success('Driver assigned successfully');
                      } catch (err) {
                        toast.error('Assignment failed');
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    <option value="">Unassigned</option>
                    {state.drivers.filter(d => d.status === 'Available' || d.id === formData.driverId).map(driver => (
                      <option key={driver.id} value={driver.id}>{driver.name} ({driver.status})</option>
                    ))}
                  </select>
                  
                  {formData.driverId && (
                    <div className="mt-4 flex items-center gap-3 p-3 bg-safari-gold/5 rounded-lg border border-safari-gold/10">
                      <div className="w-10 h-10 rounded-full bg-safari-gold/20 flex items-center justify-center text-safari-gold">
                        <User size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-safari-primary dark:text-dark-text">
                          {state.drivers.find(d => d.id === formData.driverId)?.name}
                        </p>
                        <p className="text-[10px] text-safari-gold font-bold uppercase tracking-tighter">Current Lead Driver</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-safari-gold font-bold">
                  <Car size={18} />
                  <h3 className="text-lg">Vehicle Allocation</h3>
                </div>
                
                <div className="bg-gray-50 dark:bg-dark-bg/30 p-6 rounded-2xl border border-gray-100 dark:border-dark-border">
                   <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 block">Fleet Inventory</label>
                   <select 
                    className="w-full h-12 rounded-xl border-2 border-transparent bg-white dark:bg-dark-surface px-4 text-sm outline-none focus:border-safari-gold shadow-sm transition-all"
                    value={formData.vehicleId || ''}
                    onChange={async (e) => {
                      const newId = e.target.value;
                      setLoading(true);
                      try {
                        await dispatch({
                          type: 'UPDATE_BOOKING',
                          payload: { id: formData.id, vehicleId: newId }
                        });
                        setFormData({...formData, vehicleId: newId});
                        toast.success('Vehicle allocated successfully');
                      } catch (err) {
                        toast.error('Allocation failed');
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    <option value="">Auto-Assign Later</option>
                    {state.vehicles.filter(v => v.status === 'Active' || v.id === formData.vehicleId).map(v => (
                      <option key={v.id} value={v.id}>{v.plate} - {v.name} ({v.type})</option>
                    ))}
                  </select>

                  {formData.vehicleId && (
                    <div className="mt-4 flex items-center gap-3 p-3 bg-safari-gold/5 rounded-lg border border-safari-gold/10">
                      <div className="w-10 h-10 rounded-full bg-safari-gold/20 flex items-center justify-center text-safari-gold">
                        <Car size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-safari-primary dark:text-dark-text">
                          {state.vehicles.find(v => v.id === formData.vehicleId)?.name}
                        </p>
                        <p className="text-[10px] text-safari-gold font-bold uppercase tracking-tighter">Assigned Plate: {state.vehicles.find(v => v.id === formData.vehicleId)?.plate}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-6 flex-1 overflow-y-auto pr-2 no-scrollbar">
              {/* Financial Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-safari-primary text-white rounded-2xl shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <DollarSign size={16} className="text-safari-gold" />
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Total</span>
                  </div>
                  <p className="text-xl font-jetbrains font-bold">${formData.totalAmount?.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp size={16} className="text-green-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Paid</span>
                  </div>
                  <p className="text-xl font-jetbrains font-bold text-green-500">${formData.paidAmount?.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingDown size={16} className={` ${balance > 0 ? 'text-red-500' : 'text-safari-gold'}`} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Balance</span>
                  </div>
                  <p className={`text-xl font-jetbrains font-bold ${balance > 0 ? 'text-red-500' : 'text-safari-gold'}`}>
                    ${balance.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Record Payment */}
              <div className="bg-gray-50 dark:bg-dark-bg/30 p-6 rounded-2xl border border-gray-100 dark:border-dark-border">
                <h4 className="text-sm font-bold flex items-center gap-2 mb-4">
                  <Plus size={16} className="text-safari-gold" />
                  Record New Transaction
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input 
                    placeholder="Amount (USD)" 
                    type="number" 
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                  <select 
                    className="h-[46px] rounded-input border-2 border-gray-100 dark:border-dark-border bg-white dark:bg-dark-surface px-4 text-sm outline-none focus:border-safari-gold shadow-sm"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="M-Pesa">M-Pesa</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                  <Button onClick={handleRecordPayment} className="h-[46px] w-full">Record</Button>
                </div>
                <div className="mt-3">
                  <Input 
                    placeholder="Payment Reference (e.g. Transaction ID, Receipt #)" 
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                  />
                </div>
              </div>

              {/* Payment History */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <History size={16} className="text-safari-gold" />
                  Transaction Ledger
                </h4>
                <div className="space-y-2">
                  {(!formData.paymentLog || formData.paymentLog.length === 0) ? (
                    <div className="text-center py-8 bg-gray-50 dark:bg-dark-bg/30 rounded-2xl border border-dashed border-gray-300 dark:border-dark-border">
                      <p className="text-sm text-gray-400 font-dm-sans">No payment history recorded yet</p>
                    </div>
                  ) : (
                    formData.paymentLog.slice().reverse().map((log, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 text-xs font-bold font-jetbrains">
                             +
                          </div>
                          <div>
                            <p className="text-sm font-bold text-safari-primary dark:text-dark-text">${log.amount?.toLocaleString()}</p>
                            <p className="text-[10px] text-gray-500 uppercase font-bold">{log.method} • {log.reference || 'No Reference'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-gray-500 font-bold">{format(parseISO(log.date), 'MMM dd, yyyy HH:mm')}</p>
                          <p className="text-[10px] text-safari-gold font-bold italic">by {log.recordedBy}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
