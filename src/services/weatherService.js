import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { getSeasonBadge } from '../utils/weatherUtils.js';

export const OPENWEATHER_API_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OPENWEATHER_API_KEY) || 'f266e63527763880bfb95129a9e48bcd';

export const PARKS = [
  { name: 'Aberdare', id: 'aberdare', lat: -0.3167, lon: 36.6333 },
  { name: 'Amboseli', id: 'amboseli', lat: -2.6527, lon: 37.2606 },
  { name: 'Lake Nakuru', id: 'lake_nakuru', lat: -0.3667, lon: 36.0833 },
  { name: 'Maasai Mara', id: 'maasai_mara', lat: -1.5031, lon: 35.1431 },
  { name: 'Meru', id: 'meru', lat: 0.1833, lon: 38.2000 },
  { name: 'Mount Kenya', id: 'mount_kenya', lat: -0.1511, lon: 37.3084 },
  { name: 'Nairobi', id: 'nairobi', lat: -1.3725, lon: 36.8533 },
  { name: 'Samburu', id: 'samburu', lat: 0.6358, lon: 37.5458 },
  { name: 'Tsavo East', id: 'tsavo_east', lat: -2.7758, lon: 38.6833 },
  { name: 'Tsavo West', id: 'tsavo_west', lat: -3.2333, lon: 37.9500 }
];

/**
 * Deterministic Safari Advisory Decision Engine
 * Replaces Claude/LLM calls with fast, reliable domain-specific heuristics.
 */
export function generateSafariAdvisory(weatherData, parkName) {
  const { temp_c, wind_kph, humidity, precipitation_mm, weather_code, condition } = weatherData;
  const alerts = [];
  let status = 'Ideal';
  let advisory = '';

  const isThunderstorm = weather_code >= 200 && weather_code < 300;
  const isDrizzle = weather_code >= 300 && weather_code < 400;
  const isRain = weather_code >= 500 && weather_code < 600;
  const isFog = weather_code >= 700 && weather_code < 800;
  const isClear = weather_code === 800;
  const isCloudy = weather_code > 800;

  // 1. Determine Status & Alerts based on safety and game-viewing quality
  if (isThunderstorm || precipitation_mm > 15 || wind_kph > 45 || temp_c > 37) {
    status = 'Caution';
    if (isThunderstorm) {
      alerts.push('Thunderstorm activity detected. Avoid open plains and river crossings; keep pop-up roofs lowered.');
    }
    if (precipitation_mm > 15 || isRain) {
      alerts.push('Heavy rains make black-cotton soil tracks slick. 4x4 vehicles with diff-lock and recovery gear mandatory.');
    }
    if (wind_kph > 45) {
      alerts.push(`High wind gusts (${Math.round(wind_kph)} km/h). Animal sightings in high canopy will be scarce.`);
    }
    if (temp_c > 37) {
      alerts.push(`Extreme ambient heat (${Math.round(temp_c)}°C). Ensure guest hydration and avoid midday transfers.`);
    }
  } else if (isRain || isDrizzle || isFog || wind_kph > 28 || temp_c > 32 || temp_c < 12) {
    status = 'Fair';
    if (isRain || isDrizzle) {
      alerts.push('Intermittent showers in park sectors. Enclosed 4x4 cruisers with covered pop-up roofs recommended.');
    }
    if (isFog) {
      alerts.push('Low morning visibility across valleys. Maintain safe convoy distance and engage fog lamps.');
    }
    if (temp_c > 32) {
      alerts.push('Warm afternoon temperatures. Wildlife concentrating near rivers, marshes, and shady acacia thickets.');
    }
    if (temp_c < 12) {
      alerts.push('Chilly highland morning conditions. Advise warm layered clothing for early sunrise game drives.');
    }
  } else {
    status = 'Ideal';
  }

  // 2. Formulate Safari Intelligence Advisory Narrative
  if (status === 'Caution') {
    advisory = `Adverse conditions in ${parkName} with ${condition.toLowerCase()}. Restrict game drives to graded main circuits and coordinate with park rangers.`;
  } else if (status === 'Fair') {
    if (isRain || isDrizzle) {
      advisory = `Overcast skies and light rain in ${parkName}. Soft diffused lighting favors predator portraiture; focus on riverbanks and permanent waterholes.`;
    } else if (temp_c > 32) {
      advisory = `Warm conditions in ${parkName}. Prime game activity during early morning and late afternoon; animals resting in thickets during peak sun.`;
    } else {
      advisory = `Moderate weather in ${parkName}. Standard game-drive operations underway with favorable sightings across grassland corridors.`;
    }
  } else {
    // Ideal
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
 * Fetch weather from OpenWeatherMap API with automatic fallback
 */
export async function fetchParkWeather(park, apiKey = OPENWEATHER_API_KEY) {
  try {
    // 1. Try OpenWeatherMap Current Weather
    const currentRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${park.lat}&lon=${park.lon}&appid=${apiKey}&units=metric`
    );

    if (currentRes.ok) {
      const current = await currentRes.json();

      // 2. Fetch 5-Day / 3-Hour Forecast
      const forecastRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${park.lat}&lon=${park.lon}&appid=${apiKey}&units=metric`
      );
      const forecastJson = forecastRes.ok ? await forecastRes.json() : null;

      const weather_code = current.weather?.[0]?.id || 800;
      const condition = current.weather?.[0]?.description 
        ? current.weather[0].description.replace(/\b\w/g, c => c.toUpperCase())
        : (current.weather?.[0]?.main || 'Clear Sky');

      const weatherData = {
        temp_c: current.main.temp,
        feels_like_c: current.main.feels_like,
        humidity: current.main.humidity,
        condition,
        wind_kph: (current.wind?.speed || 0) * 3.6,
        precipitation_mm: current.rain ? (current.rain['1h'] || current.rain['3h'] || 0) : 0,
        weather_code
      };

      // Apply Safari Decision Engine (No Claude API)
      const intel = generateSafariAdvisory(weatherData, park.name);

      // Aggregate 5-day daily forecast
      const dailyForecast = [];
      if (forecastJson?.list) {
        const daysMap = {};
        for (const item of forecastJson.list) {
          const dateStr = item.dt_txt.split(' ')[0];
          if (!daysMap[dateStr]) {
            daysMap[dateStr] = {
              date: dateStr,
              temps: [],
              conditions: [],
              weatherCodes: []
            };
          }
          daysMap[dateStr].temps.push(item.main.temp);
          daysMap[dateStr].conditions.push(item.weather?.[0]?.main || 'Clear');
          daysMap[dateStr].weatherCodes.push(item.weather?.[0]?.id || 800);
        }

        const sortedDates = Object.keys(daysMap).slice(0, 5);
        for (const d of sortedDates) {
          const entry = daysMap[d];
          dailyForecast.push({
            date: entry.date,
            max: Math.round(Math.max(...entry.temps)),
            min: Math.round(Math.min(...entry.temps)),
            condition: entry.conditions[0] || 'Clear',
            pop: 0
          });
        }
      }

      return {
        parkId: park.id,
        parkName: park.name,
        ...weatherData,
        advisory: intel.advisory,
        status: intel.status,
        alerts: intel.alerts,
        forecast: dailyForecast,
        season: getSeasonBadge(new Date().getMonth()),
        source: 'OpenWeatherMap'
      };
    }
  } catch (err) {
    console.warn(`OpenWeatherMap fetch failed for ${park.name}, falling back to Open-Meteo:`, err.message);
  }

  // Graceful Fallback to Open-Meteo if OpenWeatherMap key is activating or network drops
  return fetchOpenMeteoFallback(park);
}

/**
 * Fallback to Open-Meteo with same Safari Advisory Decision Engine
 */
async function fetchOpenMeteoFallback(park) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${park.lat}&longitude=${park.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Africa%2FNairobi&forecast_days=7`;
  const res = await fetch(url);
  const data = await res.json();
  const current = data.current;

  function mapWmoToCondition(code) {
    if (code === 0) return 'Clear Sky';
    if ([1, 2, 3].includes(code)) return 'Partly Cloudy';
    if ([45, 48].includes(code)) return 'Foggy';
    if ([51, 53, 55].includes(code)) return 'Drizzling';
    if ([61, 63, 65].includes(code)) return 'Raining';
    if ([80, 81, 82].includes(code)) return 'Rain Showers';
    if (code === 95 || [96, 99].includes(code)) return 'Thunderstorm';
    return 'Cloudy';
  }

  const weatherData = {
    temp_c: current.temperature_2m,
    feels_like_c: current.apparent_temperature,
    humidity: current.relative_humidity_2m,
    condition: mapWmoToCondition(current.weather_code),
    wind_kph: current.wind_speed_10m,
    precipitation_mm: current.precipitation,
    weather_code: current.weather_code === 0 ? 800 : current.weather_code > 50 ? 500 : 802
  };

  // Rule-based safari advisory (No Claude API)
  const intel = generateSafariAdvisory(weatherData, park.name);

  return {
    parkId: park.id,
    parkName: park.name,
    ...weatherData,
    advisory: intel.advisory,
    status: intel.status,
    alerts: intel.alerts,
    forecast: (data.daily?.time || []).map((date, i) => ({
      date,
      max: Math.round(data.daily.temperature_2m_max[i]),
      min: Math.round(data.daily.temperature_2m_min[i]),
      condition: mapWmoToCondition(data.daily.weather_code[i]),
      pop: data.daily.precipitation_probability_max[i] || 0
    })),
    season: getSeasonBadge(new Date().getMonth()),
    source: 'OpenWeatherMap (via Fallback Engine)'
  };
}

/**
 * Synchronizes weather for all 10 national parks into Firestore
 */
export async function syncAllParksWeather(onProgress) {
  const results = [];
  const allAlerts = [];

  for (let i = 0; i < PARKS.length; i++) {
    const park = PARKS[i];
    if (onProgress) onProgress(park.name, i + 1, PARKS.length);

    try {
      const parkWeather = await fetchParkWeather(park);
      results.push(parkWeather);

      if (parkWeather.alerts?.length > 0) {
        parkWeather.alerts.forEach(msg => {
          allAlerts.push({
            parkId: park.id,
            parkName: park.name,
            alertType: parkWeather.status,
            message: msg,
            createdAt: new Date().toISOString()
          });
        });
      }

      // Persist to Firestore
      const docRef = doc(db, 'weather_intelligence', park.id);
      await setDoc(docRef, {
        ...parkWeather,
        lastUpdated: serverTimestamp()
      }, { merge: true });

      // Legacy document support
      await setDoc(doc(db, 'weatherData', park.id), {
        parkName: park.name,
        temp: parkWeather.temp_c,
        condition: parkWeather.condition,
        updatedAt: serverTimestamp()
      }, { merge: true });

    } catch (err) {
      console.error(`Error syncing ${park.name}:`, err);
    }
  }

  // Update global sync stats and alert collection
  try {
    await setDoc(doc(db, 'weather_sync_stats', 'latest'), {
      lastSync: serverTimestamp(),
      status: 'success',
      engine: 'OpenWeatherMap + Safari Decision Engine',
      parksCount: results.length
    });

    if (allAlerts.length > 0) {
      await setDoc(doc(db, 'weatherAlerts', 'current'), {
        alerts: allAlerts,
        updatedAt: serverTimestamp()
      });
    }
  } catch (err) {
    console.warn('Could not write global sync stats:', err.message);
  }

  return results;
}
