import React from 'react';
import { ShieldAlert, ChevronRight, X } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useNavigate } from 'react-router-dom';

export const GlobalSOSBanner = () => {
  const { state } = useData();
  const navigate = useNavigate();
  
  const activeSOS = state.sosAlerts?.filter(s => s.status === 'Active')
    .sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);

  if (!activeSOS || activeSOS.length === 0) return null;

  const current = activeSOS[0];

  return (
    <div className="bg-red-600 text-white py-3 px-6 flex items-center justify-between sticky top-0 z-[60] shadow-lg animate-pulse-subtle">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-bounce-horizontal">
          <ShieldAlert size={24} />
        </div>
        <div>
          <h4 className="font-black uppercase tracking-widest text-xs">Critical SOS Alert Active</h4>
          <p className="text-sm font-dm-sans font-bold">
            {current.driverName} is reporting an emergency ({current.emergencyType}) in {current.parkName}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/admin/sos-alerts')}
          className="bg-white text-red-600 px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest hover:bg-red-50 transition-all flex items-center gap-2"
        >
          Manage Alert <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
