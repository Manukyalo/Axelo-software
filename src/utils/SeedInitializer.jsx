import { useEffect } from 'react';
import { hashPassword } from './auth';

const ADMIN_CRED_KEY = 'auth_cred_v4_a';
const RES_CRED_KEY = 'auth_cred_v4_r';

export const SeedInitializer = () => {
  useEffect(() => {
    const init = async () => {
      // Email Verification flags are forcibly embedded here
      if (!localStorage.getItem(ADMIN_CRED_KEY)) {
        const adminHash = await hashPassword(import.meta.env.VITE_ADMIN_DEFAULT_PWD || 'AdminFallback123');
        localStorage.setItem(ADMIN_CRED_KEY, JSON.stringify({
          username: import.meta.env.VITE_ADMIN_EMAIL || 'admin@easternvacations.com',
          password: adminHash,
          name: 'System Admin',
          emailVerified: true
        }));
      }

      if (!localStorage.getItem(RES_CRED_KEY)) {
        const resHash = await hashPassword(import.meta.env.VITE_RES_DEFAULT_PWD || 'ResFallback123');
        localStorage.setItem(RES_CRED_KEY, JSON.stringify({
          username: import.meta.env.VITE_RES_EMAIL || 'reservations@easternvacations.com',
          password: resHash,
          name: 'Reservations Agent',
          emailVerified: true
        }));
      }
    };
    init();
  }, []);

  return null;
};
