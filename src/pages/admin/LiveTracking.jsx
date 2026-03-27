import React, { useEffect, useRef, useState } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { useData } from '../../contexts/DataContext';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
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
  Compass
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

// Set Mapbox token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export const LiveTracking = () => {
  const { state } = useData();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef({});
  const [search, setSearch] = useState('');
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/light-v11');

  // Initialize Map
  useEffect(() => {
    if (map.current) return;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: [37.9062, -3.0758], // Kilimanjaro/Amboseli area as default
      zoom: 7,
      pitch: 45
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      map.current.remove();
      map.current = null;
    };
  }, []);

  // Sync Markers
  useEffect(() => {
    if (!map.current) return;

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
            <div class="p-2 font-dm-sans">
              <p class="font-bold text-sm">${driver.name}</p>
              <p class="text-[10px] uppercase text-gray-500 font-bold">${loc.isOnline ? 'Online' : 'Offline'}</p>
              <p class="text-[10px] text-safari-gold mt-1">${loc.speed ? `${Math.round(loc.speed)} km/h` : 'Stationary'}</p>
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
  }, [state.driverLocations, state.drivers]);

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
                className="w-full bg-transparent border-none text-sm outline-none font-dm-sans placeholder:text-gray-400"
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
                   className={`w-full p-4 rounded-2xl border transition-all text-left flex gap-3 ${isSelected ? 'bg-safari-primary text-white border-safari-primary shadow-lg shadow-safari-primary/20' : 'bg-white border-gray-100 hover:border-safari-gold/30 hover:shadow-md'}`}
                 >
                    <div className="relative">
                       <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${isSelected ? 'bg-white/20' : 'bg-safari-gold/10 text-safari-gold'}`}>
                          {driver?.name.charAt(0)}
                       </div>
                       <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 ${isSelected ? 'border-safari-primary' : 'border-white'} ${loc.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className={`font-bold text-sm truncate ${isSelected ? 'text-white' : 'text-safari-primary'}`}>{driver?.name}</p>
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

        {/* Map Container */}
        <div className="flex-1 relative rounded-3xl overflow-hidden border border-gray-100 shadow-2xl bg-gray-50 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
          <div ref={mapContainer} className="absolute inset-0" />
          
          {/* Map Controls */}
          <div className="absolute top-6 left-6 flex flex-col gap-2">
             <button 
               onClick={() => setMapStyle('mapbox://styles/mapbox/light-v11')}
               className={`p-3 rounded-xl shadow-xl transition-all ${mapStyle.includes('light') ? 'bg-safari-gold text-white' : 'bg-white text-gray-500 hover:text-safari-gold'}`}
             >
                <Layers size={20} />
             </button>
             <button 
               onClick={() => setMapStyle('mapbox://styles/mapbox/satellite-v9')}
               className={`p-3 rounded-xl shadow-xl transition-all ${mapStyle.includes('satellite') ? 'bg-safari-gold text-white' : 'bg-white text-gray-500 hover:text-safari-gold'}`}
             >
                <MapIcon size={20} />
             </button>
          </div>

          {/* Quick Stats Overlay */}
          <div className="absolute bottom-6 right-6 flex gap-4">
             <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/20 flex gap-6 items-center">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                      {state.driverLocations?.filter(l => l.isOnline).length || 0} Drivers Online
                   </span>
                </div>
                <div className="w-px h-4 bg-gray-200" />
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-red-500 animate-bounce" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                      {state.sosAlerts?.filter(s => s.status === 'Active').length || 0} SOS Active
                   </span>
                </div>
             </div>
          </div>
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
        @keyframes bounce-horizontal {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-10px); }
        }
        .animate-bounce-horizontal {
          animation: bounce-horizontal 2s infinite;
        }
      `}</style>
    </PageWrapper>
  );
};
