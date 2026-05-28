// Data import trigger: 35 Safari Bookings for 2026 successfully added to Firestore
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { AdminLogin, ReservationsLogin } from './pages/auth/Login';

import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { GlobalSOSBanner } from './components/shared/GlobalSOSBanner';

// Layout
const Layout = ({ children }) => {
  const { user } = useAuth();
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-safari-bg dark:bg-dark-bg">
      <GlobalSOSBanner />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar role={user?.role} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

import { AdminDashboard } from './pages/admin/Dashboard';
import { Vehicles } from './pages/admin/Vehicles';
import { Drivers } from './pages/admin/Drivers';
import { LiveTracking } from './pages/admin/LiveTracking';
import { SOSAlerts } from './pages/admin/SOSAlerts';
import { Bookings } from './pages/admin/Bookings';
import { Packages } from './pages/admin/Packages';
import { Reports } from './pages/admin/Reports';
import { Settings } from './pages/admin/Settings';
import { Messages } from './pages/admin/Messages';
import { UpcomingSafaris } from './pages/UpcomingSafaris';
import { AIManager } from './pages/AIManager';
import { AIActivityLog } from './pages/AIActivityLog';
import { requestFirebaseToken, onMessageListener } from './utils/fcmUtils';
import { WeatherIntelligence } from './pages/shared/WeatherIntelligence';


import { ReservationsDashboard } from './pages/reservations/Dashboard';
import { Profile } from './pages/reservations/Profile';

// Shared
import { Bookings as BookingsView } from './pages/admin/Bookings';

// Reservations Pages
const ResDashboard = ReservationsDashboard;
const NewBooking = () => <BookingsView />; // Opens modal automatically in actual flow
const MyBookings = () => <BookingsView />; 
const AllBookings = () => <BookingsView />;
const ResVehicles = Vehicles;
const ResDrivers = Drivers;

const ProtectedRoute = ({ children, allowedRole, title }) => {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (title) document.title = `${title} | ToursPro`;
  }, [title]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-safari-bg dark:bg-dark-bg">
      <div className="w-16 h-16 border-4 border-safari-gold/20 border-t-safari-gold rounded-full animate-spin mb-4" />
      <p className="font-playfair font-bold text-safari-primary dark:text-dark-text animate-pulse">ToursPro...</p>
    </div>
  );

  if (!user) {
    return <Navigate to={allowedRole === 'admin' ? '/admin/login' : '/reservations/login'} />;
  }

  if (user.role !== allowedRole) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/reservations'} />;
  }

  return children;
};

import { KillSwitchGuard } from './components/shared/KillSwitchGuard';

function App() {
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.uid) {
      // Initialize FCM
      requestFirebaseToken(user.uid);
      onMessageListener();
    }
  }, [user]);

  return (
    <BrowserRouter>
      <KillSwitchGuard>
        <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/admin/login" />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/reservations/login" element={<ReservationsLogin />} />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRole="admin" title="Dashboard">
            <Layout><AdminDashboard /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/vehicles" element={
          <ProtectedRoute allowedRole="admin" title="Vehicles">
            <Layout><Vehicles /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/drivers" element={
          <ProtectedRoute allowedRole="admin" title="Drivers">
            <Layout><Drivers /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/live-tracking" element={
          <ProtectedRoute allowedRole="admin" title="Live Fleet Tracking">
            <Layout><LiveTracking /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/sos-alerts" element={
          <ProtectedRoute allowedRole="admin" title="Emergency SOS Alerts">
            <Layout><SOSAlerts /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/bookings" element={
          <ProtectedRoute allowedRole="admin" title="Bookings">
            <Layout><Bookings /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/packages" element={
          <ProtectedRoute allowedRole="admin" title="Tour Packages">
            <Layout><Packages /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/reports" element={
          <ProtectedRoute allowedRole="admin" title="Reports">
            <Layout><Reports /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/upcoming-safaris" element={
          <ProtectedRoute allowedRole="admin" title="Upcoming Safaris">
            <Layout><UpcomingSafaris /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/ai-manager" element={
          <ProtectedRoute allowedRole="admin" title="AI Manager Hub">
            <Layout><AIManager /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/ai-logs" element={
          <ProtectedRoute allowedRole="admin" title="AI Activity Log">
            <Layout><AIActivityLog /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/settings" element={
          <ProtectedRoute allowedRole="admin" title="Settings">
            <Layout><Settings /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/messages" element={
          <ProtectedRoute allowedRole="admin" title="Fleet Messages">
            <Layout><Messages /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/weather" element={
          <ProtectedRoute allowedRole="admin" title="Weather Intelligence">
            <Layout><WeatherIntelligence /></Layout>
          </ProtectedRoute>
        } />

        {/* Reservations Routes */}
        <Route path="/reservations" element={
          <ProtectedRoute allowedRole="agent" title="Agent Dashboard">
            <Layout><ResDashboard /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/reservations/new-booking" element={
          <ProtectedRoute allowedRole="agent" title="New Booking">
            <Layout><NewBooking /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/reservations/my-bookings" element={
          <ProtectedRoute allowedRole="agent" title="My Bookings">
            <Layout><MyBookings /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/reservations/all-bookings" element={
          <ProtectedRoute allowedRole="agent" title="All Bookings">
            <Layout><AllBookings /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/reservations/vehicles" element={
          <ProtectedRoute allowedRole="agent" title="Vehicles">
            <Layout><ResVehicles /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/reservations/drivers" element={
          <ProtectedRoute allowedRole="agent" title="Drivers">
            <Layout><ResDrivers /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/reservations/upcoming-safaris" element={
          <ProtectedRoute allowedRole="agent" title="Upcoming Safaris">
            <Layout><UpcomingSafaris /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/reservations/profile" element={
          <ProtectedRoute allowedRole="agent" title="Profile">
            <Layout><Profile /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/reservations/weather" element={
          <ProtectedRoute allowedRole="agent" title="Weather Intelligence">
            <Layout><WeatherIntelligence /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/reservations/live-tracking" element={
          <ProtectedRoute allowedRole="agent" title="Live Fleet Tracking">
            <Layout><LiveTracking /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/reservations/sos-alerts" element={
          <ProtectedRoute allowedRole="agent" title="Emergency SOS Alerts">
            <Layout><SOSAlerts /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/reservations/messages" element={
          <ProtectedRoute allowedRole="agent" title="Fleet Messages">
            <Layout><Messages /></Layout>
          </ProtectedRoute>
        } />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      </KillSwitchGuard>
    </BrowserRouter>
  );
}

export default App;
