const { onSchedule } = require("firebase-functions/v2/scheduler");
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
exports.weatherSync = onSchedule(
  {
    schedule: "every 10 minutes",
    timeZone: "Africa/Nairobi",
    memory: "512MiB",
    timeoutSeconds: 300,
  },
  async (event) => {
    try {
      console.log("Starting weatherSync loop...");
      
      // Step 1: Fetch all parks where latitude and longitude exist
      const parksSnapshot = await db.collection("parks").get();
      const parks = [];
      parksSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.latitude && data.longitude) {
          parks.push({ id: doc.id, name: data.name, lat: data.latitude, lon: data.longitude });
        }
      });

      console.log(`Found ${parks.length} parks with coordinates.`);

      // Step 2 & 3: Fetch weather and write to Firestore
      const newAlerts = [];
      const promises = parks.map(async (park) => {
        try {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${park.lat}&longitude=${park.lon}&current=temperature_2m,precipitation,windspeed_10m,weathercode,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode,windspeed_10m_max&timezone=Africa%2FNairobi&forecast_days=7`;
          const response = await axios.get(url);
          const data = response.data;

          const current = {
            temp: data.current.temperature_2m,
            precipitation: data.current.precipitation,
            windspeed: data.current.windspeed_10m,
            humidity: data.current.relative_humidity_2m,
            weathercode: data.current.weathercode,
            weatherLabel: getWeatherLabel(data.current.weathercode),
          };

          const forecast = data.daily.time.map((dateStr, idx) => ({
            date: dateStr,
            high: data.daily.temperature_2m_max[idx],
            low: data.daily.temperature_2m_min[idx],
            precipitation: data.daily.precipitation_sum[idx],
            windspeed: data.daily.windspeed_10m_max[idx],
            weathercode: data.daily.weathercode[idx],
            weatherLabel: getWeatherLabel(data.daily.weathercode[idx]),
          }));

          const updatedDoc = {
            parkId: park.id,
            parkName: park.name,
            updatedAt: admin.firestore.Timestamp.now(),
            current,
            forecast,
            seasonBadge: getSeasonBadge(new Date().getMonth()),
          };

          await db.collection("weatherData").doc(park.id).set(updatedDoc);

          // Step 4 - Evaluate dangerous weather alerts
          if (current.weathercode >= 95) {
            newAlerts.push({
              parkId: park.id,
              parkName: park.name,
              alertType: "thunderstorm",
              severity: "danger",
              message: `Thunderstorm detected at ${park.name}. Game drives not advised.`,
              detectedAt: admin.firestore.Timestamp.now(),
              active: true,
            });
          } else if (current.precipitation > 20) {
            newAlerts.push({
              parkId: park.id,
              parkName: park.name,
              alertType: "heavy_rain",
              severity: "warning",
              message: `Heavy rain detected at ${park.name}. Expect poor visibility and muddy tracks.`,
              detectedAt: admin.firestore.Timestamp.now(),
              active: true,
            });
          } else if (current.windspeed > 50) {
            newAlerts.push({
              parkId: park.id,
              parkName: park.name,
              alertType: "high_wind",
              severity: "warning",
              message: `High winds detected at ${park.name}. Drives may be uncomfortable.`,
              detectedAt: admin.firestore.Timestamp.now(),
              active: true,
            });
          } else if (current.weathercode === 45 || current.weathercode === 48) {
            newAlerts.push({
              parkId: park.id,
              parkName: park.name,
              alertType: "fog",
              severity: "warning",
              message: `Fog detected at ${park.name}. Expect poor visibility early morning.`,
              detectedAt: admin.firestore.Timestamp.now(),
              active: true,
            });
          }
        } catch (e) {
          console.error(`Failed to fetch weather for park ${park.name}:`, e.message);
        }
      });

      await Promise.all(promises);

      // Overwrite the current active alerts collection document
      await db.collection("weatherAlerts").doc("current").set({
        alerts: newAlerts,
        updatedAt: admin.firestore.Timestamp.now()
      });

      // Step 5: Send FCM push notifications for NEW alerts
      // To determine "new", we ideally compare against the old document.
      // This requires fetching the document BEFORE overwriting it.
      // Let's assume we do that here (this is simplified logic to show the structure)
      
      const previousDoc = await db.collection("weatherAlerts").doc("current").get();
      const oldAlerts = previousDoc.exists && previousDoc.data().alerts ? previousDoc.data().alerts : [];
      
      // Find truly new alerts (not present in oldAlerts by parkId + alertType)
      const newlyDetected = newAlerts.filter(na => 
        !oldAlerts.find(oa => oa.parkId === na.parkId && oa.alertType === na.alertType)
      );

      if (newlyDetected.length > 0) {
        // Find users with roles driver/guide and tokens
        const usersSnap = await db.collection("users").where("role", "in", ["driver", "guide"]).get();
        const tokens = [];
        usersSnap.forEach(user => {
          const fcmToken = user.data().fcmToken;
          if (fcmToken) {
            tokens.push(fcmToken);
          }
        });

        if (tokens.length > 0) {
          for (const alert of newlyDetected) {
            const message = {
              notification: {
                title: `⚠️ Weather Alert — ${alert.parkName}`,
                body: alert.message
              },
              data: {
                parkId: alert.parkId,
                alertType: alert.alertType
              },
              tokens: tokens // Multicast
            };
            
            try {
              const response = await messaging.sendEachForMulticast(message);
              console.log(`Sent ${response.successCount} messages for alert in ${alert.parkName}`);
            } catch (err) {
              console.error(`FCM multicast failed for ${alert.parkName}:`, err);
            }
          }
        }
      }

      // Step 6: Generate AI advisories with Claude (Batched)
      const threeHoursAgo = Date.now() - (3 * 60 * 60 * 1000);
      const parksNeedingAdvisory = [];

      for (const park of parks) {
        const advisoryDoc = await db.collection("weatherAdvisories").doc(park.id).get();
        let needsUpdate = false;
        
        if (!advisoryDoc.exists) {
          needsUpdate = true;
        } else {
          const generatedAt = advisoryDoc.data().generatedAt?.toMillis();
          if (!generatedAt || generatedAt < threeHoursAgo) {
            needsUpdate = true;
          }
        }

        if (needsUpdate) {
            // we will need the weather context
            const weatherDocRaw = await db.collection("weatherData").doc(park.id).get();
            if (weatherDocRaw.exists) {
                parksNeedingAdvisory.push({ park, current: weatherDocRaw.data().current });
            }
        }
      }

      const BATCH_SIZE = 3;
      for (let i = 0; i < parksNeedingAdvisory.length; i += BATCH_SIZE) {
        const batch = parksNeedingAdvisory.slice(i, i + BATCH_SIZE);
        
        await Promise.all(batch.map(async ({ park, current }) => {
            try {
                if (!process.env.CLAUDE_API_KEY) {
                    // Skip if no API key is provided
                    console.log("Skipping Claude API call due to missing CLAUDE_API_KEY");
                    return;
                }
                const response = await anthropic.messages.create({
                    model: "claude-3-5-sonnet-20241022",
                    max_tokens: 200,
                    system: "You are a Kenyan safari expert and meteorologist. Given real-time weather data for a national park, generate a concise 2-3 sentence advisory for safari operators. Cover: current game drive conditions, visibility, road accessibility, and any warnings. Be specific and practical. No fluff.",
                    messages: [{
                      role: "user",
                      content: `Park: ${park.name}\nCurrent temp: ${current.temp}°C\nConditions: ${current.weatherLabel}\nWind: ${current.windspeed} km/h\nHumidity: ${current.humidity}%\nPrecipitation: ${current.precipitation}mm\nGenerate a safari advisory.`
                    }]
                });

                const advisoryText = response.content[0].text;
                await db.collection("weatherAdvisories").doc(park.id).set({
                    parkId: park.id,
                    parkName: park.name,
                    advisory: advisoryText,
                    generatedAt: admin.firestore.Timestamp.now()
                });
            } catch(err) {
                console.error(`Claude generation failed for ${park.name}:`, err.message);
            }
        }));

        if (i + BATCH_SIZE < parksNeedingAdvisory.length) {
          await new Promise(r => setTimeout(r, 1000)); // 1 second delay between batches
        }
      }

      console.log("weatherSync loop completed.");
    } catch (error) {
      console.error("weatherSync error:", error);
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
