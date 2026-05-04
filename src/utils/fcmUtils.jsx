import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, app } from '../config/firebase';
import toast from 'react-hot-toast';

const messaging = getMessaging(app);

// IMPORTANT: User must generate this in Firebase Console -> Project Settings -> Cloud Messaging -> Web Push certificates
const VAPID_KEY = "BAOYsoC2HenhZyfDLlqYSMG_izVmAOaHoisRTuI9PaZTjqEukuOHnkxt5yahdJrV_pKLJCuV92MNgGZ3nP_DigQ"; // Placeholder - user needs to replace this for production

export const requestFirebaseToken = async (userId) => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      if (token) {
        console.log('FCM Token:', token);
        // Save token to Firestore for the current user
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          fcmTokens: arrayUnion(token),
          notificationsEnabled: true,
          updatedAt: new Date().toISOString()
        });
        return token;
      }
    } else {
      console.log('Notification permission denied');
    }
  } catch (error) {
    console.error('Error requesting FCM token:', error);
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log('Foreground Message received:', payload);
      toast((t) => (
        <div className="flex flex-col gap-1">
          <p className="font-bold text-sm text-safari-primary">{payload.notification.title}</p>
          <p className="text-xs text-gray-500">{payload.notification.body}</p>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="text-[10px] font-bold text-safari-gold uppercase mt-1 self-end"
          >
            Dismiss
          </button>
        </div>
      ), {
        icon: '🔔',
        duration: 6000,
        position: 'top-right'
      });
      resolve(payload);
    });
  });
export const sendTestNotification = async () => {
  if (!("Notification" in window)) {
    toast.error("This browser does not support desktop notifications");
    return;
  }

  if (Notification.permission === "granted") {
    new Notification("Eastern Vacations System", {
      body: "This is a test notification. System status is healthy! 🦁",
      icon: "/safari-favicon.png" // Assuming this exists or using a fallback
    });
    toast.success("Test notification sent!");
  } else if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      new Notification("Eastern Vacations System", {
        body: "Permissions granted! You will now receive system alerts.",
        icon: "/safari-favicon.png"
      });
      toast.success("Permissions granted and test sent!");
    }
  } else {
    toast.error("Notification permissions are blocked. Please enable them in browser settings.");
  }
};
