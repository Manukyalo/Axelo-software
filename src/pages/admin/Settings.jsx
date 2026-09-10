import React, { useState, useEffect } from 'react';
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
  Download,
  AlertTriangle,
  Zap,
  ShieldAlert,
  Wrench
} from 'lucide-react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { useTheme } from '../../contexts/ThemeContext';
import { db } from '../../config/firebase';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

export const Settings = () => {
  const [activeTab, setActiveTab] = useState('General');
  const { accentColor, setAccentColor, isDarkMode, toggleDarkMode } = useTheme();
  const [isSystemLocked, setIsSystemLocked] = useState(false);
  const [loadingLock, setLoadingLock] = useState(true);
  const [isMaintenanceActive, setIsMaintenanceActive] = useState(false);
  const [loadingMaintenance, setLoadingMaintenance] = useState(true);

  // Sync with Firestore for Kill Switch and Maintenance status
  useEffect(() => {
    const unsubLock = onSnapshot(doc(db, 'system_config', 'emergency'), (snap) => {
      if (snap.exists()) {
        setIsSystemLocked(snap.data().locked === true);
      }
      setLoadingLock(false);
    }, (err) => {
      console.error('Failed to sync lock status:', err);
      setLoadingLock(false);
    });

    const unsubMaint = onSnapshot(doc(db, 'system_config', 'maintenance'), (snap) => {
      if (snap.exists()) {
        setIsMaintenanceActive(snap.data().active === true);
      } else {
        setIsMaintenanceActive(false);
      }
      setLoadingMaintenance(false);
    }, (err) => {
      console.error('Failed to sync maintenance status:', err);
      setLoadingMaintenance(false);
    });

    return () => {
      unsubLock();
      unsubMaint();
    };
  }, []);

  const toggleMaintenanceMode = async () => {
    const targetState = !isMaintenanceActive;
    const confirmMsg = isMaintenanceActive
      ? "Take system OFF maintenance? All users will immediately regain access."
      : "Activate SCHEDULED MAINTENANCE? Non-admin users will be routed to the maintenance page.";

    if (window.confirm(confirmMsg)) {
      try {
        const maintRef = doc(db, 'system_config', 'maintenance');
        await setDoc(maintRef, {
          active: targetState,
          updatedAt: serverTimestamp(),
          updatedBy: 'Admin (Settings UI)',
          status: targetState ? 'Scheduled Maintenance' : 'Operational'
        }, { merge: true });

        toast.success(targetState ? 'Maintenance mode ACTIVATED' : 'System restored to OPERATIONAL');
      } catch (err) {
        console.error('Maintenance toggle failed:', err);
        toast.error('Failed to update maintenance mode. Check admin permissions.');
      }
    }
  };

  const toggleSystemLock = async () => {
    const action = isSystemLocked ? 'RECOVERY' : 'LOCKDOWN';
    const confirmMsg = isSystemLocked 
      ? "Are you sure you want to RESTORE system access? This will allow agents and drivers to log in again."
      : "CRITICAL: This will instantly DISCONNECT all users and block all database access except for Admins. Use only in case of an active breach. Proceed?";

    if (window.confirm(confirmMsg)) {
      try {
        const lockRef = doc(db, 'system_config', 'emergency');
        await setDoc(lockRef, {
          locked: !isSystemLocked,
          updatedAt: serverTimestamp(),
          updatedBy: 'Admin (UI)',
          actionType: action
        }, { merge: true });

        // Log to local audit as well
        const audit = JSON.parse(localStorage.getItem('security_audit') || '[]');
        audit.push({
          action: `${action} TRIGGERED`,
          timestamp: new Date().toLocaleString(),
          ip: 'System Internal',
          role: 'SUPER_ADMIN'
        });
        localStorage.setItem('security_audit', JSON.stringify(audit));

        toast.success(isSystemLocked ? 'System restored successfully' : 'SYSTEM LOCKED DOWN');
      } catch (err) {
        console.error('Lockdown failed:', err);
        toast.error('Failed to trigger lockdown. Check permissions.');
      }
    }
  };

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

              <Card className={`border-2 transition-all ${isSystemLocked ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20' : 'border-transparent'}`}>
                <CardContent className="pt-8 space-y-4">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       <div className={`p-2 rounded-lg ${isSystemLocked ? 'bg-red-500 text-white' : 'bg-safari-gold/10 text-safari-gold'}`}>
                         <ShieldAlert size={24} />
                       </div>
                       <div>
                         <h3 className="font-bold text-safari-primary dark:text-dark-text">Nuclear Lockdown</h3>
                         <p className="text-xs text-gray-500 italic">Emergency kill-switch to stop active breaches</p>
                       </div>
                     </div>
                     <Badge variant={isSystemLocked ? 'danger' : 'success'} className="animate-pulse">
                       {isSystemLocked ? 'SYSTEM LOCKED' : 'SYSTEM ACTIVE'}
                     </Badge>
                   </div>
                   
                   <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                     Activating lockdown will instantly disconnect all Agents and Drivers. Database access will be restricted to authorized Admin accounts only. Use this if you suspect a hacker has compromised the system.
                   </p>

                   <div className="pt-2">
                     <Button 
                       variant={isSystemLocked ? 'primary' : 'danger'} 
                       className="w-full gap-2 py-6 text-lg font-bold shadow-xl"
                       onClick={toggleSystemLock}
                       disabled={loadingLock}
                     >
                       {isSystemLocked ? <RefreshCw size={20} /> : <Zap size={20} />}
                       {isSystemLocked ? 'RESTORE SYSTEM ACCESS' : 'TRIGGER EMERGENCY LOCKDOWN'}
                     </Button>
                   </div>
                </CardContent>
              </Card>

              <Card className={`border-2 transition-all ${isMaintenanceActive ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20' : 'border-transparent'}`}>
                <CardContent className="pt-8 space-y-4">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       <div className={`p-2 rounded-lg ${isMaintenanceActive ? 'bg-amber-500 text-white' : 'bg-safari-gold/10 text-safari-gold'}`}>
                         <Wrench size={24} />
                       </div>
                       <div>
                         <h3 className="font-bold text-safari-primary dark:text-dark-text">Scheduled Maintenance</h3>
                         <p className="text-xs text-gray-500 italic">Toggle public maintenance mode screen across the entire platform</p>
                       </div>
                     </div>
                     <Badge variant={isMaintenanceActive ? 'warning' : 'success'} className="animate-pulse">
                       {isMaintenanceActive ? 'MAINTENANCE ACTIVE' : 'SYSTEM OPERATIONAL'}
                     </Badge>
                   </div>
                   
                   <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                     When active, regular agents, drivers, and visitors will see the Scheduled Maintenance notice. Admin access remains open for testing and system updates.
                   </p>

                   <div className="pt-2">
                     <Button 
                       variant={isMaintenanceActive ? 'primary' : 'outline'} 
                       className="w-full gap-2 py-4 font-bold shadow-md"
                       onClick={toggleMaintenanceMode}
                       disabled={loadingMaintenance}
                     >
                       <Wrench size={18} />
                       {isMaintenanceActive ? 'TAKE SYSTEM OFF MAINTENANCE' : 'ACTIVATE SCHEDULED MAINTENANCE'}
                     </Button>
                   </div>
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
                     <Users size={18} className="text-safari-gold" /> User Role Management
                   </h3>
                </div>
                
                <div className="bg-safari-gold/5 border border-safari-gold/10 p-4 rounded-xl mb-6">
                  <p className="text-sm text-safari-earthy flex items-center gap-2">
                    <Shield size={16} /> Use this tool to promote users to Admin or Agent status. This updates their security claims in real-time.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <Input 
                        label="Firebase User UID" 
                        placeholder="e.g. 8xK7yL... (Get from Auth console)"
                        id="role-uid"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-safari-primary dark:text-dark-text mb-1.5">Target Role</label>
                      <select 
                        id="role-select"
                        className="w-full px-4 py-2.5 bg-white dark:bg-dark-surface border-2 border-gray-100 dark:border-dark-border rounded-input outline-none focus:border-safari-gold transition-all text-sm"
                      >
                        <option value="admin">Administrator</option>
                        <option value="agent">Reservations Agent</option>
                        <option value="driver">Driver / Staff</option>
                      </select>
                    </div>
                  </div>
                  <Button 
                    className="w-full gap-2"
                    onClick={async () => {
                      const uid = document.getElementById('role-uid').value;
                      const role = document.getElementById('role-select').value;
                      if (!uid) return toast.error('UID is required');
                      
                      const setRole = httpsCallable(functions, 'setRole');
                      const loadToast = toast.loading('Updating security claims...');
                      try {
                        await setRole({ uid, role });
                        toast.success(`User successfully updated to ${role}`, { id: loadToast });
                        document.getElementById('role-uid').value = '';
                      } catch (err) {
                        toast.error(err.message, { id: loadToast });
                      }
                    }}
                  >
                    <ShieldCheck size={18} /> Update User Security Claims
                  </Button>
                </div>

                <div className="pt-8 mt-8 border-t border-gray-100 dark:border-dark-border">
                  <h4 className="text-sm font-bold text-safari-primary dark:text-dark-text mb-4">Quick Migration Links</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border">
                      <p className="text-xs font-bold mb-1">Primary Admin</p>
                      <p className="text-[10px] text-gray-500 mb-2 truncate">admin@easternvacations.com</p>
                      <Badge variant="success">Auto-Assigned</Badge>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border">
                      <p className="text-xs font-bold mb-1">System Reservations</p>
                      <p className="text-[10px] text-gray-500 mb-2 truncate">reservations@easternvacations.com</p>
                      <Badge variant="info">Agent Access</Badge>
                    </div>
                  </div>
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
