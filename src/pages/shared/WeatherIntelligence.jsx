import React, { useState, useEffect, useRef } from 'react';
import { 
  Cloud, Sun, CloudRain, CloudLightning, Wind, Droplets,
  Thermometer, Eye, AlertTriangle, X, RefreshCw, ChevronRight,
  AlertCircle, CloudSnow, Gauge, TrendingUp
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { db } from '../../config/firebase';
import { doc, onSnapshot, collection, getDocs } from 'firebase/firestore';
import { syncWeatherData } from '../../utils/weatherSyncEngine';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useTheme } from '../../contexts/ThemeContext';
import { format } from 'date-fns';
import { getWeatherLabel, getSeasonBadge } from '../../utils/weatherUtils';

// ----------- HELPER: Weather Icon by Code -----------
const WeatherIcon = ({ code, size = 24, className = '' }) => {
  if (code >= 95) return <CloudLightning size={size} className={className} />;
  if ([80, 81, 82, 61, 63, 65].includes(code)) return <CloudRain size={size} className={className} />;
  if ([51, 53, 55].includes(code)) return <Droplets size={size} className={className} />;
  if ([45, 48].includes(code)) return <Eye size={size} className={className} />;
  if ([1, 2, 3].includes(code)) return <Cloud size={size} className={className} />;
  return <Sun size={size} className={className} />;
};

// ----------- HELPER: Code to vibrant color -----------
const codeToColor = (code) => {
  if (code >= 95) return '#9333ea';
  if ([80, 81, 82, 61, 63, 65].includes(code)) return '#3b82f6';
  if ([51, 53, 55].includes(code)) return '#60a5fa';
  if ([45, 48].includes(code)) return '#94a3b8';
  if ([1, 2, 3].includes(code)) return '#C9A84C';
  return '#f59e0b';
};

// ----------- Skeleton Loader -----------
const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-dark-border rounded-xl ${className}`} />
);

// ----------- Alert Severity color -----------
const alertSeverityStyles = {
  danger: 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400',
  warning: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400',
};

const alertIcon = {
  thunderstorm: <CloudLightning size={16} />,
  heavy_rain: <CloudRain size={16} />,
  high_wind: <Wind size={16} />,
  fog: <Eye size={16} />,
};

// ----------- Season Badge Styles -----------
const seasonStyles = {
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
};

// ----------- Live Dot -----------
const LiveDot = ({ updatedAt }) => {
  if (!updatedAt) return null;
  const diffMinutes = (Date.now() - updatedAt.toMillis()) / 60000;
  const isLive = diffMinutes < 20;

  return (
    <div className="flex items-center gap-2">
      <span className={`relative flex h-2.5 w-2.5`}>
        {isLive && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        )}
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isLive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
      </span>
      <span className={`text-xs font-bold uppercase tracking-widest ${isLive ? 'text-emerald-500' : 'text-gray-400'}`}>
        {isLive ? 'Live' : 'Delayed'}
      </span>
      <span className="text-[10px] text-gray-400">
        Updated {updatedAt ? format(updatedAt.toDate(), 'HH:mm') : '—'}
      </span>
    </div>
  );
};

// ----------- Forecast Day Card -----------
const ForecastCard = ({ day }) => {
  const accentColor = codeToColor(day.weathercode);
  return (
    <div
      className="flex-shrink-0 flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-100 dark:border-dark-border bg-white dark:bg-dark-surface min-w-[100px] hover:shadow-md transition-all"
      style={{ borderTop: `3px solid ${accentColor}` }}
    >
      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
        {format(new Date(day.date + 'T00:00:00'), 'EEE dd')}
      </p>
      <WeatherIcon code={day.weathercode} size={28} className="my-1" style={{ color: accentColor }} />
      <p className="text-[10px] text-center text-gray-500 font-medium leading-tight">{day.weatherLabel}</p>
      <div className="flex gap-1 items-center text-xs font-bold text-safari-primary dark:text-dark-text">
        <span>{day.high}°</span>
        <span className="text-gray-300">/</span>
        <span className="text-gray-400 font-normal">{day.low}°</span>
      </div>
      <div className="flex items-center gap-1 text-[10px] text-blue-500">
        <Droplets size={10} />
        <span>{day.precipitation} mm</span>
      </div>
    </div>
  );
};

// ----------- Park Overview Mini Card -----------
const ParkMiniCard = ({ park, weatherData, alerts }) => {
  const data = weatherData[park.id];
  const parkAlerts = alerts.filter(a => a.parkId === park.id);
  const hasAlert = parkAlerts.length > 0;

  return (
    <div className={`p-4 rounded-2xl border bg-white dark:bg-dark-surface transition-all hover:shadow-md
      ${hasAlert ? 'border-amber-400/40 dark:border-amber-500/30' : 'border-gray-100 dark:border-dark-border'}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-bold text-sm text-safari-primary dark:text-dark-text">{park.name}</p>
          {data?.seasonBadge && (
            <span className={`inline-block mt-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${seasonStyles[data.seasonBadge.type]}`}>
              {data.seasonBadge.label}
            </span>
          )}
        </div>
        {hasAlert && <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />}
      </div>
      {data ? (
        <div className="flex items-center gap-3">
          <WeatherIcon code={data.current.weathercode} size={32} className="text-safari-gold" />
          <div>
            <p className="text-2xl font-bold text-safari-primary dark:text-dark-text">{data.current.temp}°C</p>
            <p className="text-xs text-gray-500">{data.current.weatherLabel}</p>
          </div>
        </div>
      ) : (
        <Skeleton className="h-12" />
      )}
    </div>
  );
};

// ----------- MAIN PAGE -----------
export const WeatherIntelligence = () => {
  const { isDarkMode } = useTheme();

  const [parks, setParks] = useState([]);
  const [selectedPark, setSelectedPark] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [advisory, setAdvisory] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [history, setHistory] = useState(null);
  const [allParksWeather, setAllParksWeather] = useState({});
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());
  const [showHistory, setShowHistory] = useState(false);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [loadingAdvisory, setLoadingAdvisory] = useState(true);

  const [isSyncing, setIsSyncing] = useState(false);
  const unsubs = useRef([]);

  // 0. Trigger Client-Side Sync
  useEffect(() => {
    const runSync = async () => {
      setIsSyncing(true);
      try {
        await syncWeatherData();
      } finally {
        setIsSyncing(false);
      }
    };
    runSync();
  }, []);

  // Fetch parks list once
  useEffect(() => {
    getDocs(collection(db, 'parks')).then(snap => {
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setParks(list);
      if (list.length > 0) setSelectedPark(list[0].id);
    });
  }, []);

  // Global alerts listener (all parks)
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'weatherAlerts', 'current'), snap => {
      if (snap.exists()) setAlerts(snap.data()?.alerts || []);
    }, () => setAlerts([]));
    return () => unsub();
  }, []);

  // Per-park real-time listeners — fire whenever selectedPark changes
  useEffect(() => {
    if (!selectedPark) return;

    // Cleanup previous listeners
    unsubs.current.forEach(fn => fn());
    unsubs.current = [];

    setLoadingWeather(true);
    setLoadingAdvisory(true);
    setWeatherData(null);
    setAdvisory(null);
    setHistory(null);

    const w = onSnapshot(doc(db, 'weatherData', selectedPark), snap => {
      setWeatherData(snap.exists() ? snap.data() : null);
      setLoadingWeather(false);
    }, () => setLoadingWeather(false));

    const a = onSnapshot(doc(db, 'weatherAdvisories', selectedPark), snap => {
      setAdvisory(snap.exists() ? snap.data() : null);
      setLoadingAdvisory(false);
    }, () => setLoadingAdvisory(false));

    const h = onSnapshot(doc(db, 'weatherHistory', selectedPark), snap => {
      setHistory(snap.exists() ? snap.data() : null);
    });

    unsubs.current = [w, a, h];
    return () => { unsubs.current.forEach(fn => fn()); };
  }, [selectedPark]);

  // All parks live weather (for the overview grid)
  useEffect(() => {
    if (parks.length === 0) return;
    const subs = parks.map(park =>
      onSnapshot(doc(db, 'weatherData', park.id), snap => {
        if (snap.exists()) {
          setAllParksWeather(prev => ({ ...prev, [park.id]: snap.data() }));
        }
      })
    );
    return () => subs.forEach(fn => fn());
  }, [parks]);

  const selectedParkObj = parks.find(p => p.id === selectedPark);
  const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000;
  const advisoryNearExpiry = advisory?.generatedAt && advisory.generatedAt.toMillis() < threeHoursAgo - 30 * 60 * 1000;

  const visibleAlerts = alerts.filter(a => !dismissedAlerts.has(`${a.parkId}-${a.alertType}`));

  return (
    <PageWrapper
      title="Weather Intelligence"
      subtitle={
        <div className="flex items-center gap-4">
          <LiveDot updatedAt={weatherData?.updatedAt} />
          {isSyncing && (
            <div className="flex items-center text-[10px] text-amber-500 font-bold uppercase tracking-wider animate-pulse border border-amber-500/20 bg-amber-500/5 px-2 py-0.5 rounded-full">
              <RefreshCw size={10} className="mr-1.5 animate-spin" />
              Syncing Live Data...
            </div>
          )}
        </div>
      }
    >
      {/* ── ALERT BANNER ── */}
      {visibleAlerts.length > 0 && (
        <div className="mb-6 space-y-2" id="weather-alert-banner">
          {visibleAlerts.map(alert => (
            <div
              key={`${alert.parkId}-${alert.alertType}`}
              className={`flex items-start gap-3 p-4 rounded-xl border ${alertSeverityStyles[alert.severity]}`}
            >
              <span className="shrink-0 mt-0.5">{alertIcon[alert.alertType]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">{alert.parkName} — {alert.alertType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>
                <p className="text-xs mt-0.5 opacity-80">{alert.message}</p>
              </div>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border shrink-0 ${alert.severity === 'danger' ? 'border-red-500/30 text-red-600' : 'border-amber-500/30 text-amber-600'}`}>
                {alert.severity}
              </span>
              <button
                onClick={() => setDismissedAlerts(prev => new Set([...prev, `${alert.parkId}-${alert.alertType}`]))}
                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── PARK SELECTOR TABS ── */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-6">
        {parks.length === 0 ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-9 w-28 shrink-0" />)
        ) : (
          parks.map(park => (
            <button
              key={park.id}
              id={`park-tab-${park.id}`}
              onClick={() => setSelectedPark(park.id)}
              className={`shrink-0 px-5 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap border
                ${selectedPark === park.id
                  ? 'bg-safari-gold text-white border-safari-gold shadow-lg shadow-safari-gold/20'
                  : 'border-gray-200 dark:border-dark-border text-gray-500 hover:border-safari-gold hover:text-safari-gold dark:text-gray-400'
                }`}
            >
              {park.name}
              {alerts.some(a => a.parkId === park.id) && (
                <span className="ml-2 inline-block w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
          ))
        )}
      </div>

      {/* ── SELECTED PARK PANEL ── */}
      <div className="space-y-6 mb-10">

        {/* Row 1: Current + Season Badge + Advisory */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Current Conditions Card */}
          <Card className="lg:col-span-1 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-safari-primary/90 to-safari-primary pointer-events-none rounded-2xl" />
            <CardContent className="relative pt-8 pb-6 px-6 text-white">
              {loadingWeather ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-6 bg-white/10" />)}
                </div>
              ) : weatherData ? (
                <>
                  <p className="text-[10px] uppercase tracking-[3px] font-bold text-safari-gold mb-4">
                    {selectedParkObj?.name || 'Current Conditions'}
                  </p>
                  <div className="flex items-center gap-4 mb-6">
                    <WeatherIcon
                      code={weatherData.current.weathercode}
                      size={64}
                      className="text-safari-gold drop-shadow-lg"
                    />
                    <div>
                      <p className="text-5xl font-bold font-playfair">{weatherData.current.temp}°C</p>
                      <p className="text-sm text-white/70 mt-1">{weatherData.current.weatherLabel}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
                      <Droplets size={16} className="mx-auto mb-1 text-blue-300" />
                      <p className="text-xs text-white/60">Humidity</p>
                      <p className="text-sm font-bold">{weatherData.current.humidity}%</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
                      <Wind size={16} className="mx-auto mb-1 text-teal-300" />
                      <p className="text-xs text-white/60">Wind</p>
                      <p className="text-sm font-bold">{weatherData.current.windspeed} km/h</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
                      <CloudRain size={16} className="mx-auto mb-1 text-sky-300" />
                      <p className="text-xs text-white/60">Rainfall</p>
                      <p className="text-sm font-bold">{weatherData.current.precipitation} mm</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-10 text-center opacity-50">
                  <Cloud size={40} className="mx-auto mb-2" />
                  <p className="text-sm">No data yet — sync pending</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Season Badge Card */}
          <Card className="flex flex-col justify-between">
            <CardHeader>
              <h3 className="font-bold text-safari-primary dark:text-dark-text flex items-center gap-2">
                <TrendingUp size={18} className="text-safari-gold" /> Season Status
              </h3>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 flex-1">
              {loadingWeather ? (
                <Skeleton className="h-24" />
              ) : weatherData?.seasonBadge ? (
                <>
                  <div className={`p-5 rounded-2xl border ${seasonStyles[weatherData.seasonBadge.type]} text-center`}>
                    <p className="text-2xl font-bold font-playfair mb-1">{weatherData.seasonBadge.label}</p>
                    <p className="text-xs opacity-70">Currently Active Season</p>
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 space-y-1 px-1">
                    <p>🌦 <strong>Long Rains:</strong> March–May</p>
                    <p>☀️ <strong>Peak Dry:</strong> July–September</p>
                    <p>🌧 <strong>Short Rains:</strong> October–November</p>
                    <p>🌤 <strong>Dry Season:</strong> Dec–Feb, June</p>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-gray-400 text-sm">Season data unavailable</div>
              )}
            </CardContent>
          </Card>

          {/* AI Advisory Card */}
          <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
              <h3 className="font-bold text-safari-primary dark:text-dark-text flex items-center gap-2">
                <Gauge size={18} className="text-safari-gold" /> Safari Advisory
              </h3>
              {advisoryNearExpiry && (
                <span className="flex items-center gap-1 text-[10px] text-amber-500 font-bold">
                  <RefreshCw size={10} className="animate-spin" /> Updating...
                </span>
              )}
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              {loadingAdvisory ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-4" />)}
                </div>
              ) : advisory?.advisory ? (
                <>
                  <div className="bg-safari-gold/5 border border-safari-gold/15 rounded-2xl p-4 flex-1">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-safari-gold mb-3">
                      AI-Generated · Claude
                    </p>
                    <p className="text-sm leading-relaxed text-safari-primary dark:text-dark-text italic">
                      "{advisory.advisory}"
                    </p>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-3">
                    Generated {format(advisory.generatedAt.toDate(), 'MMM dd, HH:mm')}
                  </p>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-8 text-gray-400">
                  <RefreshCw size={28} className="mb-2 opacity-40" />
                  <p className="text-sm text-center">Advisory is being generated.<br />Check back in a few minutes.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Row 2: 7-Day Forecast Strip */}
        <Card>
          <CardHeader>
            <h3 className="font-bold text-safari-primary dark:text-dark-text">7-Day Forecast</h3>
          </CardHeader>
          <CardContent>
            {loadingWeather ? (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {[...Array(7)].map((_, i) => <Skeleton key={i} className="h-36 w-24 shrink-0" />)}
              </div>
            ) : weatherData?.forecast?.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                {weatherData.forecast.map((day, i) => <ForecastCard key={i} day={day} />)}
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-6 text-center">Forecast unavailable</p>
            )}
          </CardContent>
        </Card>

        {/* Row 3: Historical Chart (collapsible) */}
        <Card>
          <CardHeader
            className="flex flex-row items-center justify-between cursor-pointer select-none"
            onClick={() => setShowHistory(v => !v)}
          >
            <h3 className="font-bold text-safari-primary dark:text-dark-text">12-Month Historical Climate</h3>
            <ChevronRight
              size={18}
              className={`text-gray-400 transition-transform duration-300 ${showHistory ? 'rotate-90' : ''}`}
            />
          </CardHeader>
          {showHistory && (
            <CardContent>
              {!history ? (
                <div className="py-10 text-center text-gray-400 text-sm">
                  <RefreshCw size={28} className="mx-auto mb-2 opacity-40" />
                  Historical data will be available after the weekly sync runs.
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Rainfall Bar Chart */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-safari-gold mb-3">Average Monthly Rainfall (mm)</p>
                    <div style={{ height: 220 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={history.months} barSize={20}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#222' : '#f0f0f0'} />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 11 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 11 }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: isDarkMode ? '#1e1e35' : '#fff',
                              border: 'none', borderRadius: '12px',
                              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                            }}
                          />
                          <Bar dataKey="avgRainfall" name="Avg Rainfall (mm)" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  {/* Temperature Area Chart */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-safari-gold mb-3">Average Temperature (°C)</p>
                    <div style={{ height: 220 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={history.months}>
                          <defs>
                            <linearGradient id="tempHigh" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="tempLow" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#2D6A4F" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#2D6A4F" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#222' : '#f0f0f0'} />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 11 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 11 }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: isDarkMode ? '#1e1e35' : '#fff',
                              border: 'none', borderRadius: '12px',
                              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                            }}
                          />
                          <Legend verticalAlign="top" height={30} />
                          <Area name="Avg High" type="monotone" dataKey="avgHigh" stroke="#f59e0b" strokeWidth={2.5} fill="url(#tempHigh)" />
                          <Area name="Avg Low" type="monotone" dataKey="avgLow" stroke="#2D6A4F" strokeWidth={2.5} fill="url(#tempLow)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </div>

      {/* ── ALL PARKS OVERVIEW GRID ── */}
      <div>
        <h2 className="font-playfair font-bold text-xl text-safari-primary dark:text-dark-text mb-4">
          All Parks Overview
        </h2>
        {parks.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {parks.map(park => (
              <div
                key={park.id}
                id={`park-overview-${park.id}`}
                onClick={() => setSelectedPark(park.id)}
                className="cursor-pointer"
              >
                <ParkMiniCard
                  park={park}
                  weatherData={allParksWeather}
                  alerts={alerts}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
};
