import React, { createContext, useContext, useState, useEffect } from 'react';
import { validateToken, comparePassword, generateToken } from '../utils/auth';

const AuthContext = createContext();

const ADMIN_CRED_KEY = 'auth_cred_a';
const RES_CRED_KEY = 'auth_cred_r';
const BRUTE_FORCE_KEY = 'login_attempts';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    const validated = validateToken(token);
    if (validated) {
      setUser(validated);
    }
    setLoading(false);
  }, []);

  const login = async (username, password, role) => {
    const key = role === 'admin' ? ADMIN_CRED_KEY : RES_CRED_KEY;
    const stored = JSON.parse(localStorage.getItem(key));

    // Brute force check
    const attempts = JSON.parse(localStorage.getItem(BRUTE_FORCE_KEY) || '{}');
    const roleAttempts = attempts[role] || { count: 0, lastAttempt: 0 };

    if (roleAttempts.count >= 5 && Date.now() - roleAttempts.lastAttempt < 15 * 60 * 1000) {
      throw new Error('Account locked. Please try again in 15 minutes.');
    }

    if (!stored || stored.username !== username || !(await comparePassword(password, stored.password))) {
      const newCount = (roleAttempts.count || 0) + 1;
      attempts[role] = { count: newCount, lastAttempt: Date.now() };
      localStorage.setItem(BRUTE_FORCE_KEY, JSON.stringify(attempts));
      
      let errorMsg = 'Invalid credentials.';
      if (newCount >= 3) errorMsg += ` Warning: ${5 - newCount} attempts remaining before lockout.`;
      throw new Error(errorMsg);
    }

    // Success
    attempts[role] = { count: 0, lastAttempt: 0 };
    localStorage.setItem(BRUTE_FORCE_KEY, JSON.stringify(attempts));

    const token = generateToken(role);
    sessionStorage.setItem('token', token);
    const validated = validateToken(token);
    setUser(validated);

    // Audit log
    const auditLog = JSON.parse(localStorage.getItem('security_audit') || '[]');
    auditLog.push({
      timestamp: new Date().toISOString(),
      role,
      username,
      ip: '192.168.' + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255),
      action: 'LOGIN_SUCCESS'
    });
    localStorage.setItem('security_audit', JSON.stringify(auditLog.slice(-100)));

    return validated;
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
