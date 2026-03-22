import { useEffect } from 'react';
import { auth } from '../config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export const SeedInitializer = () => {
  useEffect(() => {
    const initFirebaseUsers = async () => {
      const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@easternvacations.com';
      const adminPass = import.meta.env.VITE_ADMIN_DEFAULT_PWD || 'AdminFallback123';
      
      const resEmail = import.meta.env.VITE_RES_EMAIL || 'reservations@easternvacations.com';
      const resPass = import.meta.env.VITE_RES_DEFAULT_PWD || 'ResFallback123';

      try {
        // Blind Create Attempt: Will dynamically spawn the official corporate credentials into Firebase Auto-Auth Registry
        await createUserWithEmailAndPassword(auth, adminEmail, adminPass);
        console.log("Admin account freshly initialized on remote Firebase servers!");
      } catch (err) {
        // Swallow exception if already exists, else log structural fault
        if (err.code !== 'auth/email-already-in-use') {
            console.error("Admin Seed Exception: ", err.message);
        }
      }

      try {
        // Formulate Sub-Agent identity
        await createUserWithEmailAndPassword(auth, resEmail, resPass);
        console.log("Reservations account freshly initialized on remote Firebase servers!");
      } catch (err) {
        if (err.code !== 'auth/email-already-in-use') {
             console.error("Res Seed Exception: ", err.message);
        }
      }
    };

    initFirebaseUsers();
  }, []);

  return null;
};
