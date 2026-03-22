import React, { useState } from 'react';
import { 
  Shield, 
  Settings as SettingsIcon, 
  Palette, 
  Users, 
  Database, 
  Save,
  Lock,
  History,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  Download
} from 'lucide-react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { useTheme } from '../../contexts/ThemeContext';
import toast from 'react-hot-toast';

export const Settings = () => {
  const [activeTab, setActiveTab] = useState('General');
  const { accentColor, setAccentColor, isDarkMode, toggleDarkMode } = useTheme();

  const auditLog = JSON.parse(localStorage.getItem('security_audit') || '[]');

  const tabs = [
    { id: 'General', icon: SettingsIcon },
    { id: 'Security', icon: Shield },
    { id: 'Appearance', icon: Palette },
    { id: 'Users', icon: Users },
    { id: 'Data', icon: Database },
  ];

  const handleExport = () => {
    const data = localStorage.getItem('toursdb_v1');
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tourspro_backup.json';
    a.click();
    toast.success('System data exported successfully');
  };

  const handleReset = () => {
    if (window.confirm('CRITICAL: This will delete all your local bookings and data. This action cannot be undone. Are you sure?')) {
        localStorage.removeItem('toursdb_v1');
        window.location.reload();
    }
  };

  return (
    <PageWrapper 
      title="System Settings" 
      subtitle="Configure enterprise preferences and security controls"
    >
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-64 space-y-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-button font-dm-sans font-medium transition-all
                ${activeTab === tab.id 
                  ? 'bg-safari-gold text-white shadow-lg shadow-safari-gold/20' 
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-card'}
              `}
            >
              <tab.icon size={18} />
              {tab.id}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 max-w-4xl">
          {activeTab === 'General' && (
            <Card>
              <CardContent className="pt-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Company Name" defaultValue="Eastern Vacations Safari & Tours" />
                  <Input label="Primary Email" defaultValue="info@toursco.com" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Phone Number" defaultValue="+254 700 000 000" />
                  <Input label="Currency Display" defaultValue="KES (Kenya Shillings)" />
                </div>
                <div className="space-y-1.5">
                   <label className="block text-sm font-medium text-safari-primary dark:text-dark-text">Address</label>
                   <textarea className="w-full px-4 py-2.5 bg-white dark:bg-dark-surface border-2 border-gray-100 dark:border-dark-border rounded-input outline-none focus:border-safari-gold transition-all text-sm h-24" defaultValue="123 Safari Plaza, Langata Road, Nairobi, Kenya" />
                </div>
                <div className="pt-4 border-t border-gray-100 dark:border-dark-border flex justify-end">
                  <Button className="gap-2"><Save size={18} /> Save General Settings</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'Security' && (
            <div className="space-y-6">
              <Card>
                <CardContent className="pt-8 space-y-6">
                   <h3 className="font-bold text-safari-primary dark:text-dark-text flex items-center gap-2">
                     <Lock size={18} className="text-safari-gold" /> Authentication
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <Input label="Session Timeout" defaultValue="8 Hours" disabled />
                     <div className="space-y-1.5">
                       <label className="block text-sm font-medium text-safari-primary dark:text-dark-text">2FA Status</label>
                       <Badge variant="warning">Disabled</Badge>
                     </div>
                   </div>
                   <Button variant="outline" onClick={() => toast.success('Password reset link sent to your email.')}>Change Administrator Password</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <h3 className="font-bold text-safari-primary dark:text-dark-text flex items-center gap-2">
                    <History size={18} className="text-safari-gold" /> Security Audit Log
                  </h3>
                </CardHeader>
                <CardContent>
                   <div className="space-y-4">
                     {auditLog.length > 0 ? (
                       auditLog.reverse().map((entry, i) => (
                         <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-gray-50 dark:border-dark-border last:border-0">
                           <div>
                             <p className="font-bold">{entry.action}</p>
                             <p className="text-[10px] text-gray-500">{entry.timestamp}</p>
                           </div>
                           <div className="text-right">
                             <p className="text-xs font-jetbrains text-safari-gold">{entry.ip}</p>
                             <p className="text-[10px] uppercase font-bold text-gray-400">{entry.role}</p>
                           </div>
                         </div>
                       ))
                     ) : (
                       <p className="text-sm text-gray-500 italic">No security events logged yet.</p>
                     )}
                   </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'Appearance' && (
            <Card>
              <CardContent className="pt-8 space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-safari-primary dark:text-dark-text">Dark Mode</h4>
                    <p className="text-sm text-gray-500">Enable dark theme for eye comfort</p>
                  </div>
                  <Button variant={isDarkMode ? 'primary' : 'outline'} onClick={toggleDarkMode}>
                    {isDarkMode ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>

                <div>
                  <h4 className="font-bold text-safari-primary dark:text-dark-text mb-4">System Accent Color</h4>
                  <div className="flex gap-4">
                    {['gold', 'blue', 'green', 'rose'].map(color => (
                      <button 
                        key={color}
                        onClick={() => setAccentColor(color)}
                        className={`w-12 h-12 rounded-2xl transition-all border-4 ${accentColor === color ? 'border-safari-primary dark:border-white scale-110 shadow-lg' : 'border-transparent'}`}
                        style={{ backgroundColor: color === 'gold' ? '#C9A84C' : color === 'blue' ? '#3B82F6' : color === 'green' ? '#10B981' : '#F43F5E' }}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'Users' && (
            <Card>
              <CardContent className="pt-8 space-y-6">
                <div className="flex items-center justify-between mb-4">
                   <h3 className="font-bold text-safari-primary dark:text-dark-text flex items-center gap-2">
                     <Users size={18} className="text-safari-gold" /> User Management
                   </h3>
                   <Button className="gap-2 text-sm px-4 py-2">Add New User</Button>
                </div>
                <div className="p-8 text-center border-2 border-dashed border-gray-100 dark:border-dark-border rounded-xl">
                   <Users size={48} className="text-gray-300 dark:text-dark-border mx-auto mb-4" />
                   <h4 className="font-bold text-safari-primary dark:text-dark-text mb-2">User Directory</h4>
                   <p className="text-sm text-gray-500 max-w-sm mx-auto">The centralized user management module is currently being provisioned. This will allow you to assign roles and manage agent access.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'Data' && (
            <div className="space-y-6">
              <Card className="border-l-4 border-l-safari-gold">
                <CardContent className="pt-8 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-safari-primary dark:text-dark-text">Backup System Data</h4>
                    <p className="text-sm text-gray-500">Download a JSON copy of all system records</p>
                  </div>
                  <Button variant="outline" className="gap-2" onClick={handleExport}>
                    <Download size={18} /> Export Records
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500">
                <CardContent className="pt-8 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-red-500">Factory Reset</h4>
                    <p className="text-sm text-gray-500">Wipe all local changes and reset to defaults</p>
                  </div>
                  <Button variant="danger" className="gap-2" onClick={handleReset}>
                    <Trash2 size={18} /> Purge All Data
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};
