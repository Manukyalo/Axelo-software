import React from 'react';
import { 
  Calendar, 
  PlusCircle, 
  MapPin, 
  TrendingUp,
  Clock,
  Briefcase
} from 'lucide-react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { StatCard } from '../../components/shared/StatCard';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useData } from '../../contexts/DataContext';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export const ReservationsDashboard = () => {
  const { state } = useData();
  const navigate = useNavigate();

  // My bookings (simulated for the res_agent ID)
  const myBookings = state.bookings.filter(b => b.createdById === 'res_agent');
  const pendingBookings = myBookings.filter(b => b.status === 'Pending');

  return (
    <PageWrapper 
      title="Reservations Command" 
      subtitle="Excellence in travel coordination and client delight."
      actions={
        <Button onClick={() => navigate('/reservations/new-booking')} className="gap-2 shadow-lg shadow-safari-gold/20">
          <PlusCircle size={20} /> Create New Booking
        </Button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard 
          title="My Total Bookings" 
          value={myBookings.length} 
          icon={Briefcase} 
        />
        <StatCard 
          title="Pending My Action" 
          value={pendingBookings.length} 
          icon={Clock} 
        />
        <StatCard 
          title="Conversion Rate" 
          value={88} 
          unit="%" 
          icon={TrendingUp} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           <Card>
             <CardHeader className="flex flex-row items-center justify-between border-none">
               <h3 className="font-bold text-xl text-safari-primary dark:text-dark-text">My Recent Reservations</h3>
               <Button variant="ghost" size="sm" onClick={() => navigate('/reservations/my-bookings')}>View All</Button>
             </CardHeader>
             <CardContent>
                <div className="space-y-4">
                  {myBookings.slice(0, 5).map(booking => (
                    <div key={booking.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-50 dark:border-dark-border hover:bg-safari-gold/5 transition-all group">
                      <div className="flex gap-4 items-center">
                        <div className="w-12 h-12 bg-safari-gold/10 text-safari-gold rounded-full flex items-center justify-center font-bold">
                          {booking.clientName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-bold text-safari-primary dark:text-dark-text group-hover:text-safari-gold transition-colors">{booking.clientName}</p>
                          <p className="text-xs text-gray-500">{state.packages.find(p => p.id === booking.packageId)?.name}</p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <Badge variant={booking.status === 'Confirmed' ? 'info' : 'gold'}>{booking.status}</Badge>
                        <p className="text-[10px] font-jetbrains text-gray-400">{format(parseISO(booking.date), 'MMM dd, yyyy')}</p>
                      </div>
                    </div>
                  ))}
                </div>
             </CardContent>
           </Card>
        </div>

        <div className="space-y-6">
           <Card className="bg-safari-primary text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-safari-gold/10 rounded-full -mr-16 -mt-16 blur-3xl" />
              <CardContent className="pt-8">
                <h4 className="font-playfair font-bold text-2xl mb-2 text-safari-gold">Safari Intelligence</h4>
                <p className="text-sm text-gray-300 mb-6">"Tourism is the backbone of our pride. Ensure every client feels the pulse of the wild."</p>
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                   <p className="text-[10px] uppercase font-bold tracking-widest text-safari-gold mb-2">Today's Highlight</p>
                   <p className="text-sm font-bold">Maasai Mara migration peak season starts in 12 days. Expect high demand for p1 package.</p>
                </div>
              </CardContent>
           </Card>

           <Card>
             <CardHeader>
               <h3 className="font-bold text-safari-primary dark:text-dark-text">Booking Funnel</h3>
             </CardHeader>
             <CardContent className="space-y-4">
                <div className="space-y-2">
                   <div className="flex justify-between text-xs font-bold">
                     <span>PENDING</span>
                     <span>32%</span>
                   </div>
                   <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                     <div className="h-full bg-safari-gold" style={{ width: '32%' }} />
                   </div>
                </div>
                <div className="space-y-2">
                   <div className="flex justify-between text-xs font-bold">
                     <span>CONFIRMED</span>
                     <span>58%</span>
                   </div>
                   <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                     <div className="h-full bg-safari-success" style={{ width: '58%' }} />
                   </div>
                </div>
             </CardContent>
           </Card>
        </div>
      </div>
    </PageWrapper>
  );
};
