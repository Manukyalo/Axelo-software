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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch custom claims to get the role assigned by the backend
        const tokenResult = await firebaseUser.getIdTokenResult(true);
        const role = tokenResult.claims.role || 'agent'; // Default to agent if no role set

        setUser({
          uid: firebaseUser.uid, // Using uid consistently
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
    
    // 🛡️ Token Auto-Refresh Logic: Prevent 400 status on Identity Toolkit
    const refreshIdToken = async () => {
      if (auth.currentUser) {
        try {
          await auth.currentUser.getIdToken(true);
          logger.info('Firebase ID Token Silently Refreshed');
        } catch (err) {
          logger.error('Token Refresh Failure', { message: err.message });
        }
      }
    };

    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') refreshIdToken();
    });
    window.addEventListener('focus', refreshIdToken);
    
    return () => {
      unsubscribe();
      window.removeEventListener('visibilitychange', refreshIdToken);
      window.removeEventListener('focus', refreshIdToken);
    };
  }, []);

  const login = async (username, password, role) => {
    // 🥶 LOCAL OVERLAY: Prevent excessive API calls to Google Identity servers
    checkRateLimit('login_attempt', 50, 5 * 60 * 1000);

    // UI checks are now handled dynamically via ProtectedRoute and Custom Claims.
    // The login function should focus on authentication signature issuance.

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
