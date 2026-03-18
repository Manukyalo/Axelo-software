import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line 
} from 'recharts';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Download, Filter, TrendingUp } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useTheme } from '../../contexts/ThemeContext';

export const Reports = () => {
  const { state } = useData();
  const { isDarkMode } = useTheme();

  const revenueData = [
    { name: 'Jan', revenue: 450000 },
    { name: 'Feb', revenue: 520000 },
    { name: 'Mar', revenue: 480000 },
    { name: 'Apr', revenue: 610000 },
    { name: 'May', revenue: 750000 },
    { name: 'Jun', revenue: 820000 },
  ];

  const packagesData = state.packages.map(p => ({
    name: p.name.split(' ')[0],
    value: state.bookings.filter(b => b.packageId === p.id).length
  }));

  const COLORS = ['#C9A84C', '#1A1A2E', '#8B5E3C', '#2D6A4F'];

  return (
    <PageWrapper 
      title="Analytics & Reports" 
      subtitle="Financial performance and operational insights"
      actions={
        <Button variant="primary" className="gap-2">
          <Download size={18} /> Export Full Report
        </Button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <h3 className="font-bold text-safari-primary dark:text-dark-text">Monthly Revenue (KES)</h3>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#222' : '#f0f0f0'} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val/1000}k`} />
                <Tooltip 
                  cursor={{ fill: 'rgba(201, 168, 76, 0.05)' }}
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? '#1e1e35' : '#fff',
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar dataKey="revenue" fill="#C9A84C" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-bold text-safari-primary dark:text-dark-text">Bookings by Package</h3>
          </CardHeader>
          <CardContent className="h-[350px]">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={packagesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {packagesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h3 className="font-bold text-safari-primary dark:text-dark-text">Driver Performance Index</h3>
        </CardHeader>
        <CardContent>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 dark:border-dark-border">
                <th className="pb-4 font-bold text-sm">Driver</th>
                <th className="pb-4 font-bold text-sm">Trips</th>
                <th className="pb-4 font-bold text-sm">Rating</th>
                <th className="pb-4 font-bold text-sm">Revenue Generated</th>
                <th className="pb-4 font-bold text-sm">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-dark-border">
              {state.drivers.map(d => (
                <tr key={d.id}>
                  <td className="py-4 font-bold text-sm">{d.name}</td>
                  <td className="py-4 text-sm font-jetbrains">{d.trips}</td>
                  <td className="py-4 text-sm font-bold text-safari-gold">{d.rating} ★</td>
                  <td className="py-4 text-sm font-jetbrains">KES {(d.trips * 45000).toLocaleString()}</td>
                  <td className="py-4">
                     <span className={`w-2 h-2 inline-block rounded-full mr-2 ${d.status === 'Available' ? 'bg-safari-success' : 'bg-safari-gold'}`} />
                     <span className="text-xs uppercase font-bold text-gray-400">{d.status}</span>
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
