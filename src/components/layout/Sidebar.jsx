import React, { useState } from 'react';
import { 
  BarChart3, 
  Car, 
  Users, 
  CalendarDays, 
  Package, 
  PieChart, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  LayoutDashboard,
  PlusCircle,
  Briefcase,
  User,
  MapPin,
  Zap,
  ExternalLink,
  ShieldCheck,
  Map,
  ShieldAlert,
  Activity,
  MessageSquare
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import toast from 'react-hot-toast';

const NavItem = ({ to, icon: Icon, label, collapsed, disabled, external }) => {
  if (disabled) {
    return (
      <div
        onClick={() => toast('Under construction. Coming soon!', { icon: '🚧' })}
        className={`flex items-center gap-3 px-4 py-3 transition-all duration-300 cursor-pointer text-gray-400 hover:text-safari-gold hover:bg-safari-gold/5 border-l-4 border-transparent`}
      >
        <Icon size={22} className="shrink-0" />
        {!collapsed && 
          <span className="font-dm-sans font-medium whitespace-nowrap flex items-center justify-between w-full">
            {label}
            <span className="text-[10px] font-bold uppercase tracking-wider bg-safari-gold/20 text-safari-gold px-1.5 py-0.5 rounded ml-2">Soon</span>
          </span>
        }
      </div>
    );
  }

  if (external) {
    return (
      <a
        href={to}
        target="_blank"
        rel="noopener noreferrer"
        className={`
          flex items-center gap-3 px-4 py-3 transition-all duration-300
          text-gray-400 hover:text-safari-gold hover:bg-safari-gold/5 border-l-4 border-transparent
        `}
      >
        <Icon size={22} className="shrink-0" />
        {!collapsed && (
          <span className="font-dm-sans font-medium whitespace-nowrap flex items-center justify-between w-full">
            {label}
            <ExternalLink size={14} className="opacity-50" />
          </span>
        )}
      </a>
    );
  }

  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) => `
        flex items-center gap-3 px-4 py-3 transition-all duration-300
        ${isActive 
          ? 'text-safari-gold bg-safari-gold/10 border-l-4 border-safari-gold' 
          : 'text-gray-400 hover:text-safari-gold hover:bg-safari-gold/5 border-l-4 border-transparent'}
      `}
    >
      <Icon size={22} className="shrink-0" />
      {!collapsed && <span className="font-dm-sans font-medium whitespace-nowrap">{label}</span>}
    </NavLink>
  );
};

export const Sidebar = ({ role }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { state } = useData();

  const handleLogout = () => {
    logout();
    navigate(role === 'admin' ? '/admin/login' : '/reservations/login');
  };

  const adminMenu = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/bookings', icon: CalendarDays, label: 'Bookings' },
    { to: '/admin/upcoming-safaris', icon: MapPin, label: 'Upcoming Safaris' },
    { to: '/admin/vehicles', icon: Car, label: 'Vehicles' },
    { to: '/admin/drivers', icon: Users, label: 'Fleet Personnel' },
    { to: '/admin/live-tracking', icon: Map, label: 'Live Tracking' },
    { to: '/admin/sos-alerts', icon: ShieldAlert, label: 'SOS Alerts' },
    { to: '/admin/messages', icon: MessageSquare, label: 'Fleet Messages' },
    { to: 'https://eastern-vacations-staff.vercel.app/', icon: ShieldCheck, label: 'Staff Portal', external: true },
    { to: '/admin/packages', icon: Package, label: 'Tour Packages', disabled: true },
    { to: '/admin/ai-manager', icon: Zap, label: 'AI Manager' },
    { to: '/admin/reports', icon: BarChart3, label: 'Reports' },
    { to: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  const resMenu = [
    { to: '/reservations', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/reservations/new-booking', icon: PlusCircle, label: 'New Booking' },
    { to: '/reservations/my-bookings', icon: Briefcase, label: 'My Bookings' },
    { to: '/reservations/all-bookings', icon: CalendarDays, label: 'All Bookings' },
    { to: '/reservations/upcoming-safaris', icon: MapPin, label: 'Upcoming Safaris' },
    { to: '/reservations/vehicles', icon: Car, label: 'Vehicles' },
    { to: '/reservations/drivers', icon: Users, label: 'Drivers' },
    { to: 'https://eastern-vacations-staff.vercel.app/', icon: ShieldCheck, label: 'Staff Portal', external: true },
    { to: '/reservations/profile', icon: User, label: 'Profile' },
  ];

  const menu = role === 'admin' ? adminMenu : resMenu;

  return (
    <aside className={`
      relative h-screen bg-safari-primary dark:bg-dark-bg 
      transition-all duration-300 flex flex-col z-40
      ${collapsed ? 'w-[72px]' : 'w-[260px]'}
    `}>
      <div className="flex items-center justify-between px-5 py-6 mb-4">
        {!collapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shrink-0 p-1">
              <img src="/logo.png" alt="EV Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-playfair font-bold text-white text-[15px] leading-tight mt-1">Eastern Vacations</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mx-auto p-1">
            <img src="/logo.png" alt="EV Logo" className="w-full h-full object-contain" />
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto no-scrollbar">
        {menu.map((item) => (
          <NavItem 
            key={item.to} 
            to={item.to} 
            icon={item.icon} 
            label={item.label} 
            collapsed={collapsed}
            disabled={item.disabled}
            external={item.external}
          />
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-white/10">
        <button
          onClick={handleLogout}
          className={`
            w-full flex items-center gap-3 px-4 py-3 
            text-gray-400 hover:text-safari-warning hover:bg-safari-warning/5 
            transition-all duration-300 rounded-button
            ${collapsed ? 'justify-center' : ''}
          `}
        >
          <LogOut size={22} />
          {!collapsed && <span className="font-dm-sans font-medium">Logout</span>}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-safari-gold text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
    </aside>
  );
};
