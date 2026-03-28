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
  Activity
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { KENYA_PARKS } from '../../utils/parkBoundaries';

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
  const [search, setSearch] = useState('');
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedPark, setSelectedPark] = useState(null);
  const [mapStyle] = useState('https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [visibleTypes, setVisibleTypes] = useState(new Set(['park', 'reserve', 'conservancy', 'sanctuary', 'marine']));

  // Park statistics
  const parkStats = useMemo(() => {
    return KENYA_PARKS.reduce((acc, park) => {
      acc[park.type] = (acc[park.type] || 0) + 1;
      acc.total += 1;
      return acc;
    }, { total: 0 });
  }, []);

  // Filter types toggle
  const toggleType = (type) => {
    setVisibleTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  // Sync park markers visibility
  useEffect(() => {
    if (!mapLoaded) return;
    Object.entries(parkMarkers.current).forEach(([id, marker]) => {
      const park = KENYA_PARKS.find(p => p.id === id);
      if (visibleTypes.has(park.type)) {
        marker.addTo(map.current);
      } else {
        marker.remove();
      }
    });
  }, [visibleTypes, mapLoaded]);

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

      // STEP 3 — PREMIUM MAP CONTROLS
      map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
      map.current.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-right');
      map.current.addControl(new maplibregl.FullscreenControl(), 'top-right');

      map.current.on('load', () => {
        clearTimeout(initTimeout);
        map.current.resize();
        
        // Premium flyover animation on load
        map.current.flyTo({
          center: [37.9062, -1.2863], // Kenya center
          zoom: 6.5,
          duration: 3000,
          essential: true,
          pitch: 50
        });

        // STEP 2 — PREMIUM MAP RENDERING
        KENYA_PARKS.forEach(park => {
          const el = document.createElement('div');
          const size = park.type === 'park' ? 10 : 
                       park.type === 'reserve' ? 9 :
                       park.type === 'conservancy' ? 8 : 7;
          
          el.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background: ${park.color};
            border: 2px solid rgba(255,255,255,0.4);
            cursor: pointer;
            transition: transform 0.2s ease;
            box-shadow: 0 0 6px ${park.color}80;
          `;
          
          el.addEventListener('mouseenter', () => {
            el.style.transform = 'scale(1.8)';
            el.style.zIndex = '999';
          });
          el.addEventListener('mouseleave', () => {
            el.style.transform = 'scale(1)';
            el.style.zIndex = '1';
          });
          
          const popup = new maplibregl.Popup({
            closeButton: false,
            closeOnClick: false,
            maxWidth: '220px',
            offset: 15
          }).setHTML(`
            <div style="
              background: linear-gradient(135deg, #1A2E20 0%, #0D1F13 100%);
              color: #F0EDE8;
              padding: 12px 16px;
              border-radius: 12px;
              border: 1px solid ${park.color}60;
              font-family: DM Sans, sans-serif;
              box-shadow: 0 8px 32px rgba(0,0,0,0.4);
            ">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                <div style="width: 8px; height: 8px; border-radius: 50%; background: ${park.color}; flex-shrink: 0;"></div>
                <strong style="color: ${park.color}; font-size: 13px; line-height: 1.3;">${park.name}</strong>
              </div>
              <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: rgba(240,237,232,0.5); margin-bottom: 6px;">
                ${park.type}
              </div>
              <p style="font-size: 11px; color: rgba(240,237,232,0.7); margin: 0; line-height: 1.5;">${park.description}</p>
              <div style="margin-top: 8px; font-size: 10px; color: rgba(240,237,232,0.4);">Click to navigate</div>
            </div>
          `);
          
          el.addEventListener('mouseenter', () => popup.addTo(map.current));
          el.addEventListener('mouseleave', () => popup.remove());
          
          el.addEventListener('click', () => {
            map.current.flyTo({
              center: park.center,
              zoom: park.zoom,
              duration: 2000,
              essential: true,
              curve: 1.4
            });
            setSelectedPark(park);
          });
          
          const marker = new maplibregl.Marker({ element: el })
            .setLngLat(park.center)
            .setPopup(popup);
          
          parkMarkers.current[park.id] = marker;
          if (visibleTypes.has(park.type)) {
            marker.addTo(map.current);
          }
        });

        setMapLoaded(true);
      });

      map.current.on('error', (e) => {
        console.error('MapLibre error:', e);
        setMapError(`Map Engine Error: ${e.error?.message || 'Unknown error'}`);
      });
    } catch (err) {
      setMapError(`Critical Initialization Failure: ${err.message}`);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Driver Tracking Update
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const currentLocations = state.driverLocations || [];
    const currentSOS = state.sosAlerts || [];
    
    Object.keys(markers.current).forEach(id => {
      if (!currentLocations.find(l => l.driverId === id)) {
        markers.current[id].remove();
        delete markers.current[id];
      }
    });

    currentLocations.forEach(loc => {
      const driver = state.drivers.find(d => d.id === loc.driverId);
      if (!driver) return;

      const hasSOS = currentSOS.some(s => s.driverId === loc.driverId && s.status === 'Active');

      if (!markers.current[loc.driverId]) {
        const el = document.createElement('div');
        el.className = 'driver-marker-container';
        
        const inner = document.createElement('div');
        inner.className = `driver-marker-inner ${hasSOS ? 'sos-pulse' : loc.isOnline ? 'online-pulse' : 'offline'}`;
        inner.innerHTML = `<div class="marker-dot"></div>`;
        
        el.appendChild(inner);

        markers.current[loc.driverId] = new maplibregl.Marker({ element: el, zIndexOffset: 1000 })
          .setLngLat([loc.longitude, loc.latitude])
          .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(`
            <div class="driver-popup glass">
              <p class="driver-name">${driver.name}</p>
              <p class="driver-status ${hasSOS ? 'text-red-500' : ''}">${hasSOS ? '🆘 SOS ACTIVE' : loc.isOnline ? 'ONLINE' : 'OFFLINE'}</p>
              <div class="driver-meta">
                <span>${Math.round(loc.speed || 0)} km/h</span>
                <span>${loc.batteryLevel}% Bat</span>
              </div>
            </div>
          `))
          .addTo(map.current);
          
        el.addEventListener('click', () => setSelectedDriver(loc.driverId));
      } else {
        markers.current[loc.driverId].setLngLat([loc.longitude, loc.latitude]);
        const inner = markers.current[loc.driverId].getElement().firstChild;
        inner.className = `driver-marker-inner ${hasSOS ? 'sos-pulse' : loc.isOnline ? 'online-pulse' : 'offline'}`;
        
        if (loc.heading !== undefined) {
          inner.style.transform = `rotate(${loc.heading}deg)`;
        }
      }
    });
  }, [state.driverLocations, state.drivers, state.sosAlerts, mapLoaded]);

  const focusOnDriver = (loc) => {
    if (!map.current) return;
    map.current.flyTo({
      center: [loc.longitude, loc.latitude],
      zoom: 14,
      essential: true
    });
    setSelectedDriver(loc.driverId);
  };

  const filteredLocations = (state.driverLocations || []).filter(loc => {
    const driver = state.drivers.find(d => d.id === loc.driverId);
    return driver?.name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <PageWrapper title="Live Fleet Tracking">
      <div className="flex h-full gap-6 overflow-hidden">
        {/* STEP 5 — DRIVER PANEL INTEGRATION */}
        <div className="w-80 flex flex-col gap-4">
          <div className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-2xl p-4 shadow-sm">
             <div className="flex justify-between items-center mb-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">System Overview</h4>
                <Badge variant="outline" className="text-[9px] font-bold border-safari-gold/20 text-safari-gold bg-safari-gold/5">{parkStats.total} Areas</Badge>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <p className="text-2xl font-black text-safari-primary dark:text-safari-gold leading-none">{parkStats.total}</p>
                   <p className="text-[9px] text-gray-500 uppercase font-bold">Prot. Areas</p>
                </div>
                <div className="space-y-1">
                   <p className="text-2xl font-black text-emerald-500 leading-none">{state.driverLocations?.filter(l => l.isOnline).length || 0}</p>
                   <p className="text-[9px] text-gray-500 uppercase font-bold">Online</p>
                </div>
             </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-safari-gold/5 rounded-2xl blur-xl group-focus-within:bg-safari-gold/10 transition-all duration-500" />
            <div className="relative flex items-center bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-2xl px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-safari-gold/20 transition-all">
              <Search className="text-gray-400 mr-2" size={18} />
              <input 
                type="text" 
                placeholder="Search drivers..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent border-none text-sm outline-none font-dm-sans placeholder:text-gray-400 dark:text-white"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 p-1">
             {filteredLocations.map(loc => {
               const driver = state.drivers.find(d => d.id === loc.driverId);
               const isSelected = selectedDriver === loc.driverId;
               const hasSOS = state.sosAlerts?.some(s => s.driverId === loc.driverId && s.status === 'Active');
               
               // In Park Detection
               let currentPark = null;
               KENYA_PARKS.forEach(park => {
                 const dist = getDistance(loc.latitude, loc.longitude, park.center[1], park.center[0]);
                 if (dist < 15) currentPark = park;
               });

               return (
                 <button 
                   key={loc.driverId}
                   onClick={() => focusOnDriver(loc)}
                   className={`w-full p-4 rounded-2xl border transition-all text-left flex gap-3 relative overflow-hidden ${isSelected ? 'bg-safari-primary text-white border-safari-primary shadow-lg' : 'bg-white dark:bg-dark-card border-gray-100 dark:border-dark-border hover:border-safari-gold/30'}`}
                 >
                    {hasSOS && <div className="absolute top-0 right-0 w-1.5 h-full bg-red-500 animate-pulse" />}
                    <div className="relative">
                       <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${isSelected ? 'bg-white/20' : 'bg-safari-gold/10 text-safari-gold'}`}>
                          {driver?.name.charAt(0)}
                       </div>
                       <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 ${isSelected ? 'border-safari-primary' : 'border-white dark:border-dark-card'} ${loc.isOnline ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                       <div className="flex justify-between items-start">
                          <p className={`font-bold text-sm truncate ${isSelected ? 'text-white' : 'text-safari-primary dark:text-safari-gold'}`}>{driver?.name}</p>
                          {hasSOS && <Badge className="bg-red-500 text-[8px] animate-bounce">SOS</Badge>}
                       </div>
                       
                       {currentPark && (
                         <div className={`flex items-center gap-1.5 mt-0.5 ${isSelected ? 'text-white/80' : 'text-emerald-500'} text-[10px] font-bold`}>
                            <Trees size={10} />
                            <span>{currentPark.name}</span>
                         </div>
                       )}

                       <div className="flex items-center gap-3 mt-1.5">
                          <span className={`text-[10px] font-medium flex items-center gap-1 ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>
                             <Compass size={10} /> {Math.round(loc.speed || 0)} km/h
                          </span>
                          <span className={`text-[10px] font-medium flex items-center gap-1 ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>
                             <Battery size={10} className={parseInt(loc.batteryLevel) < 20 ? 'text-red-400' : ''} /> {loc.batteryLevel}%
                          </span>
                       </div>
                    </div>
                 </button>
               )
             })}
          </div>
        </div>

        {/* MAP CONTAINER */}
        <div className="flex-1 relative rounded-3xl overflow-hidden border border-gray-100 dark:border-dark-border shadow-2xl bg-[#0D1612]">
          <div 
            ref={mapContainer}
            className="w-full h-full"
            style={{ minHeight: '500px' }}
          />

          {/* STEP 4 — PREMIUM LEGEND OVERLAY */}
          {mapLoaded && (
            <div className="absolute bottom-10 left-6 z-10">
               <div className="bg-[#111B15]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl w-64 glass">
                  <div className="mb-4">
                     <h5 className="text-white font-bold text-sm">Protected Areas</h5>
                     <p className="text-white/40 text-[9px] uppercase tracking-tighter">Kenya Wildlife Database</p>
                  </div>
                  
                  <div className="space-y-2">
                     {[
                       { type: 'park', label: 'National Parks', color: '#2D6A4F', icon: ShieldCheck },
                       { type: 'reserve', label: 'Game Reserves', color: '#1B4332', icon: Trees },
                       { type: 'conservancy', label: 'Conservancies', color: '#C9A84C', icon: Activity },
                       { type: 'sanctuary', label: 'Sanctuaries', color: '#E76F51', icon: Info },
                       { type: 'marine', label: 'Marine Parks', color: '#1E6091', icon: Waves },
                     ].map(item => (
                       <button
                         key={item.type}
                         onClick={() => toggleType(item.type)}
                         className={`w-full flex items-center justify-between p-2 rounded-xl transition-all ${visibleTypes.has(item.type) ? 'bg-white/5 border border-white/10' : 'opacity-40 grayscale hover:opacity-70'}`}
                       >
                         <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                            <span className="text-[10px] text-white/80 font-medium">{item.label}</span>
                         </div>
                         <span className="text-[9px] text-white/30 font-black">{parkStats[item.type] || 0}</span>
                       </button>
                     ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/5 flex gap-2">
                     <button 
                       onClick={() => setVisibleTypes(new Set(['park', 'reserve', 'conservancy', 'sanctuary', 'marine']))}
                       className="flex-1 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-safari-gold transition-colors"
                     >
                        Show All
                     </button>
                     <button 
                       onClick={() => setVisibleTypes(new Set())}
                       className="flex-1 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-red-400 transition-colors"
                     >
                        Hide All
                     </button>
                  </div>
               </div>
            </div>
          )}
          
          {!mapLoaded && !mapError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0D1612] z-50">
              <div className="w-24 h-24 relative mb-6">
                <div className="absolute inset-0 border-4 border-safari-gold/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-t-safari-gold rounded-full animate-spin" />
                <MapIcon className="absolute inset-0 m-auto text-safari-gold w-8 h-8 opacity-50" />
              </div>
              <p className="text-white font-dm-sans font-bold text-lg tracking-tight">Initializing Global Tracking</p>
              <p className="text-white/40 text-[10px] mt-2 uppercase tracking-[0.2em] font-medium">Eastern Vacations Secure Systems</p>
            </div>
          )}

          {mapError && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-safari-primary/95 backdrop-blur-md z-[60] p-8 text-center">
                <AlertCircle className="text-red-500 w-12 h-12 mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Map Interface Failure</h3>
                <p className="text-gray-300 max-w-md mb-8">{mapError}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="bg-safari-gold text-safari-primary px-10 py-3 rounded-2xl font-bold"
                >
                  Restart Engine
                </button>
             </div>
          )}
        </div>
      </div>
      
      <style>{`
        .glass {
          background: rgba(17, 27, 21, 0.8) !important;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
        
        .driver-marker-inner {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 4px 15px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .marker-dot {
          width: 6px;
          height: 6px;
          background: white;
          border-radius: 50%;
        }
        
        .online-pulse {
          background: #D4AF37; /* Safari Gold */
          animation: pulse-gold 2s infinite;
        }
        
        .sos-pulse {
          background: #ef4444; /* Red 500 */
          animation: pulse-red 1s infinite;
          border-color: #fca5a5;
          z-index: 1000;
        }
        
        .offline {
          background: #9ca3af; /* Gray 400 */
        }
        
        .driver-popup {
          padding: 12px;
          border-radius: 16px;
          color: white;
          border: 1px solid rgba(255,255,255,0.1);
          min-width: 140px;
        }
        
        .driver-name {
          font-weight: 800;
          font-size: 14px;
          margin-bottom: 2px;
        }
        
        .driver-status {
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1px;
          text-transform: uppercase;
          opacity: 0.6;
          margin-bottom: 8px;
        }
        
        .driver-meta {
          display: flex;
          justify-content: space-between;
          font-weight: 700;
          font-size: 10px;
          color: rgba(255,255,255,0.5);
        }

        @keyframes pulse-gold {
          0% { box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(212, 175, 55, 0); }
          100% { box-shadow: 0 0 0 0 rgba(212, 175, 55, 0); }
        }
        
        @keyframes pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); transform: scale(1); }
          50% { transform: scale(1.1); }
          70% { box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); transform: scale(1); }
        }

        .maplibregl-popup-content {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        
        .maplibregl-popup-tip {
          border-top-color: #0D1F13 !important;
        }
      `}</style>
    </PageWrapper>
  );
};
