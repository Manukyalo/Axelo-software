import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { getWeatherLabel, getSeasonBadge, wmoToIcon } from '../utils/weatherUtils.js';

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
 * Evaluates real-time weather metrics into actionable safari advisories.
 */
export function generateSafariAdvisory(weatherData, parkName) {
  const { temp_c, wind_kph, humidity, precipitation_mm, weather_code, condition } = weatherData;
  const alerts = [];
  let status = 'Ideal';
  let advisory = '';

  const c = Number(weather_code);
  const isThunderstorm = (c >= 95 && c <= 99) || (c >= 200 && c < 300);
  const isDrizzle = [51, 53, 55].includes(c) || (c >= 300 && c < 400);
  const isRain = [61, 63, 65, 80, 81, 82].includes(c) || (c >= 500 && c < 600);
  const isFog = [45, 48].includes(c) || (c >= 700 && c < 800);
  const isClear = c === 0 || c === 800;
  const isCloudy = [1, 2, 3].includes(c) || c > 800;

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
 * Fetch weather from Open-Meteo API (https://github.com/open-meteo/open-meteo)
 * High-accuracy, free, open-source weather and climate API with zero API keys required.
 */
export async function fetchParkWeather(park) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${park.lat}&longitude=${park.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max&timezone=Africa%2FNairobi&forecast_days=7`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Open-Meteo request failed with status: ${res.status}`);
  }

  const data = await res.json();
  const current = data.current || {};
  const weather_code = current.weather_code ?? 0;
  const condition = getWeatherLabel(weather_code);
  const icon = wmoToIcon(weather_code);
  const uvVal = current.uv_index !== undefined && current.uv_index !== null ? Math.round(current.uv_index) : '—';

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

  // Evaluate heuristic safari advisory
  const intel = generateSafariAdvisory(weatherData, park.name);

  // 7-day daily forecast
  const dailyForecast = (data.daily?.time || []).map((date, i) => {
    const code = data.daily?.weather_code?.[i] ?? 0;
    return {
      date,
      max: Math.round(data.daily?.temperature_2m_max?.[i] ?? 0),
      min: Math.round(data.daily?.temperature_2m_min?.[i] ?? 0),
      condition: getWeatherLabel(code),
      icon: wmoToIcon(code),
      code,
      pop: data.daily?.precipitation_probability_max?.[i] || 0
    };
  });

  return {
    parkId: park.id,
    parkName: park.name,
    ...weatherData,
    advisory: intel.advisory,
    status: intel.status,
    alerts: intel.alerts,
    forecast: dailyForecast,
    season: getSeasonBadge(new Date().getMonth()),
    source: 'Open-Meteo'
  };
}

/**
 * Synchronizes weather for all 10 national parks into Firestore
 */
export async function syncAllParksWeather(onProgress) {
  const results = [];
  const allAlerts = [];
  const errors = [];

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
      errors.push({ park: park.name, error: err.message });
    }
  }

  if (results.length === 0 && errors.length > 0) {
    throw new Error(errors[0].error || 'Failed to sync parks weather.');
  }

  // Update global sync stats and alert collection
  try {
    await setDoc(doc(db, 'weather_sync_stats', 'latest'), {
      lastSync: serverTimestamp(),
      status: 'success',
      engine: 'Open-Meteo API + Safari Decision Engine',
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
