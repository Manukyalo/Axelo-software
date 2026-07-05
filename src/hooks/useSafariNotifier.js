import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { isWithinInterval, addDays, startOfDay, parseISO } from 'date-fns';
import { logger } from '../utils/logger';

export const useSafariNotifier = () => {
  const { user } = useAuth();
  const { state } = useData();

  useEffect(() => {
    // Only run for authenticated Admins and Reservations Agents
    if (!user || (user.role !== 'admin' && user.role !== 'agent')) return;
    
    // Ensure we have loaded the bookings data
    if (!state?.bookings || state.bookings.length === 0) return;

    const checkUpcomingSafaris = async () => {
      try {
        // Anti-spam check: Only notify once per day per user
        const todayStr = new Date().toISOString().split('T')[0];
        const storageKey = `lastSafariReminderDate_${user.uid}`;
        const lastRun = localStorage.getItem(storageKey);
        
        if (lastRun === todayStr) {
          return; // Already notified today
        }

        const today = startOfDay(new Date());
        const oneWeekFromNow = addDays(today, 7);

        // Filter bookings departing within the next 7 days
        const upcomingSafaris = state.bookings.filter(b => {
          if (!b.date || b.status === 'Cancelled' || b.status === 'Completed') return false;
          try {
            const tripDate = startOfDay(parseISO(b.date));
            return isWithinInterval(tripDate, { start: today, end: oneWeekFromNow });
          } catch (e) {
            return false;
          }
        });

        if (upcomingSafaris.length > 0) {
          // Check if Notification API is supported and permitted
          if (!("Notification" in window)) return;

          let permission = Notification.permission;
          if (permission === 'default') {
            permission = await Notification.requestPermission();
          }

          if (permission === 'granted') {
            // Use Service Worker for professional native push notification if available
            if ('serviceWorker' in navigator) {
              const registration = await navigator.serviceWorker.ready;
              
              if (registration) {
                registration.showNotification("AI Task Manager: Safari Alert", {
                  body: `Reminder: You have ${upcomingSafaris.length} safari(s) departing in the next 7 days.`,
                  icon: "/logo.png",
                  badge: "/logo.png",
                  tag: "upcoming-safari-reminder", // Prevents duplicate stacking
                  data: {
                    url: user.role === 'admin' ? '/admin/upcoming-safaris' : '/reservations/upcoming-safaris'
                  }
                });
                
                // Mark as notified today
                localStorage.setItem(storageKey, todayStr);
                logger.info(`AI Task Manager sent push notification for ${upcomingSafaris.length} upcoming safaris.`);
              }
            } else {
              // Fallback to standard Notification if Service Worker isn't registered
              new Notification("AI Task Manager: Safari Alert", {
                body: `Reminder: You have ${upcomingSafaris.length} safari(s) departing in the next 7 days.`,
                icon: "/logo.png",
                tag: "upcoming-safari-reminder"
              });
              localStorage.setItem(storageKey, todayStr);
            }
          }
        }
      } catch (err) {
        logger.error('Error running AI Task Manager Safari Notifier', { error: err.message });
      }
    };

    // Delay slightly to not freeze initial UI render
    const timeout = setTimeout(() => {
      checkUpcomingSafaris();
    }, 8000);

    return () => clearTimeout(timeout);
  }, [user, state?.bookings]);
};
