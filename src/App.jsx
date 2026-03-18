import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { SeedInitializer } from './utils/SeedInitializer';

import { AdminLogin, ReservationsLogin } from './pages/auth/Login';

import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';

// Layout
const Layout = ({ children }) => {
  const { user } = useAuth();
  return (
    <div className="flex h-screen bg-safari-bg dark:bg-dark-bg overflow-hidden">
      <Sidebar role={user?.role} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

import { AdminDashboard } from './pages/admin/Dashboard';
import { Vehicles } from './pages/admin/Vehicles';
import { Drivers } from './pages/admin/Drivers';
import { Bookings } from './pages/admin/Bookings';
import { Packages } from './pages/admin/Packages';
import { Reports } from './pages/admin/Reports';
import { Settings } from './pages/admin/Settings';

import { ReservationsDashboard } from './pages/reservations/Dashboard';

// Shared
import { Bookings as BookingsView } from './pages/admin/Bookings';

// Reservations Pages
const ResDashboard = ReservationsDashboard;
const NewBooking = () => <BookingsView />; // Opens modal automatically in actual flow
const MyBookings = () => <BookingsView />; 
const AllBookings = () => <BookingsView />;
const Profile = () => <div>Profile</div>;
const ResPackages = Packages;

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

function App() {
  return (
    <BrowserRouter>
      <SeedInitializer />
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
        <Route path="/admin/settings" element={
          <ProtectedRoute allowedRole="admin" title="Settings">
            <Layout><Settings /></Layout>
          </ProtectedRoute>
        } />

        {/* Reservations Routes */}
        <Route path="/reservations" element={
          <ProtectedRoute allowedRole="res_agent" title="Agent Dashboard">
            <Layout><ResDashboard /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/reservations/new-booking" element={
          <ProtectedRoute allowedRole="res_agent" title="New Booking">
            <Layout><NewBooking /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/reservations/my-bookings" element={
          <ProtectedRoute allowedRole="res_agent" title="My Bookings">
            <Layout><MyBookings /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/reservations/all-bookings" element={
          <ProtectedRoute allowedRole="res_agent" title="All Bookings">
            <Layout><AllBookings /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/reservations/packages" element={
          <ProtectedRoute allowedRole="res_agent" title="Tour Packages">
            <Layout><ResPackages /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/reservations/profile" element={
          <ProtectedRoute allowedRole="res_agent" title="Profile">
            <Layout><Profile /></Layout>
          </ProtectedRoute>
        } />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
