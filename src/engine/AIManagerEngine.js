import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp, 
  Timestamp,
  doc,
  setDoc,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { format, differenceInDays, parseISO, startOfDay, addDays } from 'date-fns';

class AIManagerEngine {
  constructor() {
    this.intervalId = null;
    this.isPaused = false;
    this.isRunning = false;
    this.engineId = 'primary_ai_engine';
    
    // Visibility listener to pause/resume
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.pause();
        } else {
          this.resume();
        }
      });
    }
  }

  async start(bookings, vehicles, drivers) {
    // Always update the live data references
    this.bookings = bookings;
    this.vehicles = vehicles;
    this.drivers = drivers;

    if (this.isRunning) return;
    
    if (!this.bookings || !this.vehicles || !this.drivers) {
      console.warn('🤖 AI Manager Engine: Data not ready, delaying start...');
      return;
    }
    this.isRunning = true;
    
    console.log('🤖 AI Manager Engine: Initializing logic loop...');
    await this.logActivity('Engine', 'Intelligence loop started');
    
    // Run immediately on start
    await this.runLoop();
    
    // Set 90s interval
    this.intervalId = setInterval(() => {
      if (!this.isPaused) {
        this.runLoop();
      }
    }, 90000);
  }

  pause() {
    this.isPaused = true;
    console.log('🤖 AI Manager Engine: Paused (tab hidden)');
  }

  resume() {
    this.isPaused = false;
    console.log('🤖 AI Manager Engine: Resumed');
  }

  async stop() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.isRunning = false;
    await this.logActivity('Engine', 'Intelligence loop terminated');
  }

  async runLoop() {
    if (!this.bookings || !this.vehicles || !this.drivers) return;
    try {
      const startTime = Date.now();
      const aiStateRef = doc(db, 'aiState', this.engineId);
      
      // Update state: next scan in 90s
      await setDoc(aiStateRef, {
        lastScanTime: serverTimestamp(),
        nextScanTime: Timestamp.fromMillis(startTime + 90000),
        status: 'ACTIVE'
      }, { merge: true });

      // Run Modules
      let alertsGenerated = 0;
      
      alertsGenerated += await this.runBookingReminders();
      alertsGenerated += await this.runForgottenBookingDetector();
      alertsGenerated += await this.runInsuranceWatchdog();
      alertsGenerated += await this.runCapacityPlanner();
      alertsGenerated += await this.runDailyBriefing();
      alertsGenerated += await this.runParkFeeWatchdog();

      await this.logActivity('Loop', `Scan complete. ${alertsGenerated} new alerts generated.`);
    } catch (err) {
      console.error('❌ AI Engine Loop Error:', err);
      await this.logActivity('Error', err.message);
    }
  }

  // --- Utility: Deduplication & Logging ---

  async isDuplicate(entityId, moduleSource, type) {
    const q = query(
      collection(db, 'aiAlerts'),
      where('entityId', '==', entityId),
      where('moduleSource', '==', moduleSource),
      where('type', '==', type),
      where('resolved', '==', false),
      where('createdAt', '>', Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000))
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  }

  async createAlert(alert) {
    const isDup = await this.isDuplicate(alert.entityId, alert.moduleSource, alert.type);
    if (isDup) return 0;

    const alertData = {
      ...alert,
      createdAt: serverTimestamp(),
      read: false,
      resolved: false,
      dismissed: false
    };

    await addDoc(collection(db, 'aiAlerts'), alertData);
    
    // Also write to generic notifications if high priority
    if (alert.type === 'CRITICAL' || alert.type === 'HIGH' || alert.type === 'INSIGHT') {
      await addDoc(collection(db, 'notifications'), {
        title: alert.title,
        message: alert.message,
        date: new Date().toISOString(),
        read: false,
        type: alert.type,
        targetRole: alert.targetRole || 'both'
      });
    }

    return 1;
  }

  async logActivity(module, message) {
    await addDoc(collection(db, 'aiLogs'), {
      timestamp: serverTimestamp(),
      module,
      message
    });
  }

  // --- Engine Modules ---

  async runBookingReminders() {
    let count = 0;
    const today = startOfDay(new Date());

    for (const b of this.bookings) {
      if (b.status !== 'Confirmed' && b.status !== 'Pending') continue;
      
      const departureDate = parseISO(b.date);
      const daysUntil = differenceInDays(departureDate, today);

      if (daysUntil === 7) {
        count += await this.createAlert({
          title: '7-Day Safari Reminder',
          message: `${b.clientName}'s safari to ${b.destinations || b.location} departs in 7 days on ${b.date}.`,
          type: 'INFO',
          category: 'booking',
          entityId: b.id,
          entityType: 'booking',
          recommendedAction: 'Confirm driver and vehicle assignment',
          moduleSource: 'BookingReminders',
          targetRole: 'both'
        });
      } else if (daysUntil === 3) {
        const issues = [];
        if (!b.driverId) issues.push('No driver assigned');
        if (!b.vehicleId) issues.push('No vehicle assigned');
        if (b.paymentStatus !== 'Fully Paid') issues.push('Payment incomplete');

        if (issues.length > 0) {
          count += await this.createAlert({
            title: `3-Day Departure Alert — ${b.clientName}`,
            message: `Safari departs in 3 days. Issues found: ${issues.join(', ')}.`,
            type: 'HIGH',
            category: 'booking',
            entityId: b.id,
            entityType: 'booking',
            recommendedAction: 'Resolve all flagged items immediately',
            moduleSource: 'BookingReminders',
            targetRole: 'both'
          });
        }
      } else if (daysUntil === 1 || (daysUntil < 1 && daysUntil > 0)) {
        count += await this.createAlert({
          title: `🚨 DEPARTURE TOMORROW — ${b.clientName}`,
          message: `Safari to ${b.destinations || b.location} departs tomorrow at ${b.timeOfPickup || 'TBD'}. Map: ${b.location}.`,
          type: 'CRITICAL',
          category: 'booking',
          entityId: b.id,
          entityType: 'booking',
          recommendedAction: 'Final confirmation required immediately',
          moduleSource: 'BookingReminders',
          targetRole: 'both'
        });
      } else if (daysUntil <= 0 && b.status !== 'Completed' && b.status !== 'Cancelled') {
        count += await this.createAlert({
          title: `⚠ Overdue Booking — ${b.clientName}`,
          message: `This safari was scheduled for ${b.date} and is not marked complete.`,
          type: 'CRITICAL',
          category: 'booking',
          entityId: b.id,
          entityType: 'booking',
          recommendedAction: 'Update booking status to Completed or Cancelled',
          moduleSource: 'BookingReminders',
          targetRole: 'admin'
        });
      }
    }
    return count;
  }

  async runForgottenBookingDetector() {
    let count = 0;
    const now = Date.now();

    for (const b of this.bookings) {
      // Logic for stale pending bookings
      // Note: We'd need a createdAt timestamp on the booking object for full accuracy
      // For now, we'll assume most have one or skip if missing.
      
      if (b.status === 'Pending' && !b.driverId && differenceInDays(parseISO(b.date), now) <= 5) {
        count += await this.createAlert({
          title: 'No Driver Assigned — Departure Soon',
          message: `${b.clientName} departs in ${differenceInDays(parseISO(b.date), now)} days with no driver assigned.`,
          type: 'HIGH',
          category: 'booking',
          entityId: b.id,
          entityType: 'booking',
          recommendedAction: 'Assign a driver immediately from the Drivers module',
          moduleSource: 'ForgottenBookingDetector',
          targetRole: 'both'
        });
      }
      
      if (b.paymentStatus === 'Unpaid' && differenceInDays(parseISO(b.date), now) <= 7) {
        count += await this.createAlert({
          title: 'Unpaid Booking — Departure Approaching',
          message: `${b.clientName}'s safari departs in ${differenceInDays(parseISO(b.date), now)} days with no payment recorded.`,
          type: 'MEDIUM',
          category: 'booking',
          entityId: b.id,
          entityType: 'booking',
          recommendedAction: 'Contact client to collect payment or deposit',
          moduleSource: 'ForgottenBookingDetector',
          targetRole: 'both'
        });
      }
    }
    return count;
  }

  async runInsuranceWatchdog() {
    let count = 0;
    const today = new Date();

    for (const v of this.vehicles) {
      let expiry;
      if (v.insuranceExpiry?.seconds) {
        expiry = v.insuranceExpiry.toDate();
      } else {
        expiry = parseISO(v.insuranceExpiry);
      }
      
      const daysUntil = differenceInDays(expiry, today);

      if (daysUntil <= 0) {
        count += await this.createAlert({
          title: `🚨 EXPIRED INSURANCE — ${v.plate}`,
          message: `Vehicle ${v.name} (${v.plate}) insurance EXPIRED on ${format(expiry, 'MMM dd')}. Provider: ${v.insuranceProvider}.`,
          type: 'CRITICAL',
          category: 'vehicle',
          entityId: v.id,
          entityType: 'vehicle',
          recommendedAction: 'Immediately ground this vehicle and renew insurance.',
          moduleSource: 'InsuranceWatchdog',
          targetRole: 'admin'
        });
      } else if (daysUntil <= 7) {
        count += await this.createAlert({
          title: `Insurance Expiring in ${daysUntil} Days — ${v.plate}`,
          message: `Vehicle ${v.name} (${v.plate}) insurance expires in ${daysUntil} days.`,
          type: 'CRITICAL',
          category: 'vehicle',
          entityId: v.id,
          entityType: 'vehicle',
          recommendedAction: 'Renew immediately to avoid grounding.',
          moduleSource: 'InsuranceWatchdog',
          targetRole: 'admin'
        });
      } else if (daysUntil <= 30) {
        count += await this.createAlert({
          title: `Insurance Renewal Due Soon — ${v.plate}`,
          message: `Vehicle ${v.name} (${v.plate}) insurance expires in ${daysUntil} days.`,
          type: 'MEDIUM',
          category: 'vehicle',
          entityId: v.id,
          entityType: 'vehicle',
          recommendedAction: 'Begin insurance renewal process.',
          moduleSource: 'InsuranceWatchdog',
          targetRole: 'admin'
        });
      }
    }
    return count;
  }

  async runCapacityPlanner() {
    // Only run once a day
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const aiStateRef = doc(db, 'aiState', this.engineId);
    const snap = await getDoc(aiStateRef);
    if (snap.exists() && snap.data().dailyBriefingDate === todayStr) return 0;

    let count = 0;
    const activeVehicles = this.vehicles.filter(v => v.status === 'Active').length;
    const availableDrivers = this.drivers.filter(d => d.status === 'Available' || d.status === 'On Trip').length;

    // Check next 30 days
    for (let i = 0; i < 30; i++) {
        const checkDate = addDays(new Date(), i);
        const dateStr = format(checkDate, 'yyyy-MM-dd');
        const dayBookings = this.bookings.filter(b => b.date === dateStr).length;

        if (dayBookings > activeVehicles) {
          count += await this.createAlert({
            title: `Vehicle Shortage Risk — ${format(checkDate, 'MMM dd')}`,
            message: `${dayBookings} bookings scheduled but only ${activeVehicles} active vehicles available.`,
            type: 'HIGH',
            category: 'capacity',
            entityId: `cap-v-${dateStr}`,
            entityType: 'capacity',
            recommendedAction: 'Review fleet availability or reschedule bookings',
            moduleSource: 'CapacityPlanner',
            targetRole: 'admin'
          });
        }
    }
    return count;
  }

  async runDailyBriefing() {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const aiStateRef = doc(db, 'aiState', this.engineId);
    const snap = await getDoc(aiStateRef);
    
    // Check if briefing already sent today
    if (snap.exists() && snap.data().dailyBriefingDate === todayStr) return 0;

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    
    const todayBookings = this.bookings.filter(b => b.date === todayStr);
    const weekBookings = this.bookings.filter(b => {
      const d = parseISO(b.date);
      return isWithinInterval(d, { start: startOfDay(new Date()), end: addDays(new Date(), 7) });
    }).length;

    const criticalItems = [];
    // Simple checks for briefing
    if (this.vehicles.some(v => differenceInDays(parseISO(v.insuranceExpiry), new Date()) <= 0)) criticalItems.push('Expired insurance');
    if (this.bookings.some(b => !b.driverId && differenceInDays(parseISO(b.date), new Date()) <= 3)) criticalItems.push('Unassigned drivers for upcoming trips');

    let briefingText = `Good ${greeting}, Administrator. Here is your daily briefing.\n\n`;
    
    if (todayBookings.length > 0) {
      briefingText += `TODAY'S SAFARIS: ${todayBookings.length} departing today.\n`;
      todayBookings.forEach(b => {
        const dName = this.drivers.find(d => d.id === b.driverId)?.name || 'UNASSIGNED';
        const vPlate = this.vehicles.find(v => v.id === b.vehicleId)?.plate || 'UNASSIGNED';
        briefingText += `• ${b.clientName} at ${b.timeOfPickup || 'TBD'} to ${b.destinations || b.location} (Driver: ${dName}, Vehicle: ${vPlate})\n`;
      });
    } else {
      briefingText += `TODAY'S SAFARIS: No safaris scheduled for today.\n`;
    }

    briefingText += `\nTHIS WEEK: ${weekBookings} safaris departing this week.\n`;
    
    if (criticalItems.length > 0) {
      briefingText += `\nPENDING ATTENTION: ${criticalItems.join(', ')}.\n`;
    }

    const activeCount = this.vehicles.filter(v => v.status === 'Active').length;
    briefingText += `\nFLEET STATUS: ${activeCount} of ${this.vehicles.length} vehicles active.`;

    await this.createAlert({
      title: `Daily Intelligence Briefing — ${format(new Date(), 'MMM dd, yyyy')}`,
      message: briefingText,
      type: 'INSIGHT',
      category: 'revenue',
      entityId: `briefing-${todayStr}`,
      entityType: 'system',
      recommendedAction: 'Review the high-priority alerts generated today.',
      moduleSource: 'DailyBriefingEngine',
      targetRole: 'admin'
    });

    // Mark briefing as sent
    await setDoc(aiStateRef, { dailyBriefingDate: todayStr }, { merge: true });
    
    return 1;
  }

  async runParkFeeWatchdog() {
    let count = 0;
    const today = startOfDay(new Date());

    for (const b of this.bookings) {
      if (b.status !== 'Confirmed' && b.status !== 'Pending') continue;
      if (!b.itinerary || b.itinerary.length === 0) continue;

      let currentVisitDate = parseISO(b.date);

      for (const stop of b.itinerary) {
        const daysUntilVisit = differenceInDays(currentVisitDate, today);

        if (stop.parkFeeStatus !== 'Paid' && daysUntilVisit >= 0 && daysUntilVisit <= 2) {
          count += await this.createAlert({
            title: `Park Fee Reminder — ${stop.park || 'National Park'}`,
            message: `Park fees for ${b.clientName} at ${stop.park || 'the park'} are marked as ${stop.parkFeeStatus || 'Pending'}. Visit date: ${format(currentVisitDate, 'MMM dd')}.`,
            type: daysUntilVisit <= 1 ? 'CRITICAL' : 'HIGH',
            category: 'booking',
            entityId: `${b.id}-fee-${stop.park}`,
            entityType: 'booking',
            recommendedAction: 'Verify payment and update status in the Safari Details panel.',
            moduleSource: 'ParkFeeWatchdog',
            targetRole: 'admin'
          });
        }

        // Increment visit date for the next stop based on current stop nights
        currentVisitDate = addDays(currentVisitDate, stop.nights || 1);
      }
    }
    return count;
  }
}

export const aiEngine = new AIManagerEngine();
function isWithinInterval(date, interval) {
  return date >= interval.start && date <= interval.end;
}
