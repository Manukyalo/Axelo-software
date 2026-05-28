import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Shield, 
  Lock, 
  Palette, 
  Award, 
  Clock, 
  Activity, 
  Key, 
  ShieldCheck, 
  Eye, 
  EyeOff,
  Moon,
  Sun
} from 'lucide-react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useTheme } from '../../contexts/ThemeContext';
import { sendPasswordResetEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../../config/firebase';
import toast from 'react-hot-toast';

export const Profile = () => {
  const { user } = useAuth();
  const { state } = useData();
  const { accentColor, setAccentColor, isDarkMode, toggleDarkMode } = useTheme();

  const [passwords, setPasswords] = useState({ current: '', new: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  // Stats Metrics
  const myBookings = (state?.bookings || []).filter(b => b.createdById === user?.username);
  const activeTripsCount = (state?.bookings || []).filter(b => b.status === 'On Trip').length;
  const unpaidBookingsCount = myBookings.filter(b => b.paymentStatus === 'Unpaid').length;

  const handlePasswordResetEmail = async () => {
    if (!user?.username) return;
    try {
      setSendingReset(true);
      await sendPasswordResetEmail(auth, user.username);
      toast.success(`Security reset transmission dispatched to ${user.username}`);
    } catch (err) {
      toast.error(err.message || 'Failed to dispatch reset email');
    } finally {
      setSendingReset(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!passwords.current || !passwords.new) {
      return toast.error('Both current and new password are required');
    }
    if (passwords.new.length < 6) {
      return toast.error('New password must be at least 6 characters');
    }

    try {
      setIsUpdating(true);
      const credential = EmailAuthProvider.credential(user.username, passwords.current);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, passwords.new);
      toast.success('Security credentials updated successfully');
      setPasswords({ current: '', new: '' });
    } catch (err) {
      toast.error(err.message || 'Verification failed. Double check your current credentials.');
    } finally {
      setIsUpdating(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin': return <Badge variant="danger" className="uppercase tracking-widest font-black text-[10px]">Administrator</Badge>;
      case 'agent': return <Badge variant="success" className="uppercase tracking-widest font-black text-[10px]">Reservations Agent</Badge>;
      default: return <Badge className="uppercase tracking-widest font-black text-[10px]">{role}</Badge>;
    }
  };

  const initials = (user?.username || 'U').split('@')[0].substring(0, 2).toUpperCase();

  return (
    <PageWrapper 
      title="User Profile" 
      subtitle="Manage your identity settings and track your performance"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Card & Stats */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="text-center p-8 bg-gradient-to-b from-white to-gray-50/50 dark:from-dark-card dark:to-dark-bg/30 border border-gray-100 dark:border-dark-border">
            <CardContent className="pt-6 relative">
              <div className="relative inline-block mb-6">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-safari-gold/20 to-safari-gold/5 text-safari-gold flex items-center justify-center text-3xl font-playfair font-black border border-safari-gold/10 shadow-inner mx-auto">
                  {initials}
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-2xl border-4 border-white dark:border-dark-card flex items-center justify-center text-white shadow-lg">
                  <ShieldCheck size={16} />
                </div>
              </div>

              <h3 className="font-bold text-xl text-safari-primary dark:text-dark-text leading-tight mb-2">
                {user?.username?.split('@')[0]}
              </h3>
              <p className="text-xs text-gray-400 font-jetbrains mb-4 truncate">{user?.username}</p>
              
              <div className="flex justify-center mb-6">
                {getRoleBadge(user?.role)}
              </div>

              <div className="pt-6 border-t border-gray-100 dark:border-dark-border space-y-1.5 text-left text-xs">
                <p className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">Identity ID</p>
                <code className="block bg-gray-50 dark:bg-dark-bg/60 p-2.5 rounded-xl text-gray-500 dark:text-gray-400 break-all select-all font-jetbrains border border-gray-100 dark:border-dark-border/50">
                  {user?.uid}
                </code>
              </div>
            </CardContent>
          </Card>

          {/* User Metrics */}
          <div className="grid grid-cols-1 gap-4">
            <Card className="border-l-4 border-l-safari-gold">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-safari-gold/10 rounded-2xl flex items-center justify-center text-safari-gold shrink-0">
                  <Award size={22} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-0.5">My Handled Bookings</p>
                  <p className="text-xl font-jetbrains font-black text-safari-primary dark:text-dark-text">{myBookings.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 shrink-0">
                  <Activity size={22} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-0.5">Live Expedition Safaris</p>
                  <p className="text-xl font-jetbrains font-black text-safari-primary dark:text-dark-text">{activeTripsCount}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 shrink-0">
                  <Clock size={22} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-0.5">Pending Unpaid Bookings</p>
                  <p className="text-xl font-jetbrains font-black text-safari-primary dark:text-dark-text">{unpaidBookingsCount}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Configurations & Security Settings */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Preferences Section */}
          <Card>
            <CardContent className="p-6 space-y-6">
              <h3 className="text-base font-bold text-safari-primary dark:text-dark-text flex items-center gap-2 pb-3 border-b border-gray-50 dark:border-dark-border">
                <Palette size={18} className="text-safari-gold" /> System Preferences
              </h3>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-safari-primary dark:text-dark-text">Interface Mode</h4>
                  <p className="text-xs text-gray-400">Toggle light or dark styling system</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={toggleDarkMode}
                  className="gap-2 text-xs font-black uppercase tracking-widest"
                >
                  {isDarkMode ? (
                    <>
                      <Sun size={14} className="text-amber-500" /> Light Mode
                    </>
                  ) : (
                    <>
                      <Moon size={14} className="text-blue-500" /> Dark Mode
                    </>
                  )}
                </Button>
              </div>

              <div className="pt-2">
                <h4 className="font-bold text-sm text-safari-primary dark:text-dark-text mb-3">Theme Accent Tone</h4>
                <div className="flex gap-4">
                  {['gold', 'blue', 'green', 'rose'].map(color => (
                    <button 
                      key={color}
                      onClick={() => setAccentColor(color)}
                      className={`w-10 h-10 rounded-xl transition-all border-4 ${accentColor === color ? 'border-safari-primary dark:border-white scale-110 shadow-md' : 'border-transparent'}`}
                      style={{ backgroundColor: color === 'gold' ? '#C9A84C' : color === 'blue' ? '#3B82F6' : color === 'green' ? '#10B981' : '#F43F5E' }}
                      title={`Accent: ${color}`}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Credentials Section */}
          <Card>
            <CardContent className="p-6 space-y-6">
              <h3 className="text-base font-bold text-safari-primary dark:text-dark-text flex items-center gap-2 pb-3 border-b border-gray-50 dark:border-dark-border">
                <Lock size={18} className="text-safari-gold" /> Security Settings
              </h3>

              <div className="space-y-4">
                <h4 className="font-bold text-sm text-safari-primary dark:text-dark-text">Biometric & Password Reset</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  To securely reset your password via email link verification, click the button below. A secure token link will be dispatched to your registered address.
                </p>
                <Button 
                  variant="outline" 
                  disabled={sendingReset}
                  onClick={handlePasswordResetEmail}
                  className="gap-2 text-xs font-black uppercase tracking-widest"
                >
                  <Mail size={14} /> {sendingReset ? 'Sending...' : 'Send Password Reset Email'}
                </Button>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-dark-border">
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <h4 className="font-bold text-sm text-safari-primary dark:text-dark-text mb-2">Direct Password Mutation</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <Input 
                        label="Current Password" 
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••" 
                        value={passwords.current}
                        onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                        required
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-[38px] text-gray-400 hover:text-gray-600 dark:hover:text-white"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <Input 
                      label="New Secure Password" 
                      type="password"
                      placeholder="Min 6 characters" 
                      value={passwords.new}
                      onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                      required
                    />
                  </div>
                  <Button 
                    disabled={isUpdating}
                    type="submit"
                    className="w-full gap-2 text-xs font-black uppercase tracking-widest"
                  >
                    <Key size={14} /> {isUpdating ? 'Securing Credentials...' : 'Mutate Password'}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </PageWrapper>
  );
};
