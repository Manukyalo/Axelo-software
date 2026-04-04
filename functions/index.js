const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { Anthropic } = require("@anthropic-ai/sdk");
const axios = require("axios");

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY || "dummy", // We will let the environment variable inject this from Firebase Secrets/Env
});

// Helper for mapping WMO weather codes, mirroring the PWA's logic
function getWeatherLabel(code) {
  if (code === 0) return "Clear Sky";
  if ([1, 2, 3].includes(code)) return "Partly Cloudy";
  if ([45, 48].includes(code)) return "Fog";
  if ([51, 53, 55].includes(code)) return "Drizzle";
  if ([61, 63, 65].includes(code)) return "Rain";
  if ([80, 81, 82].includes(code)) return "Rain Showers";
  if (code === 95) return "Thunderstorm";
  if ([96, 99].includes(code)) return "Heavy Thunderstorm";
  return "Unknown";
}

function getSeasonBadge(month) {
  // month = 0-11
  if ([6, 7, 8].includes(month)) return { label: "Peak Dry Season", type: "success" };
  if ([2, 3, 4].includes(month)) return { label: "Long Rains", type: "info" };
  if ([9, 10].includes(month)) return { label: "Short Rains", type: "info" };
  return { label: "Dry Season", type: "warning" };
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
 * weatherSync triggers every 3 hours to fetch OpenWeatherMap 3.0 data
 */
exports.weatherSync = onSchedule(
  {
    schedule: "every 3 hours",
    timeZone: "Africa/Nairobi",
    memory: "512MiB",
    timeoutSeconds: 300,
  },
  async (event) => {
    console.log("--- 🌥️ Weather Intelligence Sync Started (OWM) ---");
    const OPENWEATHER_API_KEY = "122ff9ebf4bcfbeb6e401bb09fa101c4";

    for (const park of PARKS) {
      try {
        console.log(`Syncing ${park.name}...`);
        const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${park.lat}&lon=${park.lon}&exclude=minutely,hourly&units=metric&appid=${OPENWEATHER_API_KEY}`;
        const response = await axios.get(url);
        const data = response.data;

        // Generate Safari Intelligence
        let advisory = "Perfect conditions for early morning and evening game drives. Standard precautions apply.";
        let status = "Ideal";
        const rainChance = data.daily[0].pop * 100;
        const condition = data.current.weather[0].main.toLowerCase();

        if (rainChance > 50 || condition.includes("rain") || condition.includes("storm")) {
          advisory = "Expect muddy tracks and reduced visibility. 4x4 vehicles mandatory. Heavy rain may impact river crossings.";
          status = "Caution";
        } else if (data.current.temp > 32) {
          advisory = "High temperatures detected. Wildlife likely congregating at permanent water sources. Carry extra fluids.";
          status = "Fair";
        }

        const weatherIntelligenceDoc = {
          parkId: park.id,
          parkName: park.name,
          current: {
            temp: data.current.temp,
            feelsLike: data.current.feels_like,
            humidity: data.current.humidity,
            condition: data.current.weather[0].main,
            description: data.current.weather[0].description,
            icon: data.current.weather[0].icon,
            windSpeed: data.current.wind_speed,
            uvIndex: data.current.uvi,
          },
          forecast: data.daily.slice(1, 8).map(d => ({
            date: new Date(d.dt * 1000).toISOString(),
            max: d.temp.max,
            min: d.temp.min,
            condition: d.weather[0].main,
            icon: d.weather[0].icon,
            pop: d.pop * 100
          })),
          advisory,
          status,
          lastUpdated: admin.firestore.Timestamp.now(),
          season: getSeasonBadge(new Date().getMonth())
        };

        await db.collection("weather_intelligence").doc(park.id).set(weatherIntelligenceDoc);

        // Map back to legacy weatherData structure for existing UI components
        await db.collection("weatherData").doc(park.id).set({
          parkName: park.name,
          temp: data.current.temp,
          condition: data.current.weather[0].main,
          updatedAt: admin.firestore.Timestamp.now(),
        }, { merge: true });

      } catch (err) {
        console.error(`Failed to sync ${park.name}:`, err.message);
      }
    }

    await db.collection("weather_sync_stats").doc("latest").set({
      lastSync: admin.firestore.Timestamp.now(),
      status: "success",
      engine: "OpenWeatherMap 3.0 One Call"
    });

    console.log("--- 🌥️ Weather Intelligence Sync Completed ---");
  }
);

/**
 * manualWeatherSync - Callable function to trigger a refresh from the dashboard
 */
exports.manualWeatherSync = onCall(
  {
    memory: "512MiB",
    timeoutSeconds: 300,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }

    try {
      console.log(`Manual weather sync triggered by ${request.auth.token.email}`);
      const OPENWEATHER_API_KEY = "122ff9ebf4bcfbeb6e401bb09fa101c4";

      for (const park of PARKS) {
        const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${park.lat}&lon=${park.lon}&exclude=minutely,hourly&units=metric&appid=${OPENWEATHER_API_KEY}`;
        const response = await axios.get(url);
        const data = response.data;

        let advisory = "Perfect conditions for early morning and evening game drives. Standard precautions apply.";
        let status = "Ideal";
        const rainChance = data.daily[0].pop * 100;
        const condition = data.current.weather[0].main.toLowerCase();

        if (rainChance > 50 || condition.includes("rain") || condition.includes("storm")) {
          advisory = "Expect muddy tracks and reduced visibility. 4x4 vehicles mandatory. Heavy rain may impact river crossings.";
          status = "Caution";
        } else if (data.current.temp > 32) {
          advisory = "High temperatures detected. Wildlife likely congregating at permanent water sources. Carry extra fluids.";
          status = "Fair";
        }

        const weatherIntelligenceDoc = {
          parkId: park.id,
          parkName: park.name,
          current: {
            temp: data.current.temp,
            feelsLike: data.current.feels_like,
            humidity: data.current.humidity,
            condition: data.current.weather[0].main,
            description: data.current.weather[0].description,
            icon: data.current.weather[0].icon,
            windSpeed: data.current.wind_speed,
            uvIndex: data.current.uvi,
          },
          forecast: data.daily.slice(1, 8).map(d => ({
            date: new Date(d.dt * 1000).toISOString(),
            max: d.temp.max,
            min: d.temp.min,
            condition: d.weather[0].main,
            icon: d.weather[0].icon,
            pop: d.pop * 100
          })),
          advisory,
          status,
          lastUpdated: admin.firestore.Timestamp.now(),
          season: getSeasonBadge(new Date().getMonth())
        };

        await db.collection("weather_intelligence").doc(park.id).set(weatherIntelligenceDoc);
      }

      await db.collection("weather_sync_stats").doc("latest").set({
        lastSync: admin.firestore.Timestamp.now(),
        status: "success",
        engine: "OpenWeatherMap 3.0 (Manual Trigger)"
      });

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
