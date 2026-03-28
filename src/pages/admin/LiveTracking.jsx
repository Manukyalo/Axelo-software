import 'mapbox-gl/dist/mapbox-gl.css';
import React, { useEffect, useRef, useState } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { useData } from '../../contexts/DataContext';
import mapboxgl from 'mapbox-gl';
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
  AlertCircle
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

export const LiveTracking = () => {
  const { state } = useData();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef({});
  const [search, setSearch] = useState('');
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/dark-v11');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);

  const addParkLayers = () => {
    if (!map.current) return;
    
    // Check if source already exists to avoid errors
    if (map.current.getSource('parks')) return;

    const parks = {
      'type': 'FeatureCollection',
      'features': [
        {
          'type': 'Feature',
          'properties': { 'name': 'Maasai Mara National Reserve' },
          'geometry': {
            'type': 'Polygon',
            'coordinates': [[
              [34.8, -1.2], [35.2, -1.2], [35.4, -1.5], [35.1, -1.8], [34.7, -1.6], [34.8, -1.2]
            ]]
          }
        },
        {
          'type': 'Feature',
          'properties': { 'name': 'Amboseli National Park' },
          'geometry': {
            'type': 'Polygon',
            'coordinates': [[
              [37.1, -2.6], [37.4, -2.6], [37.5, -2.8], [37.2, -2.9], [37.0, -2.7], [37.1, -2.6]
            ]]
          }
        },
        {
          'type': 'Feature',
          'properties': { 'name': 'Tsavo West National Park' },
          'geometry': {
            'type': 'Polygon',
            'coordinates': [[
              [37.8, -2.8], [38.3, -3.0], [38.4, -3.4], [37.9, -3.5], [37.7, -3.1], [37.8, -2.8]
            ]]
          }
        }
      ]
    };

    map.current.addSource('parks', {
      'type': 'geojson',
      'data': parks
    });

    map.current.addLayer({
      'id': 'parks-layer',
      'type': 'fill',
      'source': 'parks',
      'layout': {},
      'paint': {
        'fill-color': '#10b981',
        'fill-opacity': 0.2,
        'fill-outline-color': '#059669'
      }
    });

    map.current.addLayer({
      'id': 'park-labels',
      'type': 'symbol',
      'source': 'parks',
      'layout': {
        'text-field': ['get', 'name'],
        'text-size': 11,
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-offset': [0, 0.6],
        'text-anchor': 'top'
      },
      'paint': {
        'text-color': '#10b981',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1
      }
    });
  };

  // Force resize effect
  useEffect(() => {
    if (map.current && mapLoaded) {
      console.log('Forcing map resize on mount/load');
      map.current.resize();
    }
  }, [mapLoaded]);

  // Initialize Map
  useEffect(() => {
    if (map.current) return;
    if (!mapContainer.current) return;
    
    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    console.log('Mapbox token verification:', token ? `${token.substring(0, 20)}...` : 'MISSING');
    
    if (!token) {
      setMapError('Mapbox token is missing from environment variables.');
      return;
    }
    
    mapboxgl.accessToken = token;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapStyle,
        center: [36.8219, -1.2921], // Center on Kenya
        zoom: 6,
        pitch: 45
      });

      // Add initialization timeout [FIX 2]
      const initTimeout = setTimeout(() => {
        if (!mapLoaded) {
          console.error('Map initialization timed out after 10 seconds');
          setMapError('Map failed to initialize. Please check your network connection and token validity.');
        }
      }, 10000);

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on('load', () => {
        console.log('Map engine loaded successfully');
        clearTimeout(initTimeout);
        map.current.resize(); // Force resize on load [FIX 3]
        setMapLoaded(true);
        addParkLayers();
      });

      map.current.on('style.load', () => {
        addParkLayers();
      });

      map.current.on('error', (e) => {
        console.error('Mapbox error event:', e.error);
        setMapError(`Map Engine Error: ${e.error?.message || 'Unknown error occurred'}`);
      });
    } catch (err) {
      console.error('Map initialization try-catch error:', err);
      setMapError(`Critical Initialization Failure: ${err.message}`);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update style when mapStyle state changes
  useEffect(() => {
    if (map.current && mapLoaded) {
      map.current.setStyle(mapStyle);
    }
  }, [mapStyle, mapLoaded]);

  // Sync Markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const currentLocations = state.driverLocations || [];
    
    // Remove old markers for drivers no longer in list
    Object.keys(markers.current).forEach(id => {
      if (!currentLocations.find(l => l.driverId === id)) {
        markers.current[id].remove();
        delete markers.current[id];
      }
    });

    currentLocations.forEach(loc => {
      const driver = state.drivers.find(d => d.id === loc.driverId);
      if (!driver) return;

      if (!markers.current[loc.driverId]) {
        // Create custom marker element
        const el = document.createElement('div');
        el.className = 'driver-marker';
        
        const inner = document.createElement('div');
        inner.className = `w-8 h-8 rounded-full border-2 border-white shadow-xl flex items-center justify-center transition-all duration-500 ${loc.isOnline ? 'bg-safari-gold animate-pulse-subtle' : 'bg-gray-400'}`;
        inner.innerHTML = `<div class="w-1.5 h-1.5 bg-white rounded-full"></div>`;
        
        el.appendChild(inner);

        markers.current[loc.driverId] = new mapboxgl.Marker(el)
          .setLngLat([loc.longitude, loc.latitude])
          .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div class="p-2 font-dm-sans bg-white dark:bg-dark-card rounded-xl">
              <p class="font-bold text-sm text-gray-900 dark:text-white">${driver.name}</p>
              <p class="text-[10px] uppercase text-gray-500 font-bold">${loc.isOnline ? 'Online' : 'Offline'}</p>
              <p class="text-[10px] text-safari-gold mt-1 font-bold">${loc.speed ? `${Math.round(loc.speed)} km/h` : 'Stationary'}</p>
            </div>
          `))
          .addTo(map.current);
          
        el.addEventListener('click', () => setSelectedDriver(loc.driverId));
      } else {
        // Update existing marker
        markers.current[loc.driverId].setLngLat([loc.longitude, loc.latitude]);
        const inner = markers.current[loc.driverId].getElement().firstChild;
        inner.className = `w-8 h-8 rounded-full border-2 border-white shadow-xl flex items-center justify-center transition-all duration-500 ${loc.isOnline ? 'bg-safari-gold animate-pulse-subtle' : 'bg-gray-400'}`;
        
        // Update heading rotation if available
        if (loc.heading !== undefined) {
          inner.style.transform = `rotate(${loc.heading}deg)`;
        }
      }
    });
  }, [state.driverLocations, state.drivers, mapLoaded]);

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
        {/* Sidebar */}
        <div className="w-80 flex flex-col gap-4">
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
               return (
                 <button 
                   key={loc.driverId}
                   onClick={() => focusOnDriver(loc)}
                   className={`w-full p-4 rounded-2xl border transition-all text-left flex gap-3 ${isSelected ? 'bg-safari-primary text-white border-safari-primary shadow-lg shadow-safari-primary/20' : 'bg-white dark:bg-dark-card border-gray-100 dark:border-dark-border hover:border-safari-gold/30 hover:shadow-md'}`}
                 >
                    <div className="relative">
                       <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${isSelected ? 'bg-white/20' : 'bg-safari-gold/10 text-safari-gold'}`}>
                          {driver?.name.charAt(0)}
                       </div>
                       <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 ${isSelected ? 'border-safari-primary' : 'border-white dark:border-dark-card'} ${loc.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className={`font-bold text-sm truncate ${isSelected ? 'text-white' : 'text-safari-primary dark:text-safari-gold'}`}>{driver?.name}</p>
                       <div className="flex items-center gap-3 mt-1 underline-none">
                          <span className={`text-[10px] font-medium flex items-center gap-1 ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>
                             <Compass size={10} /> {Math.round(loc.speed || 0)} km/h
                          </span>
                          <span className={`text-[10px] font-medium flex items-center gap-1 ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>
                             <Battery size={10} className={parseInt(loc.batteryLevel) < 20 ? 'text-red-400' : ''} /> {loc.batteryLevel}%
                          </span>
                       </div>
                    </div>
                    {isSelected && <Navigation size={16} className="text-safari-gold shrink-0 mt-1" />}
                 </button>
               )
             })}
          </div>
        </div>

        {/* Map Container Wrapper */}
        <div className="flex-1 relative rounded-3xl overflow-hidden border border-gray-100 dark:border-dark-border shadow-2xl bg-safari-primary">
          <div 
            ref={mapContainer}
            className="w-full"
            style={{
              width: '100%',
              height: 'calc(100vh - 180px)',
              minHeight: '500px',
              borderRadius: '16px'
            }}
          />
          
          {/* Loading State Overlay */}
          {!mapLoaded && !mapError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-safari-primary z-50">
              <Loader2 className="w-12 h-12 text-safari-gold animate-spin mb-4" />
              <p className="text-white font-dm-sans font-medium animate-pulse">Initializing Map Engine...</p>
              <p className="text-white/50 text-[10px] mt-2 uppercase tracking-widest">Establishing Secure Connection</p>
            </div>
          )}

          {/* Error State Overlay [FIX 7] */}
          {mapError && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-safari-primary/95 backdrop-blur-md z-[60] p-8 text-center">
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
                   <AlertCircle className="text-red-500 w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 font-playfair">Map Failed to Load</h3>
                <p className="text-gray-300 max-w-md mb-8 font-dm-sans">
                   {mapError}
                </p>
                <div className="flex gap-4">
                   <button 
                     onClick={() => window.location.reload()}
                     className="bg-safari-gold text-safari-primary px-8 py-3 rounded-2xl font-bold hover:bg-white transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-safari-gold/20"
                   >
                     Retry Initialization
                   </button>
                </div>
                <p className="mt-8 text-[10px] text-gray-500 uppercase tracking-[0.2em]">
                   Eastern Vacations Systems Integrity Monitor
                </p>
             </div>
          )}
          
          {/* Map Style Controls */}
          {mapLoaded && (
            <div className="absolute top-6 left-6 flex flex-col gap-2 z-10">
               <button 
                 onClick={() => setMapStyle('mapbox://styles/mapbox/dark-v11')}
                 className={`p-3 rounded-xl shadow-xl transition-all ${mapStyle.includes('dark') ? 'bg-safari-gold text-white' : 'bg-white dark:bg-dark-card text-gray-500 hover:text-safari-gold'}`}
                 title="Dark Mode"
               >
                  <Layers size={20} />
               </button>
               <button 
                 onClick={() => setMapStyle('mapbox://styles/mapbox/light-v11')}
                 className={`p-3 rounded-xl shadow-xl transition-all ${mapStyle.includes('light') ? 'bg-safari-gold text-white' : 'bg-white dark:bg-dark-card text-gray-500 hover:text-safari-gold'}`}
                 title="Light Mode"
               >
                  <Navigation size={20} />
               </button>
               <button 
                 onClick={() => setMapStyle('mapbox://styles/mapbox/satellite-v9')}
                 className={`p-3 rounded-xl shadow-xl transition-all ${mapStyle.includes('satellite') ? 'bg-safari-gold text-white' : 'bg-white dark:bg-dark-card text-gray-500 hover:text-safari-gold'}`}
                 title="Satellite View"
               >
                  <MapIcon size={20} />
               </button>
            </div>
          )}

          {/* Quick Stats Overlay */}
          {mapLoaded && (
            <div className="absolute bottom-6 right-6 flex gap-4 z-10">
               <div className="bg-white/90 dark:bg-dark-card/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/20 dark:border-dark-border flex gap-6 items-center">
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                        {state.driverLocations?.filter(l => l.isOnline).length || 0} Drivers Online
                     </span>
                  </div>
                  <div className="w-px h-4 bg-gray-200 dark:bg-dark-border" />
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-red-500 animate-bounce" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                        {state.sosAlerts?.filter(s => s.status === 'Active').length || 0} SOS Active
                     </span>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        .mapboxgl-popup-content {
          border-radius: 16px !important;
          padding: 0 !important;
          overflow: hidden !important;
          border: 1px solid rgba(0,0,0,0.05) !important;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1) !important;
        }
        .mapboxgl-popup-close-button {
          padding: 4px 8px !important;
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .7; transform: scale(1.1); }
        }
      `}</style>
    </PageWrapper>
  );
};
