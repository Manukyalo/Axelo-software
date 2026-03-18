import React, { useState } from 'react';
import { 
  Plus, 
  MapPin, 
  Clock, 
  CheckCircle,
  Edit2,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useData } from '../../contexts/DataContext';
import toast from 'react-hot-toast';

const PackageCard = ({ pkg, onEdit }) => {
  return (
    <Card className="overflow-hidden group">
      <div className="h-44 overflow-hidden relative">
        <img 
          src={pkg.image} 
          alt={pkg.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
          <div className="flex items-center gap-1.5 text-white bg-safari-gold/80 px-2 py-1 rounded-md text-xs font-bold backdrop-blur-sm">
            <Clock size={12} /> {pkg.duration} Days
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-300 uppercase font-bold tracking-widest">Starts from</p>
            <p className="text-white font-jetbrains font-bold text-lg">KES {pkg.priceAdult.toLocaleString()}</p>
          </div>
        </div>
      </div>
      <CardContent className="pt-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-safari-primary dark:text-dark-text group-hover:text-safari-gold transition-colors">{pkg.name}</h3>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => onEdit(pkg)} className="h-8 w-8">
              <Edit2 size={14} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500">
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 mb-4 line-clamp-2">{pkg.description}</p>
        
        <div className="flex flex-wrap gap-1.5 mb-4">
          {pkg.destinations.map((dest, i) => (
            <Badge key={i} variant="default" className="text-[10px] bg-gray-50 border border-gray-100">
              <MapPin size={10} className="mr-1" /> {dest}
            </Badge>
          ))}
        </div>

        <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-dark-border">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Included Services</p>
          <div className="grid grid-cols-2 gap-2">
            {pkg.included.map((service, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[11px] text-gray-600 dark:text-gray-400">
                <CheckCircle size={12} className="text-safari-success" /> {service}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const Packages = () => {
  const { state, dispatch } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);

  const handleAddEdit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const pkgData = Object.fromEntries(formData);
    
    // Process arrays (simplified for now)
    const processedPkg = {
      ...pkgData,
      duration: parseInt(pkgData.duration),
      priceAdult: parseInt(pkgData.priceAdult),
      priceChild: parseInt(pkgData.priceChild),
      destinations: pkgData.destinations.split(',').map(d => d.trim()),
      included: pkgData.included.split(',').map(i => i.trim()),
    };

    if (editingPkg) {
      dispatch({ type: 'UPDATE_PACKAGE', payload: { ...editingPkg, ...processedPkg } });
      toast.success('Package updated');
    } else {
      dispatch({ type: 'ADD_PACKAGE', payload: { id: `p${Date.now()}`, ...processedPkg } });
      toast.success('Package added');
    }
    setIsModalOpen(false);
  };

  return (
    <PageWrapper 
      title="Tour Packages" 
      subtitle="Craft and manage your curated safari experiences"
      actions={
        <Button onClick={() => { setEditingPkg(null); setIsModalOpen(true); }} className="gap-2">
          <Plus size={18} /> New Package
        </Button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.packages.map(p => (
          <PackageCard key={p.id} pkg={p} onEdit={(p) => { setEditingPkg(p); setIsModalOpen(true); }} />
        ))}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingPkg ? 'Edit Package' : 'Create Package'}
      >
        <form onSubmit={handleAddEdit} className="space-y-6">
          <Input label="Package Name" name="name" defaultValue={editingPkg?.name} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Duration (Days)" name="duration" type="number" defaultValue={editingPkg?.duration} required />
            <Input label="Cover Image URL" name="image" defaultValue={editingPkg?.image} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Price per Adult" name="priceAdult" type="number" defaultValue={editingPkg?.priceAdult} required />
            <Input label="Price per Child" name="priceChild" type="number" defaultValue={editingPkg?.priceChild} required />
          </div>
          <Input 
            label="Destinations (comma separated)" 
            name="destinations" 
            defaultValue={editingPkg?.destinations?.join(', ')} 
            placeholder="e.g. Maasai Mara, Lake Nakuru" 
            required 
          />
          <Input 
            label="Included Services (comma separated)" 
            name="included" 
            defaultValue={editingPkg?.included?.join(', ')} 
            placeholder="e.g. Transport, Lunch, Gamedrives" 
            required 
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-safari-primary dark:text-dark-text font-dm-sans">Description</label>
            <textarea 
              name="description" 
              defaultValue={editingPkg?.description}
              className="w-full px-4 py-2.5 bg-white dark:bg-dark-surface border-2 border-gray-100 dark:border-dark-border rounded-input outline-none focus:border-safari-gold transition-all text-sm min-h-[100px]"
              required
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-dark-border">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editingPkg ? 'Update Package' : 'Create Package'}</Button>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  );
};
