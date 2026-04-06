const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { Anthropic } = require("@anthropic-ai/sdk");
const axios = require("axios");

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY || "dummy",
});

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

function getSeasonBadge(month) {
  // month = 0-11
  if ([6, 7, 8].includes(month)) return { label: "Peak Dry Season", type: "success" };
  if ([2, 3, 4].includes(month)) return { label: "Long Rains", type: "info" };
  if ([9, 10].includes(month)) return { label: "Short Rains", type: "info" };
  return { label: "Dry Season", type: "warning" };
}

/**
 * AI Manager: Generates professional Safari Advisories using Claude 3.5 Sonnet
 */
async function generateSafariIntelligence(weatherData, parkName) {
  try {
    const prompt = `You are a professional Safari Intelligence Officer for Eastern Vacations. 
    Analyze the following weather data for ${parkName} and provide a concise, high-end safari advisory (max 2 sentences).
    
    Data:
    - Temp: ${weatherData.temp_c}°C
    - Condition: ${weatherData.condition}
    - Wind: ${weatherData.wind_kph} km/h
    - Humidity: ${weatherData.humidity}%
    
    Consider:
    1. Wildlife tracking opportunities (e.g. animals near water holes in heat).
    2. Photography conditions (lighting).
    3. Vehicle recommendations (4x4, open-roof).
    4. Essential gear (sunscreen, rain poncho, dust masks).
    
    Return ONLY a JSON object with:
    {
      "advisory": "Your 1-2 sentence professional advisory",
      "status": "Ideal" | "Fair" | "Caution",
      "alerts": ["Specific alert if any, else empty"]
    }`;

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    });

    return JSON.parse(response.content[0].text);
  } catch (error) {
    console.error("AI Advisory Generation Failed:", error);
    return {
      advisory: `Current conditions in ${parkName} are ${weatherData.condition.toLowerCase()}. Standard safari precautions apply.`,
      status: weatherData.temp_c > 30 ? "Fair" : "Ideal",
      alerts: []
    };
  }
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
 * Core Weather Sync Logic (Unified for Background & Manual)
 */
async function performWeatherSync(parkList) {
  console.log(`--- 🌦️ Weather Intelligence Sync Started (${parkList.length} parks) ---`);
  
  for (const park of parkList) {
    try {
      console.log(`Syncing ${park.name}...`);
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${park.lat}&longitude=${park.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Africa%2FNairobi&forecast_days=7`;
      
      const response = await axios.get(url);
      const data = response.data;
      const current = data.current;

      const weatherData = {
        temp_c: current.temperature_2m,
        feels_like_c: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
        condition: getWeatherLabel(current.weather_code),
        wind_kph: current.wind_speed_10m,
        precipitation_mm: current.precipitation,
        weather_code: current.weather_code
      };

      // Generate AI Intelligence
      const intel = await generateSafariIntelligence(weatherData, park.name);

      const weatherIntelligenceDoc = {
        parkId: park.id,
        parkName: park.name,
        ...weatherData, // Flattened schema
        advisory: intel.advisory,
        status: intel.status,
        alerts: intel.alerts || [],
        forecast: data.daily.time.map((date, i) => ({
          date,
          max: data.daily.temperature_2m_max[i],
          min: data.daily.temperature_2m_min[i],
          condition: getWeatherLabel(data.daily.weather_code[i]),
          pop: data.daily.precipitation_probability_max[i]
        })),
        lastUpdated: admin.firestore.Timestamp.now(),
        season: getSeasonBadge(new Date().getMonth())
      };

      await db.collection("weather_intelligence").doc(park.id).set(weatherIntelligenceDoc);

      // Legacy support for older components
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
    engine: "Open-Meteo + Claude AI"
  });

  console.log("--- 🌥️ Weather Intelligence Sync Completed ---");
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
