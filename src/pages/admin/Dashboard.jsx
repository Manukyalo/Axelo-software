import React from 'react';
import { 
  Users, 
  Car, 
  CalendarDays, 
  Banknote,
  AlertCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { StatCard } from '../../components/shared/StatCard';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useData } from '../../contexts/DataContext';
import { useTheme } from '../../contexts/ThemeContext';
import { format, differenceInDays, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const AdminDashboard = () => {
  const { state } = useData();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  // Stats Calculations
  const totalBookings = state.bookings.length;
  const activeVehicles = state.vehicles.filter(v => v.status === 'Active').length;
  const totalFleet = state.vehicles.length;
  const driversOnDuty = state.drivers.filter(d => d.status === 'On Trip').length;
  const currentMonthRevenue = state.bookings
    .filter(b => b.status !== 'Cancelled')
    .reduce((acc, curr) => acc + curr.paidAmount, 0);

  // Insurance Alerts
  const insuranceAlerts = state.vehicles.filter(v => {
    const daysLeft = differenceInDays(parseISO(v.insuranceExpiry), new Date());
    return daysLeft < 30;
  });

  // Maintenance Alerts
  const maintenanceAlerts = state.vehicles.filter(v => v.status === 'In Maintenance');

  // Today's Bookings
  const todayOnly = new Date().toISOString().split('T')[0];
  const todaysBookings = state.bookings.filter(b => b.date && b.date.startsWith(todayOnly));

  // Chart Data
  const bookingTrend = (() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trend = months.map(m => ({ month: m, safari: 0, cityTour: 0 }));
    
    state.bookings.forEach(b => {
      if (!b.date) return;
      const monthIdx = parseISO(b.date).getMonth();
      const type = b.type || 'Safari';
      if (type === 'Safari') {
         trend[monthIdx].safari += 1;
      } else {
         trend[monthIdx].cityTour += 1; 
      }
    });
    return trend;
  })();

  const vehicleStatusData = [
    { name: 'Active', value: state.vehicles.filter(v => v.status === 'Active').length, color: '#2D6A4F' },
    { name: 'Maintenance', value: state.vehicles.filter(v => v.status === 'In Maintenance').length, color: '#C9A84C' },
    { name: 'Retired', value: state.vehicles.filter(v => v.status === 'Retired').length, color: '#E76F51' },
  ];

  return (
    <PageWrapper 
      title="Dashboard Overview" 
      subtitle="Welcome back, Administrator. Here's what's happening today."
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Bookings" 
          value={totalBookings} 
          change={12.5} 
          icon={CalendarDays} 
        />
        <StatCard 
          title="Active Vehicles" 
          value={`${activeVehicles}/${totalFleet}`} 
          icon={Car} 
        />
        <StatCard 
          title="Drivers Duty" 
          value={driversOnDuty} 
          icon={Users} 
        />
        <StatCard 
          title="Monthly Revenue" 
          value={currentMonthRevenue} 
          unit="KES " 
          change={8.2} 
          icon={Banknote} 
        />
      </div>

      {/* Alerts & Quick Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between">
            <h3 className="font-bold text-safari-primary dark:text-dark-text flex items-center gap-2">
              <AlertCircle size={18} className="text-red-500" /> Insurance Alerts
            </h3>
            <Badge variant="danger">{insuranceAlerts.length}</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insuranceAlerts.slice(0, 3).map(v => (
                <div key={v.id} className="flex items-center justify-between group">
                  <div>
                    <p className="text-sm font-bold text-safari-primary dark:text-dark-text">{v.plate}</p>
                    <p className="text-xs text-gray-500">Expires {format(parseISO(v.insuranceExpiry), 'MMM dd')}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => toast.success(`Renewal request sent to insurance provider for ${v.plate}`)}>
                    Renew
                  </Button>
                </div>
              ))}
              <Button variant="ghost" size="sm" className="w-full text-xs uppercase tracking-widest font-bold" onClick={() => navigate('/admin/vehicles')}>
                View All Alerts
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-safari-gold">
          <CardHeader className="flex flex-row items-center justify-between">
            <h3 className="font-bold text-safari-primary dark:text-dark-text flex items-center gap-2">
              <Clock size={18} className="text-safari-gold" /> Maintenance Due
            </h3>
            <Badge variant="gold">{maintenanceAlerts.length}</Badge>
          </CardHeader>
          <CardContent>
            {maintenanceAlerts.length === 0 ? (
               <p className="text-sm text-gray-500 mb-4">No vehicles urgently due for service today.</p>
            ) : (
               <div className="space-y-3">
                 {maintenanceAlerts.slice(0, 2).map(v => (
                   <div key={v.id} className="p-3 bg-safari-gold/5 rounded-xl border border-safari-gold/10">
                      <p className="text-xs text-safari-earthy">In Maintenance: <span className="font-bold">{v.plate}</span></p>
                   </div>
                 ))}
               </div>
            )}
            <Button variant="ghost" size="sm" className="w-full mt-4 text-xs uppercase tracking-widest font-bold" onClick={() => navigate('/admin/vehicles')}>
                View Fleet
            </Button>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-safari-success">
          <CardHeader className="flex flex-row items-center justify-between">
            <h3 className="font-bold text-safari-primary dark:text-dark-text flex items-center gap-2">
              <CalendarDays size={18} className="text-safari-success" /> Today's Bookings
            </h3>
            <Badge variant="success">{todaysBookings.length}</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todaysBookings.length === 0 ? (
                 <p className="text-sm text-gray-500 py-2">No safaris scheduled for today.</p>
              ) : (
                 todaysBookings.slice(0, 2).map(b => (
                   <div key={b.id} className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-safari-success/10 text-safari-success rounded-full flex items-center justify-center font-bold uppercase">
                       {b.clientName.split(' ').map(n=>n[0]).join('').substring(0,2)}
                     </div>
                     <div>
                       <p className="text-sm font-bold text-safari-primary dark:text-dark-text">{b.clientName}</p>
                       <p className="text-xs text-gray-500">{state.packages.find(p=>p.id === b.packageId)?.name}</p>
                     </div>
                   </div>
                 ))
              )}
              <Button variant="ghost" size="sm" className="w-full mt-2 text-xs uppercase tracking-widest font-bold" onClick={() => navigate('/admin/bookings')}>
                View Full Schedule
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="lg:col-span-1">
          <CardHeader>
            <h3 className="font-bold text-safari-primary dark:text-dark-text">Bookings Trend</h3>
          </CardHeader>
          <CardContent className="h-[300px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={bookingTrend}>
                <defs>
                  <linearGradient id="colorSafari" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#C9A84C" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCityTour" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2D6A4F" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2D6A4F" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#222' : '#f0f0f0'} />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#888', fontSize: 12 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#888', fontSize: 12 }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? '#1e1e35' : '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  }}
                />
                <Area 
                  name="Safari"
                  type="monotone" 
                  dataKey="safari" 
                  stroke="#C9A84C" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorSafari)" 
                />
                <Area 
                  name="City Tour"
                  type="monotone" 
                  dataKey="cityTour" 
                  stroke="#2D6A4F" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorCityTour)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <h3 className="font-bold text-safari-primary dark:text-dark-text">Vehicle Status</h3>
          </CardHeader>
          <CardContent className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vehicleStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {vehicleStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ 
                    backgroundColor: isDarkMode ? '#1e1e35' : '#fff',
                    border: 'none',
                    borderRadius: '12px'
                  }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h3 className="font-bold text-safari-primary dark:text-dark-text">Recent Bookings</h3>
          <Button variant="ghost" size="sm" className="text-safari-gold" onClick={() => navigate('/admin/bookings')}>View All</Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 dark:border-dark-border">
                <th className="pb-4 font-playfair font-bold text-safari-primary dark:text-dark-text">Client</th>
                <th className="pb-4 font-playfair font-bold text-safari-primary dark:text-dark-text">Package</th>
                <th className="pb-4 font-playfair font-bold text-safari-primary dark:text-dark-text">Date</th>
                <th className="pb-4 font-playfair font-bold text-safari-primary dark:text-dark-text">Pax</th>
                <th className="pb-4 font-playfair font-bold text-safari-primary dark:text-dark-text">Status</th>
                <th className="pb-4 font-playfair font-bold text-safari-primary dark:text-dark-text">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-dark-border">
              {state.bookings.slice(0, 5).map((booking) => (
                <tr key={booking.id} className="group hover:bg-safari-gold/5 transition-colors">
                  <td className="py-4">
                    <p className="font-bold text-safari-primary dark:text-dark-text">{booking.clientName}</p>
                    <p className="text-xs text-gray-500">{booking.id}</p>
                  </td>
                  <td className="py-4">
                    <p className="text-sm">{state.packages.find(p => p.id === booking.packageId)?.name}</p>
                  </td>
                  <td className="py-4 text-sm">{format(parseISO(booking.date), 'MMM dd, yyyy')}</td>
                  <td className="py-4 text-sm">{booking.pax.adults + booking.pax.children} Pax</td>
                  <td className="py-4">
                    <Badge variant={booking.status === 'Confirmed' ? 'info' : booking.status === 'On Trip' ? 'success' : 'gold'}>
                      {booking.status}
                    </Badge>
                  </td>
                  <td className="py-4">
                    <Button variant="ghost" size="icon" className="hover:text-safari-gold" onClick={() => navigate('/admin/bookings')}>
                      <ExternalLink size={18} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </PageWrapper>
  );
};
