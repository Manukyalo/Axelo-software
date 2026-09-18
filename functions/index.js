const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const axios = require("axios");
const { format, differenceInDays, parseISO, startOfDay, addDays } = require("date-fns");

admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();
const messaging = admin.messaging();

/**
 * RBAC: Sets custom claims for a user (admin/agent/driver)
 */
exports.setRole = onCall(
  {
    memory: "256MiB",
  },
  async (request) => {
    // Only existing admins can set roles
    if (!request.auth || request.auth.token.role !== 'admin') {
      // Emergency bootstrap: allow first admin to be set if email matches hardcoded list
      const allowedAdmins = [
        'admin@easternvacations.com',
        'manu@easternvacations.com',
        'reservations@easternvacations.com',
        'emmanuelkyalo91@gmail.com',
        'manukyalo341@gmail.com'
      ];
      const userEmail = (request.auth.token.email || '').toLowerCase();
      if (!request.auth || !allowedAdmins.includes(userEmail)) {
        throw new HttpsError("permission-denied", "Only administrators can assign roles.");
      }
    }

    const { uid, role } = request.data;
    if (!uid || !['admin', 'agent', 'driver'].includes(role)) {
      throw new HttpsError("invalid-argument", "Valid UID and role (admin/agent/driver) are required.");
    }

    try {
      await auth.setCustomUserClaims(uid, { role });
      console.log(`Role '${role}' assigned to user ${uid}`);
      
      // Update user document for visibility in UI
      await db.collection("users").doc(uid).set({ role }, { merge: true });
      
      return { success: true, message: `Role '${role}' assigned successfully.` };
    } catch (err) {
      console.error("Error setting custom claims:", err);
      throw new HttpsError("internal", err.message);
    }
  }
);

// Helper for mapping WMO weather codes (Open-Meteo)
function getWeatherLabel(code) {
  if (code === 0) return "Clear Sky";
  if ([1, 2, 3].includes(code)) return "Partly Cloudy";
  if ([45, 48].includes(code)) return "Foggy";
  if ([51, 53, 55].includes(code)) return "Drizzling";
  if ([61, 63, 65].includes(code)) return "Raining";
  if ([80, 81, 82].includes(code)) return "Rain Showers";
  if (code === 95) return "Thunderstorm";
  if ([96, 99].includes(code)) return "Heavy Thunderstorm";
  return "Cloudy";
}

function wmoToIcon(code) {
  const c = Number(code);
  if (c === 0) return "01d";
  if ([1, 2, 3].includes(c)) return "02d";
  if ([45, 48].includes(c)) return "50d";
  if ([51, 53, 55].includes(c)) return "09d";
  if ([61, 63, 65, 80, 81, 82].includes(c)) return "10d";
  if ([71, 73, 75, 77, 85, 86].includes(c)) return "13d";
  if (c >= 95) return "11d";
  return "02d";
}

function getSeasonBadge(month) {
  // month = 0-11
  if ([6, 7, 8].includes(month)) return { label: "Peak Dry Season", type: "success" };
  if ([2, 3, 4].includes(month)) return { label: "Long Rains", type: "info" };
  if ([9, 10].includes(month)) return { label: "Short Rains", type: "info" };
  return { label: "Dry Season", type: "warning" };
}

/**
 * Deterministic Safari Advisory Decision Engine
 * Evaluates real-time weather metrics into actionable safari advisories.
 */
function generateSafariIntelligence(weatherData, parkName) {
  const { temp_c, wind_kph, humidity, precipitation_mm, weather_code, condition } = weatherData;
  const alerts = [];
  let status = "Ideal";
  let advisory = "";

  const c = Number(weather_code);
  const isThunderstorm = (c >= 95 && c <= 99) || (c >= 200 && c < 300);
  const isDrizzle = [51, 53, 55].includes(c) || (c >= 300 && c < 400);
  const isRain = [61, 63, 65, 80, 81, 82].includes(c) || (c >= 500 && c < 600);
  const isFog = [45, 48].includes(c) || (c >= 700 && c < 800);
  const isClear = c === 0 || c === 800;
  const isCloudy = [1, 2, 3].includes(c) || c > 800;

  if (isThunderstorm || precipitation_mm > 15 || wind_kph > 45 || temp_c > 37) {
    status = "Caution";
    if (isThunderstorm) {
      alerts.push("Thunderstorm activity detected. Avoid open plains and river crossings; keep pop-up roofs lowered.");
    }
    if (precipitation_mm > 15 || isRain) {
      alerts.push("Heavy rains make black-cotton soil tracks slick. 4x4 vehicles with diff-lock and recovery gear mandatory.");
    }
    if (wind_kph > 45) {
      alerts.push(`High wind gusts (${Math.round(wind_kph)} km/h). Animal sightings in high canopy will be scarce.`);
    }
    if (temp_c > 37) {
      alerts.push(`Extreme ambient heat (${Math.round(temp_c)}°C). Ensure guest hydration and avoid midday transfers.`);
    }
  } else if (isRain || isDrizzle || isFog || wind_kph > 28 || temp_c > 32 || temp_c < 12) {
    status = "Fair";
    if (isRain || isDrizzle) {
      alerts.push("Intermittent showers in park sectors. Enclosed 4x4 cruisers with covered pop-up roofs recommended.");
    }
    if (isFog) {
      alerts.push("Low morning visibility across valleys. Maintain safe convoy distance and engage fog lamps.");
    }
    if (temp_c > 32) {
      alerts.push("Warm afternoon temperatures. Wildlife concentrating near rivers, marshes, and shady acacia thickets.");
    }
    if (temp_c < 12) {
      alerts.push("Chilly highland morning conditions. Advise warm layered clothing for early sunrise game drives.");
    }
  } else {
    status = "Ideal";
  }

  if (status === "Caution") {
    advisory = `Adverse conditions in ${parkName} with ${condition.toLowerCase()}. Restrict game drives to graded main circuits and coordinate with park rangers.`;
  } else if (status === "Fair") {
    if (isRain || isDrizzle) {
      advisory = `Overcast skies and light rain in ${parkName}. Soft diffused lighting favors predator portraiture; focus on riverbanks and permanent waterholes.`;
    } else if (temp_c > 32) {
      advisory = `Warm conditions in ${parkName}. Prime game activity during early morning and late afternoon; animals resting in thickets during peak sun.`;
    } else {
      advisory = `Moderate weather in ${parkName}. Standard game-drive operations underway with favorable sightings across grassland corridors.`;
    }
  } else {
    if (isClear) {
      advisory = `Exceptional safari conditions in ${parkName} with clear skies and excellent visibility. Prime lighting for high-speed photography across open savannahs.`;
    } else if (isCloudy) {
      advisory = `Optimal safari weather in ${parkName}. Gentle cloud cover provides pleasant temperatures for extended big-cat tracking and birding excursions.`;
    } else {
      advisory = `Prime conditions across ${parkName}. Wildlife dispersed across active grazing routes; pop-up roof viewing recommended throughout all sectors.`;
    }
  }

  return { status, advisory, alerts };
}

/**
 * weatherSync triggers every 10 minutes to fetch current conditions and evaluates alerts
 */
const PARKS = [
  { name: "Aberdare", id: "aberdare", lat: -0.3167, lon: 36.6333 },
  { name: "Amboseli", id: "amboseli", lat: -2.6527, lon: 37.2606 },
  { name: "Lake Nakuru", id: "lake_nakuru", lat: -0.3667, lon: 36.0833 },
  { name: "Maasai Mara", id: "maasai_mara", lat: -1.5031, lon: 35.1431 },
  { name: "Meru", id: "meru", lat: 0.1833, lon: 38.2000 },
  { name: "Mount Kenya", id: "mount_kenya", lat: -0.1511, lon: 37.3084 },
  { name: "Nairobi", id: "nairobi", lat: -1.3725, lon: 36.8533 },
  { name: "Samburu", id: "samburu", lat: 0.6358, lon: 37.5458 },
  { name: "Tsavo East", id: "tsavo_east", lat: -2.7758, lon: 38.6833 },
  { name: "Tsavo West", id: "tsavo_west", lat: -3.2333, lon: 37.9500 }
];

/**
 * Core Weather Sync Logic using Open-Meteo API & Safari Decision Engine
 */
async function performWeatherSync(parkList) {
  console.log(`--- 🌦️ Weather Intelligence Sync Started (${parkList.length} parks via Open-Meteo) ---`);
  
  for (const park of parkList) {
    try {
      console.log(`Syncing ${park.name} via Open-Meteo...`);
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${park.lat}&longitude=${park.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max&timezone=Africa%2FNairobi&forecast_days=7`;
      const response = await axios.get(url);
      const current = response.data.current || {};
      const weather_code = current.weather_code ?? 0;
      const condition = getWeatherLabel(weather_code);
      const icon = wmoToIcon(weather_code);
      const uvVal = current.uv_index !== undefined && current.uv_index !== null ? Math.round(current.uv_index) : "—";

      const weatherData = {
        temp_c: current.temperature_2m ?? 0,
        feels_like_c: current.apparent_temperature ?? current.temperature_2m ?? 0,
        humidity: current.relative_humidity_2m ?? 0,
        condition,
        wind_kph: current.wind_speed_10m ?? 0,
        precipitation_mm: current.precipitation ?? 0,
        weather_code,
        uv_index: uvVal,
        current: {
          temp: current.temperature_2m ?? 0,
          feels_like: current.apparent_temperature ?? current.temperature_2m ?? 0,
          humidity: current.relative_humidity_2m ?? 0,
          description: condition,
          windSpeed: current.wind_speed_10m ?? 0,
          icon,
          code: weather_code,
          uvIndex: uvVal
        }
      };

      const dailyForecast = (response.data.daily?.time || []).map((date, i) => {
        const code = response.data.daily?.weather_code?.[i] ?? 0;
        return {
          date,
          max: Math.round(response.data.daily?.temperature_2m_max?.[i] ?? 0),
          min: Math.round(response.data.daily?.temperature_2m_min?.[i] ?? 0),
          condition: getWeatherLabel(code),
          icon: wmoToIcon(code),
          code,
          pop: response.data.daily?.precipitation_probability_max?.[i] || 0
        };
      });

      // Evaluate heuristic safari advisory
      const intel = generateSafariIntelligence(weatherData, park.name);

      const weatherIntelligenceDoc = {
        parkId: park.id,
        parkName: park.name,
        ...weatherData,
        advisory: intel.advisory,
        status: intel.status,
        alerts: intel.alerts || [],
        forecast: dailyForecast,
        lastUpdated: admin.firestore.Timestamp.now(),
        season: getSeasonBadge(new Date().getMonth()),
        source: "Open-Meteo"
      };

      await db.collection("weather_intelligence").doc(park.id).set(weatherIntelligenceDoc);

      await db.collection("weatherData").doc(park.id).set({
        parkName: park.name,
        temp: weatherData.temp_c,
        condition: weatherData.condition,
        updatedAt: admin.firestore.Timestamp.now(),
      }, { merge: true });

    } catch (err) {
      console.error(`Failed to sync ${park.name}:`, err.message);
    }
  }

  await db.collection("weather_sync_stats").doc("latest").set({
    lastSync: admin.firestore.Timestamp.now(),
    status: "success",
    engine: "Open-Meteo API + Safari Decision Engine"
  });

  console.log("--- 🌥️ Weather Intelligence Sync Completed via Open-Meteo ---");
}

/**
 * Scheduled background sync (Every 3 hours)
 */
exports.weatherSync = onSchedule(
  {
    schedule: "every 3 hours",
    timeZone: "Africa/Nairobi",
    memory: "1GiB",
    timeoutSeconds: 300,
  },
  async (event) => {
    await performWeatherSync(PARKS);
  }
);

/**
 * manualWeatherSync - Callable function to trigger a refresh from the dashboard
 */
exports.manualWeatherSync = onCall(
  {
    memory: "1GiB",
    timeoutSeconds: 300,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }

    try {
      console.log(`Manual weather sync triggered by ${request.auth.token.email}`);
      await performWeatherSync(PARKS);
      return { success: true, message: "Weather intelligence synchronized successfully." };
    } catch (err) {
      console.error("Manual sync failed:", err.message);
      throw new HttpsError("internal", err.message);
    }
  }
);


/**
 * weatherHistorySync triggers weekly to capture 12 months historical weather
 */
exports.weatherHistorySync = onSchedule(
    {
      schedule: "every monday 02:00",
      timeZone: "Africa/Nairobi",
      memory: "256MiB",
      timeoutSeconds: 300,
    },
    async (event) => {
        try {
            console.log("Starting weatherHistorySync...");
            const parksSnapshot = await db.collection("parks").get();
            const parks = [];
            parksSnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.latitude && data.longitude) {
                    parks.push({ id: doc.id, name: data.name, lat: data.latitude, lon: data.longitude });
                }
            });

            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            
            const oneYearAgo = new Date(today);
            oneYearAgo.setFullYear(today.getFullYear() - 1);

            const endStr = yesterday.toISOString().split('T')[0];
            const startStr = oneYearAgo.toISOString().split('T')[0];

            for (const park of parks) {
                try {
                    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${park.lat}&longitude=${park.lon}&start_date=${startStr}&end_date=${endStr}&daily=precipitation_sum,temperature_2m_max,temperature_2m_min&timezone=Africa%2FNairobi`;
                    const res = await axios.get(url);
                    const data = res.data;

                    // Aggregate into monthly averages
                    const monthlyAggregations = {};
                    // Pre-populate 12 months
                    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                    
                    data.daily.time.forEach((dateStr, i) => {
                        const date = new Date(dateStr);
                        const m = date.getMonth(); // 0-11
                        
                        if (!monthlyAggregations[m]) {
                             monthlyAggregations[m] = { month: monthNames[m], count: 0, sumRain: 0, sumHigh: 0, sumLow: 0 };
                        }
                        
                        const rain = data.daily.precipitation_sum[i] || 0;
                        const high = data.daily.temperature_2m_max[i] || 0;
                        const low = data.daily.temperature_2m_min[i] || 0;

                        monthlyAggregations[m].count++;
                        monthlyAggregations[m].sumRain += rain;
                        monthlyAggregations[m].sumHigh += high;
                        monthlyAggregations[m].sumLow += low;
                    });

                    // Format final payload
                    const monthsFinal = Object.keys(monthlyAggregations).sort((a,b)=>a-b).map(key => {
                        const m = monthlyAggregations[key];
                        return {
                            month: m.month,
                            avgRainfall: Math.round(m.sumRain / m.count),
                            avgHigh: Math.round(m.sumHigh / m.count),
                            avgLow: Math.round(m.sumLow / m.count)
                        }
                    });

                    await db.collection("weatherHistory").doc(park.id).set({
                        parkId: park.id,
                        months: monthsFinal,
                        updatedAt: admin.firestore.Timestamp.now()
                    });
                } catch(e) {
                     console.error(`Failed to fetch and aggregate history for park ${park.name}:`, e.message);
                }
            }

            console.log("weatherHistorySync completed.");
        } catch(error) {
            console.error("weatherHistorySync error:", error);
        }
    }
);

/**
 * 🤖 manualOperationsSweep - Callable function to trigger a refresh of operational intelligence
 */
exports.manualOperationsSweep = onCall(
  {
    memory: "1GiB",
    timeoutSeconds: 540,
  },
  async (request) => {
    if (!request.auth || request.auth.token.role !== 'admin') {
      throw new HttpsError("permission-denied", "Only administrators can trigger a manual sweep.");
    }

    try {
      console.log(`Manual operations sweep triggered by ${request.auth.token.email}`);
      
      // Extract the core sweep logic into a reusable function if needed, 
      // but for now we can just copy the logic or call a helper.
      // Since it's a small block, I'll just keep it direct or call the same logic.
      
      // For simplicity in this edit, I'll just expose the internal logic 
      // but let's make sure we don't duplicate too much.
      // I'll wrap the logic in a helper.
      
      await performOperationsSweep();
      
      return { success: true, message: "Operations sweep completed successfully." };
    } catch (err) {
      console.error("Manual sweep failed:", err.message);
      throw new HttpsError("internal", err.message);
    }
  }
);

async function performOperationsSweep() {
  const bookingsSnap = await db.collection("bookings").get();
  const vehiclesSnap = await db.collection("vehicles").get();
  const driversSnap = await db.collection("drivers").get();

  const bookings = bookingsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const vehicles = vehiclesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const drivers = driversSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  let alertsGenerated = 0;
  const today = startOfDay(new Date());

  // --- MODULE: Booking Reminders ---
  for (const b of bookings) {
    if (b.status !== 'Confirmed' && b.status !== 'Pending') continue;
    const departureDate = parseISO(b.date);
    const daysUntil = differenceInDays(departureDate, today);

    if (daysUntil === 7) {
      alertsGenerated += await createAIAlert({
        title: '7-Day Safari Reminder',
        message: `${b.clientName}'s safari to ${b.destinations || b.location} departs in 7 days.`,
        type: 'INFO',
        category: 'booking',
        entityId: b.id,
        entityType: 'booking',
        moduleSource: 'BookingReminders'
      });
    } else if (daysUntil === 3) {
      const issues = [];
      if (!b.driverId) issues.push('No driver assigned');
      if (!b.vehicleId) issues.push('No vehicle assigned');
      if (b.paymentStatus !== 'Fully Paid') issues.push('Payment incomplete');

      if (issues.length > 0) {
        alertsGenerated += await createAIAlert({
          title: `3-Day Departure Alert — ${b.clientName}`,
          message: `Safari departs in 3 days. Issues: ${issues.join(', ')}.`,
          type: 'HIGH',
          category: 'booking',
          entityId: b.id,
          entityType: 'booking',
          moduleSource: 'BookingReminders'
        });
      }
    } else if (daysUntil === 1) {
      alertsGenerated += await createAIAlert({
        title: `🚨 DEPARTURE TOMORROW — ${b.clientName}`,
        message: `Safari to ${b.destinations || b.location} departs tomorrow at ${b.timeOfPickup || 'TBD'}.`,
        type: 'CRITICAL',
        category: 'booking',
        entityId: b.id,
        entityType: 'booking',
        moduleSource: 'BookingReminders'
      });
    }
  }

  // --- MODULE: Insurance Watchdog ---
  for (const v of vehicles) {
    if (!v.insuranceExpiry) continue;
    const expiry = v.insuranceExpiry.toDate ? v.insuranceExpiry.toDate() : parseISO(v.insuranceExpiry);
    const daysUntil = differenceInDays(expiry, today);

    if (daysUntil <= 0) {
      alertsGenerated += await createAIAlert({
        title: `🚨 EXPIRED INSURANCE — ${v.plate}`,
        message: `Vehicle ${v.name} (${v.plate}) insurance EXPIRED on ${format(expiry, 'MMM dd')}.`,
        type: 'CRITICAL',
        category: 'vehicle',
        entityId: v.id,
        entityType: 'vehicle',
        moduleSource: 'InsuranceWatchdog',
        targetRole: 'admin'
      });
    } else if (daysUntil <= 7) {
      alertsGenerated += await createAIAlert({
        title: `Insurance Expiring Soon — ${v.plate}`,
        message: `Vehicle ${v.name} (${v.plate}) insurance expires in ${daysUntil} days.`,
        type: 'HIGH',
        category: 'vehicle',
        entityId: v.id,
        entityType: 'vehicle',
        moduleSource: 'InsuranceWatchdog',
        targetRole: 'admin'
      });
    }
  }

  await db.collection("aiLogs").add({
    timestamp: admin.firestore.Timestamp.now(),
    module: "Watchdog",
    message: `Sweep complete. ${alertsGenerated} alerts generated.`
  });

  return alertsGenerated;
}

/**
 * 🤖 Operations Watchdog: Scheduled intelligence sweep (Every 15 mins)
 */
exports.operationsWatchdog = onSchedule(
  {
    schedule: "every 15 minutes",
    timeZone: "Africa/Nairobi",
    memory: "1GiB",
    timeoutSeconds: 540,
  },
  async (event) => {
    console.log("🤖 Operations Watchdog: Sweep started...");
    try {
      const alertsGenerated = await performOperationsSweep();
      console.log(`✅ Intelligence sweep complete. Generated ${alertsGenerated} alerts.`);
    } catch (err) {
      console.error("❌ Operations Watchdog Error:", err);
    }
  }
);


/**
 * Utility: Deduplication and Alert Creation
 */
async function createAIAlert(alert) {
  const q = db.collection('aiAlerts')
    .where('entityId', '==', alert.entityId)
    .where('moduleSource', '==', alert.moduleSource)
    .where('resolved', '==', false)
    .where('createdAt', '>', admin.firestore.Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000));
  
  const snapshot = await q.get();
  if (!snapshot.empty) return 0;

  const alertData = {
    ...alert,
    createdAt: admin.firestore.Timestamp.now(),
    resolved: false,
    read: false
  };

  await db.collection('aiAlerts').add(alertData);

  // High priority notifications
  if (['CRITICAL', 'HIGH'].includes(alert.type)) {
    await db.collection('notifications').add({
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
