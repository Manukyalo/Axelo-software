import axios from 'axios';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '../config/firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  getDoc, 
  runTransaction, 
  serverTimestamp 
} from 'firebase/firestore';
import { getWeatherLabel } from './weatherUtils';

const SYNC_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

// Helper to evaluate weather status based on WMO codes
const evaluateWeatherAlerts = (parkName, current) => {
  const code = current.weather_code;
  const wind = current.wind_speed_10m;
  const alerts = [];

  if ([95, 96, 99].includes(code)) {
    alerts.push({ id: `${parkName}-thunder`, type: 'danger', message: `Thunderstorm active in ${parkName}. Seek shelter immediately.` });
  } else if ([61, 63, 65, 80, 81, 82].includes(code)) {
    alerts.push({ id: `${parkName}-rain`, type: 'warning', message: `Heavy rain in ${parkName}. Some tracks may be slippery.` });
  }

  if (wind > 40) {
    alerts.push({ id: `${parkName}-wind`, type: 'warning', message: `High winds (${wind}km/h) in ${parkName}. Watch for falling branches.` });
  }

  return alerts;
};

export const syncWeatherData = async (force = false) => {
  const syncRef = doc(db, 'weatherAlerts', 'syncStatus');
  
  try {
    const shouldSync = await runTransaction(db, async (transaction) => {
      const syncSnap = await transaction.get(syncRef);
      const now = Date.now();
      
      if (!syncSnap.exists()) {
        transaction.set(syncRef, { lastSyncAt: 0, isSyncing: true });
        return true;
      }
      
      const data = syncSnap.data();
      const lastSync = data.lastSyncAt?.toMillis?.() || 0;
      
      // If already syncing and it hasn't been stuck for > 2 mins, skip
      if (data.isSyncing && (now - lastSync < 2 * 60 * 1000)) {
        return false;
      }
      
      if (force || (now - lastSync > SYNC_THRESHOLD_MS)) {
        transaction.update(syncRef, { isSyncing: true });
        return true;
      }
      
      return false;
    });

    if (!shouldSync) {
      console.log('☀️ Weather data is up to date.');
      return;
    }

    console.log('🔄 Starting Weather Intelligence Sync (Client-Side)...');

    // 1. Fetch Parks
    const parksSnap = await getDocs(collection(db, 'parks'));
    const parks = parksSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (parks.length === 0) {
      console.warn('⚠️ No parks found to sync weather for.');
      await setDoc(syncRef, { isSyncing: false, lastSyncAt: serverTimestamp() }, { merge: true });
      return;
    }

    const allAlerts = [];
    const anthropic = new Anthropic({
      apiKey: import.meta.env.VITE_CLAUDE_API_KEY,
      dangerouslyAllowBrowser: true // Required for client-side
    });

    for (const park of parks) {
      console.log(`📡 Fetching weather for ${park.name}...`);
      
      // 2. Fetch Open-Meteo (with UV Index)
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${park.latitude}&longitude=${park.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max&timezone=Africa%2FNairobi`;
      const weatherRes = await axios.get(weatherUrl);
      const rawData = weatherRes.data;

      // 3. Map to Frontend Flattened Schema
      const current = rawData.current;
      const daily = rawData.daily;
      
      const weatherDoc = {
        id: park.id,
        name: park.name,
        lastUpdated: serverTimestamp(),
        current: {
          temp: current.temperature_2m,
          humidity: current.relative_humidity_2m,
          windSpeed: current.wind_speed_10m,
          uvIndex: daily.uv_index_max[0] || 'N/A',
          code: current.weather_code,
          description: getWeatherLabel(current.weather_code),
          precip: current.precipitation,
          isDay: current.is_day
        },
        forecast: daily.time.map((t, i) => ({
          date: t,
          code: daily.weather_code[i],
          max: daily.temperature_2m_max[i],
          min: daily.temperature_2m_min[i],
          precip: daily.precipitation_sum[i],
          condition: getWeatherLabel(daily.weather_code[i])
        }))
      };

      // 4. Handle Alerts
      const parkAlerts = evaluateWeatherAlerts(park.name, current);
      allAlerts.push(...parkAlerts);

      // 5. Generate AI Advisory (Claude)
      const intelligenceRef = doc(db, 'weather_intelligence', park.id);
      const intelSnap = await getDoc(intelligenceRef);
      const existingData = intelSnap.exists() ? intelSnap.data() : {};
      const lastAdvAt = existingData.lastAdvisoryAt?.toMillis?.() || 0;
      
      let advisory = existingData.advisory || 'Synchronizing Advisory...';
      let status = existingData.status || 'Checking...';

      if (force || (Date.now() - lastAdvAt > 3 * 60 * 60 * 1000)) {
        try {
          const response = await anthropic.messages.create({
            model: "claude-3-5-sonnet-latest",
            max_tokens: 250,
            messages: [{
              role: "user",
              content: `As a safari operations expert, provide a 2-sentence safari advisory for ${park.name}. Current conditions: WMO code ${current.weather_code}, Temp ${current.temperature_2m}°C, Rain ${current.precipitation}mm. Focus on road conditions and wildlife viewing probability. Keep it professional and helpful.`
            }]
          });
          advisory = response.content[0].text;
          status = current.temperature_2m > 30 ? 'Caution (Heat)' : current.precipitation > 5 ? 'Caution (Rain)' : 'Ideal';
          weatherDoc.lastAdvisoryAt = serverTimestamp();
        } catch (aiErr) {
          console.error(`❌ Claude AI Error for ${park.name}:`, aiErr);
        }
      }

      await setDoc(intelligenceRef, {
        ...weatherDoc,
        advisory,
        status,
        lastAdvisoryAt: weatherDoc.lastAdvisoryAt || (existingData.lastAdvisoryAt || serverTimestamp())
      });
    }

    // 6. Update Global Alerts
    await setDoc(doc(db, 'weatherAlerts', 'current'), {
      alerts: allAlerts,
      updatedAt: serverTimestamp()
    });

    // 7. Finalize Sync Status
    await setDoc(syncRef, {
      isSyncing: false,
      lastSyncAt: serverTimestamp()
    }, { merge: true });

    console.log('✅ Weather Intelligence Sync Complete!');
    
  } catch (err) {
    console.error('❌ Weather Sync Failed:', err);
    // Reset isSyncing so it's not permanently stuck
    await setDoc(syncRef, { isSyncing: false }, { merge: true });
  }
};
