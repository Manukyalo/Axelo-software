import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword, signOut as fbSignOut, onAuthStateChanged } from 'firebase/auth';
import { checkRateLimit } from '../utils/rateLimit';
import { logger } from '../utils/logger';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🔗 Permanent Server Synchronization Webhook
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@easternvacations.com';
        
        // Strict mapping attribution since firestore roles aren't deployed yet
        const role = firebaseUser.email === adminEmail ? 'admin' : 'res_agent';

        setUser({
          id: firebaseUser.uid,
          username: firebaseUser.email,
          role: role,
          emailVerified: firebaseUser.emailVerified
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);

  const login = async (username, password, role) => {
    // 🥶 LOCAL OVERLAY: Prevent excessive API calls to Google Identity servers
    checkRateLimit('login_attempt', 50, 5 * 60 * 1000);

    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@easternvacations.com';
    const resEmail = import.meta.env.VITE_RES_EMAIL || 'reservations@easternvacations.com';

    // UI Tab Restrictors
    if (role === 'admin' && username !== adminEmail) {
       logger.warn('UI Traversal Blocked', { username, targetRole: role });
       throw new Error('Please log in via the Agent Reservations portal.');
    }
    if (role === 'res_agent' && username !== resEmail && username !== 'reservations@toursco') {
       logger.warn('UI Traversal Blocked', { username, targetRole: role });
       throw new Error('Please log in via the Administrative portal.');
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, username, password);
      logger.info('Firebase Authentication Signature Issued', { username, uid: userCredential.user.uid });
      return userCredential.user;
    } catch (error) {
      logger.security('Firebase Auth Rejection', { username, code: error.code });
      
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        throw new Error('Invalid username or password');
      }
      if (error.code === 'auth/too-many-requests') {
        throw new Error('Account temporarily locked by Google for security. Please try again later.');
      }
      throw new Error(error.message);
    }
  };

  const logout = async () => {
    try {
       await fbSignOut(auth);
       logger.info('Firebase Session Safely Terminated');
    } catch (err) {
       logger.error('Logout Exception', { message: err.message });
    }
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
