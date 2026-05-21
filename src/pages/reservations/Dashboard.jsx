import React from 'react';
import { 
  PlusCircle, 
  Briefcase, 
  CalendarDays, 
  MapPin, 
  Activity, 
  Clock,
  ExternalLink,
  ShieldCheck,
  Upload,
  MessageSquare
} from 'lucide-react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { StatCard } from '../../components/shared/StatCard';
import { Card, CardHeader, CardContent, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';

export const ReservationsDashboard = () => {
  const { state } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();

  // 🛡️ Fix: Use user.username instead of hardcoded 'agent'
  const myBookings = state.bookings.filter(b => b.createdById === user?.username);
  const recentMyBookings = [...myBookings].reverse().slice(0, 5);
  
  // 🌍 Global visibility: "Already running bookings for the company"
  const activeTrips = state.bookings.filter(b => b.status === 'On Trip');

  return (
    <PageWrapper 
      title="Reservations Command" 
      subtitle={`Welcome, ${user?.username?.split('@')[0]}. Managing ${myBookings.length} active records.`}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="My Bookings" 
          value={myBookings.length} 
          icon={Briefcase} 
          change={2.5}
        />
        <StatCard 
          title="Total Scheduled" 
          value={state.bookings.length} 
          icon={CalendarDays} 
        />
        <StatCard 
          title="Live Trips" 
          value={activeTrips.length} 
          icon={Activity} 
          variant="success"
        />
        <StatCard 
          title="Unpaid Bookings" 
          value={myBookings.filter(b => b.paymentStatus === 'Unpaid').length} 
          icon={Clock} 
          variant="danger"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Quick Operations - Restoring "Removed" features */}
        <Card className="border-l-4 border-l-safari-gold bg-gradient-to-br from-safari-gold/5 to-transparent shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-playfair flex items-center gap-2">
               <Activity className="text-safari-gold" size={20} /> Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-auto py-4 flex flex-col gap-2 font-bold uppercase text-[10px] tracking-widest hover:border-safari-gold hover:text-safari-gold transition-all"
                onClick={() => navigate('/reservations/new-booking')}
              >
                <PlusCircle size={18} /> New Booking
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-auto py-4 flex flex-col gap-2 font-bold uppercase text-[10px] tracking-widest hover:border-safari-gold hover:text-safari-gold transition-all"
                onClick={() => navigate('/reservations/new-booking')}
              >
                <Upload size={18} /> Bulk Import
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-auto py-4 flex flex-col gap-2 font-bold uppercase text-[10px] tracking-widest hover:border-safari-gold hover:text-safari-gold transition-all"
                onClick={() => navigate('/reservations/live-tracking')}
              >
                <MapPin size={18} /> Live Map
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-auto py-4 flex flex-col gap-2 font-bold uppercase text-[10px] tracking-widest hover:border-safari-gold hover:text-safari-gold transition-all"
                onClick={() => navigate('/reservations/messages')}
              >
                <MessageSquare size={18} /> Fleet Chat
              </Button>
            </div>
            <Button 
              variant="ghost" 
              className="w-full mt-4 text-[10px] font-black uppercase tracking-tighter flex items-center justify-center gap-2"
              onClick={() => window.open('https://eastern-vacations-staff.vercel.app/', '_blank')}
            >
              <ShieldCheck size={14} /> Open Staff Portal <ExternalLink size={12} />
            </Button>
          </CardContent>
        </Card>

        {/* Live Driver Activity - Important for "Human" feel and oversight */}
        <Card className="lg:col-span-2 border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-playfair flex items-center gap-2">
               <Activity className="text-blue-500" size={20} /> Real-time Fleet Status
            </CardTitle>
            <Badge variant="info" className="animate-pulse">Live Feed</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
               {(state.tripUpdates || []).length === 0 ? (
                 <p className="text-sm text-gray-500 text-center py-10">No recent fleet activity reported.</p>
               ) : (
                 state.tripUpdates.slice(0, 5).map((update) => (
                   <div key={update.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-dark-surface border border-gray-100 dark:border-dark-border group hover:border-blue-500/30 transition-colors">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold text-xs">
                            {state.drivers.find(d => d.id === update.driverId)?.name?.[0] || 'D'}
                         </div>
                         <div>
                            <p className="text-sm font-bold text-safari-primary dark:text-dark-text">
                               {state.drivers.find(d => d.id === update.driverId)?.name || 'Driver'}
                            </p>
                            <p className="text-[10px] text-gray-500 flex items-center gap-1">
                               <MapPin size={10} /> {update.locationName || 'Updating...'}
                            </p>
                         </div>
                      </div>
                      <div className="text-right">
                         <Badge variant="outline" className="text-[9px] uppercase font-black">{update.type}</Badge>
                         <p className="text-[10px] text-gray-400 mt-1">
                            {update.timestamp?.seconds ? format(new Date(update.timestamp.seconds * 1000), 'HH:mm') : 'Now'}
                         </p>
                      </div>
                   </div>
                 ))
               )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My Recent Bookings */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-playfair font-bold">My Recent Handled Bookings</CardTitle>
          <Button variant="ghost" size="sm" className="text-safari-gold" onClick={() => navigate('/reservations/my-bookings')}>
            See All <ExternalLink size={14} className="ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 dark:border-dark-border">
                  <th className="pb-4 font-bold text-sm text-gray-400 uppercase tracking-widest">Client</th>
                  <th className="pb-4 font-bold text-sm text-gray-400 uppercase tracking-widest">Date</th>
                  <th className="pb-4 font-bold text-sm text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="pb-4 font-bold text-sm text-gray-400 uppercase tracking-widest text-right">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-dark-border">
                {recentMyBookings.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-gray-500 italic">You haven't recorded any bookings yet.</td>
                  </tr>
                ) : (
                  recentMyBookings.map((booking) => (
                    <tr key={booking.id} className="group hover:bg-safari-gold/5 transition-colors">
                      <td className="py-4">
                        <p className="font-bold text-safari-primary dark:text-dark-text">{booking.clientName}</p>
                        <p className="text-[10px] text-gray-400">{booking.id}</p>
                      </td>
                      <td className="py-4 text-sm">{booking.date ? format(parseISO(booking.date), 'MMM dd, yyyy') : 'N/A'}</td>
                      <td className="py-4">
                        <Badge variant={booking.status === 'Confirmed' ? 'info' : booking.status === 'On Trip' ? 'success' : 'gold'}>
                          {booking.status}
                        </Badge>
                      </td>
                      <td className="py-4 text-right">
                        <Badge variant={booking.paymentStatus === 'Fully Paid' ? 'success' : 'gold'}>
                           {booking.paymentStatus}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </PageWrapper>
  );
};
