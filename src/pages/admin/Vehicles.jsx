import React, { useState } from 'react';
import { 
  Plus, 
  LayoutGrid, 
  List, 
  Search, 
  Filter,
  Car,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  Settings,
  User,
  Users
} from 'lucide-react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useData } from '../../contexts/DataContext';
import { format, parseISO, differenceInDays } from 'date-fns';
import { validateString, validateNumber } from '../../utils/validation';
import toast from 'react-hot-toast';

// --- Robust date parsing: handles Firestore Timestamps, ISO strings, and nulls ---
const safeParseDate = (dateVal) => {
  if (!dateVal) return new Date();
  // Firestore Timestamp object
  if (dateVal && typeof dateVal.toDate === 'function') return dateVal.toDate();
  if (dateVal && dateVal.seconds) return new Date(dateVal.seconds * 1000);
  // ISO string
  try {
    const parsed = parseISO(String(dateVal));
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  } catch {
    return new Date();
  }
};

// Formats a date value as a yyyy-MM-dd string safe for <input type="date" defaultValue>
const formatInputDate = (dateVal) => {
  try {
    return format(safeParseDate(dateVal), 'yyyy-MM-dd');
  } catch {
    return '';
  }
};

const VehicleCard = ({ vehicle, onEdit, onView, onDelete }) => {
  const insuranceDate = safeParseDate(vehicle.insuranceExpiry);
  const daysToExpiry = differenceInDays(insuranceDate, new Date());
  const isExpired = daysToExpiry < 0;
  const isExpiringSoon = daysToExpiry >= 0 && daysToExpiry < 30;

  const getInsuranceBadge = () => {
    if (isExpired) return <Badge variant="danger" className="gap-1"><ShieldX size={12}/> EXPIRED</Badge>;
    if (isExpiringSoon) return <Badge variant="warning" className="gap-1"><ShieldAlert size={12}/> Expiring Soon</Badge>;
    return <Badge variant="success" className="gap-1"><ShieldCheck size={12}/> Valid</Badge>;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active': return <Badge variant="success">Active</Badge>;
      case 'In Maintenance': return <Badge variant="gold">Maintenance</Badge>;
      case 'Retired': return <Badge variant="danger">Retired</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <Card className={`relative overflow-hidden group border-l-4 ${isExpired ? 'border-l-red-500' : isExpiringSoon ? 'border-l-safari-warning' : 'border-l-safari-gold'}`}>
      <div className="h-48 overflow-hidden relative">
        <img 
          src={vehicle.image || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800'} 
          alt={vehicle.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {getStatusBadge(vehicle.status)}
          {getInsuranceBadge()}
        </div>
      </div>
      <CardContent className="pt-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-bold text-lg text-safari-primary dark:text-dark-text leading-tight">{vehicle.name}</h3>
            <p className="text-xs font-jetbrains font-bold text-safari-gold mt-1">{vehicle.plate}</p>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => onEdit(vehicle)} className="h-8 w-8">
              <Edit2 size={14} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onView(vehicle)} className="h-8 w-8 hover:text-safari-gold">
              <Eye size={14} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(vehicle)} className="h-8 w-8 text-red-500 hover:bg-red-50">
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-y-3 mt-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users size={14} />
            <span>{vehicle.capacity} Seats</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Settings size={14} />
            <span>{vehicle.year} Model</span>
          </div>
          <div className="col-span-2 flex items-center gap-2 text-sm text-gray-500">
            <Calendar size={14} />
            <span className={isExpired ? 'text-red-500 font-bold' : isExpiringSoon ? 'text-safari-warning font-bold' : ''}>
              {isExpired ? 'Expired ' : isExpiringSoon ? 'Expires in ' : 'Expires '} 
              {Math.abs(daysToExpiry)} days
            </span>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-dark-border flex items-center justify-between">
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-full bg-safari-primary/5 flex items-center justify-center text-safari-primary dark:text-safari-gold">
               <User size={14} />
             </div>
             <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Assigned: John K.</span>
           </div>
           <Button variant="ghost" size="sm" className="text-[10px] uppercase font-bold tracking-widest text-safari-gold">Details</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export const Vehicles = () => {
  const { state, dispatch } = useData();
  const [viewMode, setViewMode] = useState('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [search, setSearch] = useState('');

  const handleDelete = (vehicle) => {
    if (window.confirm(`Are you sure you want to delete ${vehicle.name}?`)) {
      dispatch({ type: 'DELETE_VEHICLE', payload: vehicle.id });
      toast.success(`${vehicle.name} has been deleted.`);
    }
  };

  const handleAddEdit = (e) => {
    e.preventDefault();
    try {
      const formData = new FormData(e.target);
      const vehicleData = Object.fromEntries(formData);
      
      const name = validateString(vehicleData.name, 150, 'Vehicle Name');
      const plate = validateString(vehicleData.plate, 20, 'Plate Number');
      const model = validateString(vehicleData.model, 100, 'Model');
      const year = validateNumber(vehicleData.year, 1990, 'Year');
      const capacity = validateNumber(vehicleData.capacity, 1, 'Capacity');
      const insuranceProvider = validateString(vehicleData.insuranceProvider, 150, 'Insurance Provider');
      const insuranceExpiry = validateString(vehicleData.insuranceExpiry, 20, 'Insurance Expiry');
      const status = validateString(vehicleData.status || 'Active', 50, 'Status', false);
      const image = vehicleData.image; // Raw Base64 string from input type=hidden

      const cleanVehicleData = { name, plate, model, year, capacity, insuranceProvider, insuranceExpiry, status, image };

      if (editingVehicle) {
        dispatch({ type: 'UPDATE_VEHICLE', payload: { ...editingVehicle, ...cleanVehicleData } });
        toast.success('Vehicle updated successfully');
      } else {
        dispatch({ type: 'ADD_VEHICLE', payload: { id: `v${Date.now()}`, ...cleanVehicleData } });
        toast.success('Vehicle added successfully');
      }
      setIsModalOpen(false);
    } catch(err) {
      toast.error(err.message);
    }
  };

  const filteredVehicles = state.vehicles.filter(v => 
    v.name.toLowerCase().includes(search.toLowerCase()) || 
    v.plate.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageWrapper 
      title="Vehicles Management" 
      subtitle={`Manage your safari fleet (${state.vehicles.length} total)`}
      actions={
        <Button onClick={() => { setEditingVehicle(null); setIsModalOpen(true); }} className="gap-2">
          <Plus size={18} /> Add Vehicle
        </Button>
      }
    >
      {/* Filtering & View Switch */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 bg-white dark:bg-dark-card p-4 rounded-card shadow-sm border border-gray-100 dark:border-dark-border">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name or plate..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-dark-bg border-none rounded-button text-sm focus:ring-2 focus:ring-safari-gold/20 outline-none"
          />
        </div>
        
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-dark-bg p-1 rounded-button">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-button transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-dark-card text-safari-gold shadow-sm' : 'text-gray-400'}`}
          >
            <LayoutGrid size={18} />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-button transition-all ${viewMode === 'list' ? 'bg-white dark:bg-dark-card text-safari-gold shadow-sm' : 'text-gray-400'}`}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredVehicles.map(v => (
            <VehicleCard 
              key={v.id} 
              vehicle={v} 
              onEdit={(v) => { setEditingVehicle(v); setIsModalOpen(true); }}
              onView={(v) => { toast('Vehicle details expanding soon!', { icon: '🚧' }); }} 
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 dark:bg-dark-bg border-b border-gray-100 dark:border-dark-border">
                  <th className="px-6 py-4 font-playfair font-bold text-safari-primary dark:text-dark-text">Vehicle</th>
                  <th className="px-6 py-4 font-playfair font-bold text-safari-primary dark:text-dark-text">Plate</th>
                  <th className="px-6 py-4 font-playfair font-bold text-safari-primary dark:text-dark-text">Insurance</th>
                  <th className="px-6 py-4 font-playfair font-bold text-safari-primary dark:text-dark-text">Status</th>
                  <th className="px-6 py-4 font-playfair font-bold text-safari-primary dark:text-dark-text">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-dark-border">
                {filteredVehicles.map(v => (
                  <tr key={v.id} className="hover:bg-safari-gold/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={v.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        <div>
                          <p className="font-bold text-safari-primary dark:text-dark-text">{v.name}</p>
                          <p className="text-xs text-gray-500">{v.model} ({v.year})</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-jetbrains font-bold text-sm text-safari-gold">{v.plate}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium">{format(safeParseDate(v.insuranceExpiry), 'MMM dd, yyyy')}</p>
                      <p className="text-xs text-gray-500">{v.insuranceProvider}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={v.status === 'Active' ? 'success' : 'gold'}>{v.status}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingVehicle(v); setIsModalOpen(true); }}>
                          <Edit2 size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(v)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
      >
        <form onSubmit={handleAddEdit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Vehicle Name" 
              name="name" 
              defaultValue={editingVehicle?.name} 
              placeholder="e.g. Toyota Land Cruiser" 
              required 
            />
            <Input 
              label="Plate Number" 
              name="plate" 
              defaultValue={editingVehicle?.plate} 
              placeholder="e.g. KDJ 456X" 
              required 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Model" 
              name="model" 
              defaultValue={editingVehicle?.model} 
              placeholder="e.g. 70 Series" 
              required 
            />
            <Input 
              label="Year" 
              name="year" 
              type="number" 
              defaultValue={editingVehicle?.year} 
              required 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Seats" 
              name="capacity" 
              type="number" 
              defaultValue={editingVehicle?.capacity} 
              required 
            />
            <Input 
              label="Insurance Provider" 
              name="insuranceProvider" 
              defaultValue={editingVehicle?.insuranceProvider} 
              required 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Insurance Expiry Date" 
              name="insuranceExpiry" 
              type="date" 
              defaultValue={formatInputDate(editingVehicle?.insuranceExpiry)} 
              required 
            />
            <div className="space-y-1.5">
               <label className="block text-sm font-medium text-safari-primary dark:text-dark-text font-dm-sans">Status</label>
               <select name="status" defaultValue={editingVehicle?.status || 'Active'} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-surface border-none rounded-button outline-none text-sm focus:ring-2 focus:ring-safari-gold/20 transition-all cursor-pointer">
                 <option value="Active">🟢 Active</option>
                 <option value="In Maintenance">🟡 In Maintenance</option>
                 <option value="Retired">🔴 Retired</option>
               </select>
            </div>
          </div>
          
          <div className="space-y-1.5">
             <label className="block text-sm font-medium text-safari-primary dark:text-dark-text font-dm-sans">Vehicle Image</label>
             <input 
               type="file" 
               accept="image/*"
               onChange={(e) => {
                 const file = e.target.files[0];
                 if (file) {
                   const reader = new FileReader();
                   reader.onloadend = () => {
                     document.getElementById('hidden-image-input').value = reader.result;
                     const preview = document.getElementById('image-preview');
                     preview.src = reader.result;
                     preview.classList.remove('hidden');
                   };
                   reader.readAsDataURL(file);
                 }
               }}
               className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-surface border-none rounded-button outline-none focus:ring-2 focus:ring-safari-gold transition-all text-sm cursor-pointer file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-safari-gold/10 file:text-safari-gold hover:file:bg-safari-gold/20"
             />
             <input type="hidden" name="image" id="hidden-image-input" defaultValue={editingVehicle?.image} />
             
             {editingVehicle?.image ? (
                <img id="image-preview" src={editingVehicle.image} alt="Preview" className="w-24 h-24 rounded-lg object-cover mt-2 shadow-sm border border-gray-100" />
             ) : (
                <img id="image-preview" src="" alt="Preview" className="w-24 h-24 rounded-lg object-cover mt-2 shadow-sm border border-gray-100 hidden" />
             )}
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-dark-border">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}</Button>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  );
};
