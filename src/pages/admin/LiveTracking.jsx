import 'maplibre-gl/dist/maplibre-gl.css';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { useData } from '../../contexts/DataContext';
import maplibregl from 'maplibre-gl';
import { 
  Search, 
  Navigation, 
  Info, 
  Maximize2, 
  Map as MapIcon, 
  Layers, 
  Zap, 
  Battery, 
  User, 
  Compass, 
  Loader2, 
  MapPin, 
  AlertCircle,
  Trees,
  Waves,
  ShieldCheck,
  Activity,
  Phone,
  Clock,
  LayoutGrid
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { KENYA_PARKS } from '../../utils/parkBoundaries';
import { KENYA_LODGES } from '../../utils/lodgesData';
import { KENYA_GATES } from '../../utils/gatesData';

// Helper for distance calculation (Haversine formula)
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; 
};

export const LiveTracking = () => {
  const { state } = useData();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef({});
  const parkMarkers = useRef({});
  const lodgeMarkers = useRef({});
  const gateMarkers = useRef({});
  
  const [search, setSearch] = useState('');
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedPark, setSelectedPark] = useState(null);
  const [mapStyle] = useState('https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  
  // Layer Toggles
  const [showParks, setShowParks] = useState(true);
  const [showLodges, setShowLodges] = useState(true);
  const [showGates, setShowGates] = useState(true);
  const [showDrivers, setShowDrivers] = useState(true);

  // Statistics
  const stats = useMemo(() => {
    return {
      parks: KENYA_PARKS.length,
      lodges: KENYA_LODGES.length,
      gates: KENYA_GATES.length,
      online: state.driverLocations?.filter(l => l.isOnline).length || 0,
      sos: state.sosAlerts?.filter(s => s.status === 'Active').length || 0
    };
  }, [state.driverLocations, state.sosAlerts]);

  // Sync Markers Visibility
  useEffect(() => {
    if (!mapLoaded) return;
    
    // Parks
    Object.values(parkMarkers.current).forEach(m => showParks ? m.addTo(map.current) : m.remove());
    // Lodges
    Object.values(lodgeMarkers.current).forEach(m => showLodges ? m.addTo(map.current) : m.remove());
    // Gates
    Object.values(gateMarkers.current).forEach(m => showGates ? m.addTo(map.current) : m.remove());
    // Drivers
    Object.values(markers.current).forEach(m => showDrivers ? m.addTo(map.current) : m.remove());
    
  }, [showParks, showLodges, showGates, showDrivers, mapLoaded]);

  // Initial Map Load
  useEffect(() => {
    if (map.current) return;
    if (!mapContainer.current) return;
    
    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: mapStyle,
        center: [36.8219, -1.2921], 
        zoom: 6,
        pitch: 45
      });

      const initTimeout = setTimeout(() => {
        if (!mapLoaded) {
          setMapError('Map failed to initialize. Please check your network connection.');
        }
      }, 10000);

      map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
      map.current.addControl(new maplibregl.FullscreenControl(), 'top-right');

      map.current.on('load', () => {
        clearTimeout(initTimeout);
        map.current.resize();
        
        // Premium flyover
        map.current.flyTo({
          center: [37.9062, -1.2863],
          zoom: 6.5,
          duration: 3000,
          essential: true,
          pitch: 50
        });

        // 1. Render Parks
        KENYA_PARKS.forEach(park => {
          const el = document.createElement('div');
          el.style.cssText = `
            width: 10px; height: 10px; border-radius: 50%;
            background: ${park.color}; border: 2px solid white;
            cursor: pointer; transition: transform 0.2s ease;
          `;
          
          el.addEventListener('mouseenter', () => el.style.transform = 'scale(1.8)');
          el.addEventListener('mouseleave', () => el.style.transform = 'scale(1)');
          
          const popup = new maplibregl.Popup({ offset: 15, closeButton: false })
            .setHTML(`
              <div style="background: #111B15; color: white; padding: 12px; border-radius: 12px; border: 1px solid ${park.color}60; font-family: 'DM Sans', sans-serif;">
                <div style="color: ${park.color}; font-weight: 800; font-size: 14px;">${park.name}</div>
                <div style="font-size: 10px; opacity: 0.5; margin-bottom: 4px;">NATIONAL ${park.type.toUpperCase()}</div>
                <p style="font-size: 11px; line-height: 1.4; margin: 0;">${park.description}</p>
              </div>
            `);

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat(park.center)
            .setPopup(popup);
          
          parkMarkers.current[park.id] = marker;
          marker.addTo(map.current);
        });

        // 2. Render Lodges & Camps
        KENYA_LODGES.forEach(lodge => {
          const el = document.createElement('div');
          const icon = lodge.type === 'tented_camp' ? '⛺' : '🏨';
          el.innerHTML = icon;
          el.style.cssText = 'font-size: 14px; cursor: pointer; transition: transform 0.2s ease; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));';
          
          el.addEventListener('mouseenter', () => el.style.transform = 'scale(1.5)');
          el.addEventListener('mouseleave', () => el.style.transform = 'scale(1)');
          
          const stars = '★'.repeat(lodge.stars) + '☆'.repeat(5 - lodge.stars);
          const popup = new maplibregl.Popup({ offset: 15, closeButton: false })
            .setHTML(`
              <div style="background: linear-gradient(135deg, #1A1A2E 0%, #16162A 100%); color: #F0EDE8; padding: 14px; border-radius: 12px; border: 1px solid #C9A84C40; min-width: 200px;">
                <div style="font-size: 10px; text-transform: uppercase; color: #C9A84C; letter-spacing: 1px;">${lodge.type.replace('_', ' ')}</div>
                <div style="font-weight: 700; font-size: 15px; margin: 2px 0;">${lodge.name}</div>
                <div style="color: #C9A84C; font-size: 12px; margin-bottom: 8px;">${stars}</div>
                <p style="font-size: 11px; opacity: 0.7; margin-bottom: 8px;">${lodge.description}</p>
                <div style="font-size: 10px; color: #C9A84C;">📍 ${lodge.parkName}</div>
                ${lodge.phone ? `<div style="font-size: 10px; margin-top: 4px; opacity: 0.5;">📞 ${lodge.phone}</div>` : ''}
              </div>
            `);

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat(lodge.center)
            .setPopup(popup);
          
          lodgeMarkers.current[lodge.id] = marker;
          marker.addTo(map.current);
        });

        // 3. Render Gates
        KENYA_GATES.forEach(gate => {
          const el = document.createElement('div');
          el.innerHTML = '🚧';
          el.style.cssText = 'font-size: 13px; cursor: pointer; transition: transform 0.2s ease;';
          
          el.addEventListener('mouseenter', () => el.style.transform = 'scale(1.5)');
          el.addEventListener('mouseleave', () => el.style.transform = 'scale(1)');
          
          const popup = new maplibregl.Popup({ offset: 15, closeButton: false })
            .setHTML(`
              <div style="background: #111; color: white; padding: 14px; border-radius: 12px; border: 1px solid rgba(231,111,81,0.4); min-width: 180px;">
                <div style="font-size: 10px; color: #E76F51; font-weight: 800;">ENTRY GATE</div>
                <div style="font-weight: 700; font-size: 14px; margin: 2px 0;">${gate.name}</div>
                <p style="font-size: 11px; opacity: 0.6; margin-bottom: 8px;">${gate.direction}</p>
                <div style="font-size: 10px; color: #C9A84C;">⏰ ${gate.openHours}</div>
              </div>
            `);

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat(gate.center)
            .setPopup(popup);
          
          gateMarkers.current[gate.id] = marker;
          marker.addTo(map.current);
        });

        setMapLoaded(true);
      });

      map.current.on('error', (e) => setMapError(`Map Engine Error: ${e.error?.message || 'Unknown error'}`));
    } catch (err) {
      setMapError(`Critical Failure: ${err.message}`);
    }

    return () => map.current?.remove();
  }, [mapStyle]);

  // Driver Real-time updates
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const currentLocations = state.driverLocations || [];
    
    currentLocations.forEach(loc => {
      const driver = state.drivers.find(d => d.id === loc.driverId);
      if (!driver) return;
      const hasSOS = state.sosAlerts?.some(s => s.driverId === loc.driverId && s.status === 'Active');

      if (!markers.current[loc.driverId]) {
        const el = document.createElement('div');
        el.className = 'driver-marker-container';
        const inner = document.createElement('div');
        inner.className = `driver-marker-inner ${hasSOS ? 'sos-pulse' : loc.isOnline ? 'online-pulse' : 'offline'}`;
        inner.innerHTML = '<div class="marker-dot"></div>';
        el.appendChild(inner);

        const marker = new maplibregl.Marker({ element: el, zIndexOffset: 1000 })
          .setLngLat([loc.longitude, loc.latitude])
          .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(`
            <div class="driver-popup glass">
              <div class="driver-name">${driver.name}</div>
              <div class="driver-status ${hasSOS ? 'text-red-500' : ''}">${hasSOS ? '🆘 SOS ACTIVE' : loc.isOnline ? 'ONLINE' : 'OFFLINE'}</div>
              <div class="driver-meta">
                <span>${Math.round(loc.speed || 0)} km/h</span>
                <span>${loc.batteryLevel}% Bat</span>
              </div>
            </div>
          `));
          
        if (showDrivers) marker.addTo(map.current);
        markers.current[loc.driverId] = marker;
      } else {
        markers.current[loc.driverId].setLngLat([loc.longitude, loc.latitude]);
        const inner = markers.current[loc.driverId].getElement().firstChild;
        inner.className = `driver-marker-inner ${hasSOS ? 'sos-pulse' : loc.isOnline ? 'online-pulse' : 'offline'}`;
      }
    });

    Object.keys(markers.current).forEach(id => {
      if (!currentLocations.find(l => l.driverId === id)) {
        markers.current[id].remove();
        delete markers.current[id];
      }
    });
  }, [state.driverLocations, state.drivers, state.sosAlerts, mapLoaded, showDrivers]);

  const handleFlyTo = (center, zoom = 12) => {
    map.current?.flyTo({ center, zoom, duration: 2000, essential: true, pitch: 45 });
  };

  // Advanced Search Logic
  const searchResults = useMemo(() => {
    if (!search) return { parks: [], lodges: [], gates: [], drivers: [] };
    const q = search.toLowerCase();
    return {
      parks: KENYA_PARKS.filter(p => p.name.toLowerCase().includes(q)).slice(0, 3),
      lodges: KENYA_LODGES.filter(l => l.name.toLowerCase().includes(q)).slice(0, 5),
      gates: KENYA_GATES.filter(g => g.name.toLowerCase().includes(q)).slice(0, 3),
      drivers: (state.driverLocations || []).filter(l => {
        const d = state.drivers.find(dr => dr.id === l.driverId);
        return d?.name.toLowerCase().includes(q);
      }).slice(0, 5)
    };
  }, [search, state.drivers, state.driverLocations]);

  const hasAnyResults = search && (searchResults.parks.length > 0 || searchResults.lodges.length > 0 || searchResults.gates.length > 0 || searchResults.drivers.length > 0);

  return (
    <PageWrapper title="Operations Command Center">
      <div className="flex h-full gap-6 overflow-hidden">
        {/* LEFT SEARCH & CONTROL PANEL */}
        <div className="w-80 flex flex-col gap-4">
          <div className="relative z-20">
            <div className={`flex items-center bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-2xl px-4 py-3 shadow-xl transition-all ${hasAnyResults ? 'rounded-b-none' : ''}`}>
              <Search className="text-gray-400 mr-2" size={18} />
              <input 
                type="text" 
                placeholder="Search parks, lodges, gates, drivers..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent border-none text-sm outline-none font-dm-sans placeholder:text-gray-400 dark:text-white"
              />
            </div>

            {hasAnyResults && (
              <div className="absolute top-full left-0 w-full bg-white dark:bg-dark-card border-x border-b border-gray-100 dark:border-dark-border rounded-b-2xl shadow-2xl max-h-96 overflow-y-auto no-scrollbar py-2">
                {searchResults.drivers.map(loc => {
                  const d = state.drivers.find(dr => dr.id === loc.driverId);
                  return (
                    <button key={loc.driverId} onClick={() => { handleFlyTo([loc.longitude, loc.latitude]); setSearch(''); }} className="w-full px-4 py-2 hover:bg-safari-gold/10 text-left flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-bold dark:text-white truncate">{d?.name}</div>
                        <div className="text-[9px] text-gray-400">Driver • Active</div>
                      </div>
                    </button>
                  );
                })}
                {searchResults.lodges.map(lodge => (
                  <button key={lodge.id} onClick={() => { handleFlyTo(lodge.center); setSearch(''); }} className="w-full px-4 py-2 hover:bg-safari-gold/10 text-left flex items-center gap-3">
                    <span className="text-sm">{lodge.type === 'tented_camp' ? '⛺' : '🏨'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold dark:text-white truncate">{lodge.name}</div>
                      <div className="text-[9px] text-gray-400">Lodge • {lodge.parkName}</div>
                    </div>
                  </button>
                ))}
                {searchResults.parks.map(park => (
                  <button key={park.id} onClick={() => { handleFlyTo(park.center, 10); setSearch(''); }} className="w-full px-4 py-2 hover:bg-safari-gold/10 text-left flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ background: park.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold dark:text-white truncate">{park.name}</div>
                      <div className="text-[9px] text-gray-400">Protected Area</div>
                    </div>
                  </button>
                ))}
                {searchResults.gates.map(gate => (
                  <button key={gate.id} onClick={() => { handleFlyTo(gate.center, 14); setSearch(''); }} className="w-full px-4 py-2 hover:bg-safari-gold/10 text-left flex items-center gap-3">
                    <span className="text-sm">🚧</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold dark:text-white truncate">{gate.name}</div>
                      <div className="text-[9px] text-gray-400">Entry Gate</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* DRIVER LIST */}
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
             {(state.driverLocations || []).map(loc => {
               const driver = state.drivers.find(d => d.id === loc.driverId);
               const hasSOS = state.sosAlerts?.some(s => s.driverId === loc.driverId && s.status === 'Active');
               return (
                 <button key={loc.driverId} onClick={() => handleFlyTo([loc.longitude, loc.latitude])} className={`w-full p-4 rounded-2xl border transition-all text-left flex gap-3 relative ${selectedDriver === loc.driverId ? 'bg-safari-primary border-safari-primary shadow-lg' : 'bg-white dark:bg-dark-card border-gray-100 dark:border-dark-border hover:border-safari-gold/30'}`}>
                    {hasSOS && <div className="absolute top-0 right-0 w-1.5 h-full bg-red-500 animate-pulse" />}
                    <div className="w-10 h-10 rounded-xl bg-safari-gold/10 text-safari-gold flex items-center justify-center font-bold text-sm">
                      {driver?.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className={`font-bold text-xs truncate ${selectedDriver === loc.driverId ? 'text-white' : 'dark:text-white'}`}>{driver?.name}</p>
                        {hasSOS && <Badge className="bg-red-500 text-[8px]">SOS</Badge>}
                      </div>
                      <div className="flex items-center gap-2 mt-1 opacity-60">
                         <span className="text-[9px] flex items-center gap-1"><Compass size={8}/> {Math.round(loc.speed || 0)}km/h</span>
                         <span className="text-[9px] flex items-center gap-1"><Battery size={8}/> {loc.batteryLevel}%</span>
                      </div>
                    </div>
                 </button>
               );
             })}
          </div>
        </div>

        {/* MAP & COMMAND LAYERS */}
        <div className="flex-1 relative rounded-3xl overflow-hidden shadow-2xl bg-[#0D1612]">
          <div ref={mapContainer} className="w-full h-full" style={{ minHeight: '500px' }} />

          {/* LAYER TOGGLE PANEL */}
          <div className="absolute top-6 left-6 z-10">
            <div className="bg-[#111B15]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl w-56 glass">
              <div className="flex items-center gap-2 mb-4">
                <LayoutGrid className="text-safari-gold" size={16} />
                <span className="text-white font-bold text-xs">Map Layers</span>
              </div>
              <div className="space-y-1.5">
                {[
                  { id: 'parks', label: 'National Parks', icon: '🌿', state: showParks, setter: setShowParks },
                  { id: 'lodges', label: 'Lodges & Camps', icon: '🏨', state: showLodges, setter: setShowLodges },
                  { id: 'gates', label: 'Entry Gates', icon: '🚧', state: showGates, setter: setShowGates },
                  { id: 'drivers', label: 'Live Drivers', icon: '📍', state: showDrivers, setter: setShowDrivers },
                ].map(layer => (
                  <button key={layer.id} onClick={() => layer.setter(!layer.state)} className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all ${layer.state ? 'bg-white/10 border border-white/10' : 'opacity-40 grayscale'}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-sm">{layer.icon}</span>
                      <span className="text-[10px] text-white/80 font-bold">{layer.label}</span>
                    </div>
                    <div className={`w-6 h-3 rounded-full relative transition-colors ${layer.state ? 'bg-safari-gold' : 'bg-white/20'}`}>
                      <div className={`absolute top-0.5 h-2 w-2 rounded-full bg-white transition-all ${layer.state ? 'right-0.5' : 'left-0.5'}`} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* OPS STATS STRIP */}
          <div className="absolute bottom-6 left-0 right-0 px-6 z-10">
            <div className="bg-safari-primary/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center justify-around shadow-2xl glass">
              <div className="flex flex-col items-center">
                <span className="text-emerald-500 font-black text-lg leading-none">{stats.online}</span>
                <span className="text-[8px] text-white/50 uppercase font-bold mt-1">Drivers Online</span>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="flex flex-col items-center">
                <span className={`font-black text-lg leading-none ${stats.sos > 0 ? 'text-red-500 animate-pulse' : 'text-white/20'}`}>{stats.sos}</span>
                <span className="text-[8px] text-white/50 uppercase font-bold mt-1">SOS Active</span>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="flex flex-col items-center">
                <span className="text-safari-gold font-black text-lg leading-none">{stats.lodges}</span>
                <span className="text-[8px] text-white/50 uppercase font-bold mt-1">Lodges Mapped</span>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="flex flex-col items-center">
                <span className="text-emerald-400 font-black text-lg leading-none">{stats.parks}</span>
                <span className="text-[8px] text-white/50 uppercase font-bold mt-1">Protected Areas</span>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="flex flex-col items-center">
                <span className="text-orange-400 font-black text-lg leading-none">{stats.gates}</span>
                <span className="text-[8px] text-white/50 uppercase font-bold mt-1">Entry Gates</span>
              </div>
            </div>
          </div>

          {!mapLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0D1612] z-50">
              <div className="w-16 h-16 border-4 border-safari-gold/20 border-t-safari-gold rounded-full animate-spin" />
              <p className="text-white/40 text-[10px] mt-4 uppercase tracking-widest">Initializing Ops Command</p>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        .glass { background: rgba(17, 27, 21, 0.8) !important; backdrop-filter: blur(16px); }
        .driver-marker-inner { width: 28px; height: 28px; border-radius: 50%; border: 2px solid white; box-shadow: 0 4px 15px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; transition: all 0.5s; }
        .marker-dot { width: 6px; height: 6px; background: white; border-radius: 50%; }
        .online-pulse { background: #D4AF37; animation: pulse-gold 2s infinite; }
        .sos-pulse { background: #ef4444; animation: pulse-red 1s infinite; z-index: 1000; }
        .offline { background: #9ca3af; }
        .driver-popup { padding: 12px; border-radius: 16px; color: white; min-width: 140px; }
        .driver-name { font-weight: 800; font-size: 13px; margin-bottom: 2px; }
        .driver-status { font-size: 9px; font-weight: 800; text-transform: uppercase; opacity: 0.6; margin-bottom: 6px; }
        .driver-meta { display: flex; justify-content: space-between; font-size: 9px; color: rgba(255,255,255,0.5); }
        @keyframes pulse-gold { 0% { box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(212, 175, 55, 0); } 100% { box-shadow: 0 0 0 0 rgba(212, 175, 55, 0); } }
        @keyframes pulse-red { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); transform: scale(1); } 50% { transform: scale(1.1); } 70% { box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); transform: scale(1); } }
        .maplibregl-popup-content { background: transparent !important; border: none !important; box-shadow: none !important; padding: 0 !important; }
        .maplibregl-popup-tip { border-top-color: #111B15 !important; }
      `}</style>
    </PageWrapper>
  );
};
