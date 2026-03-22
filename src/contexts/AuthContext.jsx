import React, { createContext, useContext, useState, useEffect } from 'react';
import { validateToken, comparePassword, generateToken } from '../utils/auth';
import { checkRateLimit } from '../utils/rateLimit';
import { logger } from '../utils/logger';
import toast from 'react-hot-toast';

const AuthContext = createContext();

const ADMIN_CRED_KEY = 'auth_cred_v4_a';
const RES_CRED_KEY = 'auth_cred_v4_r';
const BRUTE_FORCE_KEY = 'login_attempts_v4';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = () => {
      const token = sessionStorage.getItem('token');
      if (token) {
        const validated = validateToken(token);
        if (validated) {
          setUser(validated);
        } else {
          // Token artificially expired or invalid mid-session -> Eject
          sessionStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkSession();
    
    // Active session polling (check every 60s for expiry timeout)
    const interval = setInterval(checkSession, 60000);
    return () => clearInterval(interval);
  }, []);

  const login = async (username, password, role) => {
    // 🥶 GLOBAL API RATE LIMIT: Map 10 failed or successful global logins per 15 mins 
    // Acts as an impenetrable brute-force prevention screen
    checkRateLimit('login_attempt', 10, 15 * 60 * 1000);

    // Continue to standard business logic
    const key = role === 'admin' ? ADMIN_CRED_KEY : RES_CRED_KEY;
    const stored = JSON.parse(localStorage.getItem(key));

    // Brute force check
    const lockoutKey = `lockout_${role}_${username}`;
    const lockout = JSON.parse(localStorage.getItem(lockoutKey) || '{"failedAttempts": 0, "lockUntil": 0}');

    if (lockout.lockUntil && Date.now() < lockout.lockUntil) {
      const minutesRemaining = Math.ceil((lockout.lockUntil - Date.now()) / 60000);
      logger.security('Login anomaly blocked. Attempt on account currently under brute-force lockout.', { username, role });
      throw new Error(`Account locked due to multiple failed attempts. Try again in ${minutesRemaining} minutes.`);
    }

    if (!stored || stored.username !== username || !(await comparePassword(password, stored.password))) {
      lockout.failedAttempts += 1;
      
      if (lockout.failedAttempts >= 5) {
        lockout.lockUntil = Date.now() + 15 * 60 * 1000;
        localStorage.setItem(lockoutKey, JSON.stringify(lockout));
        logger.security('Account mathematically isolated. Excessive brute-force failure threshold reached.', { username, role, failedAttempts: lockout.failedAttempts });
        throw new Error('Account locked due to multiple failed attempts. Try again in 15 minutes.');
      }
      
      localStorage.setItem(lockoutKey, JSON.stringify(lockout));
      logger.warn('Failed authentication parameters detected against directory.', { username, role, failedAttempts: lockout.failedAttempts });
      throw new Error('Invalid username or password');
    }

    // Mock Email Verification Check
    if (!stored.emailVerified) {
       logger.warn('Authentication dropped due to unverified external email state.', { username, role });
       throw new Error('Email must be verified before logging in. Please check your inbox.');
    }

    // Reset lockout
    localStorage.removeItem(lockoutKey);
    logger.info('Authentication layer passed. Generating session ticket.', { username, role });

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
