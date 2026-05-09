import React from 'react';
import { User, Lock, ArrowRight } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { validateString } from '../../utils/validation';

const UnifiedLogin = ({ initialRole }) => {
  const [role, setRole] = React.useState(initialRole || 'admin');
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
     setUsername('');
     setPassword('');
  }, [role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const cleanUsername = validateString(username, 150, 'Username');
      await login(cleanUsername, password, role);
      toast.success('Welcome back!');
      navigate(role === 'admin' ? '/admin' : '/reservations');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-safari-bg dark:bg-dark-bg p-4 relative overflow-hidden">
      {/* Bokeh Background Effect */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-safari-gold/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-safari-primary/10 rounded-full blur-[100px]" />
      
      <div className="w-full max-w-md animate-fade-in relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white dark:bg-dark-card rounded-2xl mb-4 shadow-lg overflow-hidden p-2">
            <img src="/logo.png" alt="Eastern Vacations" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-playfair font-bold text-safari-primary dark:text-dark-text">Eastern Vacations</h1>
          <p className="text-safari-earthy dark:text-safari-gold/60 font-medium tracking-wide">Enterprise Management System</p>
          <div className="w-24 h-1 bg-safari-gold mx-auto mt-4 rounded-full" />
        </div>
        
        <div className="relative group mt-6">
          {/* Glowing Animated Border Trick */}
          <div className="absolute -inset-1 bg-gradient-to-r from-safari-gold via-safari-primary to-safari-gold rounded-[24px] blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-300 animate-pulse"></div>
          
          <Card className="relative bg-white dark:bg-dark-card border-none rounded-2xl shadow-2xl p-2 z-10 m-0">
            <CardContent className="pt-6">
              
              <div className="flex p-1 mb-8 bg-gray-50 dark:bg-dark-bg rounded-lg border border-gray-100 dark:border-dark-border">
                  <button 
                     type="button"
                     onClick={() => setRole('admin')} 
                     className={`flex-1 py-2.5 text-sm font-bold rounded-md transition-all ${role === 'admin' ? 'bg-white dark:bg-dark-surface shadow-sm text-safari-primary dark:text-safari-gold' : 'text-gray-400 hover:text-gray-600'}`}>
                     Admin Portal
                  </button>
                  <button 
                     type="button"
                     onClick={() => setRole('agent')} 
                     className={`flex-1 py-2.5 text-sm font-bold rounded-md transition-all ${role === 'agent' ? 'bg-white dark:bg-dark-surface shadow-sm text-safari-primary dark:text-safari-gold' : 'text-gray-400 hover:text-gray-600'}`}>
                     Reservations Portal
                  </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Username"
                  placeholder={role === 'admin' ? "admin@toursco" : "reservations@toursco"}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder={role === 'admin' ? "Admin@2025#Secure" : "Res@2025#Secure"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button 
                  type="submit" 
                  className="w-full py-3.5 mt-2 font-bold tracking-wider" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Authenticating...' : (
                    <span className="flex items-center justify-center gap-2">
                      Sign In <ArrowRight size={18} />
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
        
        <p className="text-center mt-8 text-sm text-gray-400 font-dm-sans">
          &copy; 2025 Eastern Vacations Safari & Tours.<br/>All rights reserved.
        </p>
      </div>
    </div>
  );
};

export const AdminLogin = () => <UnifiedLogin initialRole="admin" />;
export const ReservationsLogin = () => <UnifiedLogin initialRole="agent" />;
