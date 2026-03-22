import React from 'react';
import { User, Lock, ArrowRight } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const LoginLayout = ({ children, role }) => (
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
        <p className="text-safari-earthy dark:text-safari-gold/60 font-medium">Enterprise Management System</p>
        <div className="w-24 h-1 bg-safari-gold mx-auto mt-4 rounded-full" />
      </div>
      
      <Card className="border-t-4 border-t-safari-gold">
        <CardContent className="pt-8">
          <div className="mb-6">
            <h2 className="text-xl font-playfair font-bold text-safari-primary dark:text-dark-text">
              {role === 'admin' ? 'Admin Portal' : 'Reservations Portal'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Please enter your credentials to login</p>
          </div>
          {children}
        </CardContent>
      </Card>
      
      <p className="text-center mt-8 text-sm text-gray-400 font-dm-sans">
        &copy; 2025 ToursPro Safari & Tours. All rights reserved.
      </p>
    </div>
  </div>
);

const LoginForm = ({ role }) => {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(username, password, role);
      toast.success('Welcome back!');
      navigate(role === 'admin' ? '/admin' : '/reservations');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="Username"
        placeholder="your@email.com"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Button 
        type="submit" 
        className="w-full py-3" 
        disabled={isLoading}
      >
        {isLoading ? 'Authenticating...' : (
          <span className="flex items-center gap-2">
            Sign In <ArrowRight size={18} />
          </span>
        )}
      </Button>
    </form>
  );
};

export const AdminLogin = () => (
  <LoginLayout role="admin">
    <LoginForm role="admin" />
  </LoginLayout>
);

export const ReservationsLogin = () => (
  <LoginLayout role="res_agent">
    <LoginForm role="res_agent" />
  </LoginLayout>
);
