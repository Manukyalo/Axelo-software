import React from 'react';
import { 
  Users, 
  Car, 
  CalendarDays, 
  Banknote,
  AlertCircle,
  Clock,
  ExternalLink,
  Activity,
  MapPin,
  ShieldCheck,
  Zap,
  BellRing,
  PlusCircle,
  Upload
} from 'lucide-react';
import { sendTestNotification } from '../../utils/fcmUtils';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { StatCard } from '../../components/shared/StatCard';
import { Card, CardHeader, CardContent, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useData } from '../../contexts/DataContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAutoPrune } from '../../hooks/useAutoPrune';
import { format, differenceInDays, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const AdminDashboard = () => {
  const { state } = useData();
  const { isDarkMode } = useTheme();
  useAutoPrune();
  const navigate = useNavigate();

  // Stats Calculations
  const totalBookings = state.bookings.length;
  const activeVehicles = state.vehicles.filter(v => v.status === 'Active').length;
  const totalFleet = state.vehicles.length;
  const driversOnDuty = state.drivers.filter(d => d.status === 'On Trip').length;
  const currentMonthRevenue = state.bookings
    .filter(b => b.status !== 'Cancelled')
    .reduce((acc, curr) => acc + curr.paidAmount, 0);
  
  const activePorters = (state.porters || []).filter(p => p.status === 'Active').length;
  const totalPorterTrips = (state.porters || []).reduce((acc, curr) => acc + (curr.totalTrips || 0), 0);

  // Insurance Alerts — guard against missing/malformed insuranceExpiry
  const insuranceAlerts = state.vehicles.filter(v => {
    if (!v.insuranceExpiry) return false;
    try {
      const daysLeft = differenceInDays(parseISO(v.insuranceExpiry), new Date());
      return daysLeft < 30;
    } catch {
      return false;
    }
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
        <StatCard 
          title="Ground Ops" 
          value={`${activePorters} Active`} 
          change={totalPorterTrips} 
          unit="Trips: "
          icon={Activity} 
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

        {/* System Intelligence & Notifications */}
        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-500/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between">
            <h3 className="font-bold text-safari-primary dark:text-dark-text flex items-center gap-2">
              <ShieldCheck size={18} className="text-blue-500" /> System Intelligence
            </h3>
            <Badge variant="info" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Active</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-white/50 dark:bg-dark-card border border-blue-500/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase text-gray-400">Desktop Alerts</span>
                  <span className={`text-[10px] font-bold ${Notification.permission === 'granted' ? 'text-emerald-500' : 'text-orange-500'}`}>
                    {Notification.permission === 'granted' ? 'ENABLED' : 'ACTION REQUIRED'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed mb-3">
                  Ensure browser notifications are enabled to receive critical SOS and booking updates on your desktop.
                </p>
                <Button 
                  onClick={sendTestNotification}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-black uppercase py-2 flex items-center justify-center gap-2"
                >
                  <BellRing size={14} /> Send Test Alert
                </Button>
              </div>

              <div className="flex items-center gap-3 px-1">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <Zap size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-safari-primary dark:text-dark-text uppercase">FCM Infrastructure</p>
                  <p className="text-[9px] text-gray-400">Cloud Sync: Healthy</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Operations - Added for better UX */}
        <Card className="border-l-4 border-l-safari-gold bg-gradient-to-br from-safari-gold/5 to-transparent">
          <CardHeader>
            <h3 className="font-bold text-safari-primary dark:text-dark-text flex items-center gap-2">
              <Activity size={18} className="text-safari-gold" /> Quick Operations
            </h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-[10px] font-bold uppercase h-auto py-3 flex flex-col gap-1"
                onClick={() => navigate('/admin/bookings')}
              >
                <PlusCircle size={14} /> New Booking
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-[10px] font-bold uppercase h-auto py-3 flex flex-col gap-1"
                onClick={() => navigate('/admin/bookings')}
              >
                <Upload size={14} /> Bulk Import
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-[10px] font-bold uppercase h-auto py-3 flex flex-col gap-1"
                onClick={() => navigate('/admin/live-tracking')}
              >
                <MapPin size={14} /> Live Map
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-[10px] font-bold uppercase h-auto py-3 flex flex-col gap-1"
                onClick={() => window.open('https://eastern-vacations-staff.vercel.app/', '_blank')}
              >
                <ShieldCheck size={14} /> Staff Portal
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
            <div style={{ width: '100%', height: 300 }}>
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
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <h3 className="font-bold text-safari-primary dark:text-dark-text">Vehicle Status</h3>
          </CardHeader>
          <CardContent className="h-[300px] w-full flex items-center justify-center">
            <div style={{ width: '100%', height: 300 }}>
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
            </div>
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
                  <td className="py-4 text-sm">{booking.date ? format(parseISO(booking.date), 'MMM dd, yyyy') : '—'}</td>
                  <td className="py-4 text-sm">{((booking.pax?.adults ?? 0) + (booking.pax?.children ?? 0))} Pax</td>
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
      <Card className="mt-8 border-gray-100 dark:border-dark-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xl font-playfair font-bold text-safari-primary dark:text-dark-text flex items-center gap-2">
            <Activity className="text-safari-gold" size={20} /> Live Driver Activity
          </CardTitle>
          <Badge variant="gold" className="animate-pulse">Real-time Feed</Badge>
        </CardHeader>
        <CardContent>
          <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-safari-gold/20 before:to-transparent">
             {(state.tripUpdates || []).length === 0 ? (
               <div className="py-10 text-center opacity-50">
                  <p className="text-sm font-dm-sans">No recent trip updates.</p>
               </div>
             ) : (
               state.tripUpdates.slice(0, 8).sort((a,b) => b.timestamp?.seconds - a.timestamp?.seconds).map((update, idx) => (
                 <div key={update.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                    {/* Icon */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white dark:border-dark-border bg-safari-bg dark:bg-dark-card shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-all group-hover:scale-110">
                       <div className="w-2 h-2 rounded-full bg-safari-gold" />
                    </div>
                    {/* Content */}
                    <div className="w-[calc(100%-4rem)] md:w-[45%] p-4 rounded-2xl border border-gray-50 dark:border-dark-border bg-white dark:bg-dark-surface shadow-sm group-hover:shadow-md transition-all">
                       <div className="flex justify-between items-start mb-1">
                          <p className="font-bold text-safari-primary dark:text-dark-text text-sm">
                             {state.drivers.find(d => d.id === update.driverId)?.name || 'Unknown Driver'}
                          </p>
                          <time className="text-[10px] font-jetbrains text-gray-400">
                             {update.timestamp?.seconds ? format(new Date(update.timestamp.seconds * 1000), 'HH:mm') : ''}
                          </time>
                       </div>
                       <p className="text-xs text-safari-gold font-bold uppercase tracking-wider mb-2">{update.type}</p>
                       <div className="flex items-center gap-2 text-[11px] text-gray-500">
                          <MapPin size={12} className="shrink-0" />
                          <span className="truncate">{update.locationName || 'On Track'}</span>
                       </div>
                    </div>
                 </div>
               ))
             )}
          </div>
        </CardContent>
      </Card>
    </PageWrapper>
  );
};
