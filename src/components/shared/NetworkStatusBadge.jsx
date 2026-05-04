import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';

export function NetworkStatusBadge({ driverId }) {
  const [network, setNetwork] = useState(null);

  useEffect(() => {
    if (!driverId) return;

    const unsubscribe = onSnapshot(
      doc(db, 'driverNetwork', driverId),
      (snap) => {
        if (snap.exists()) {
          setNetwork(snap.data());
        }
      }
    );

    return () => unsubscribe();
  }, [driverId]);

  if (!network) return null;

  const getIcon = () => {
    switch (network.connectionType) {
      case 'wifi': return '📶';
      case 'mobile_data': return '📱';
      case 'ethernet': return '🔌';
      default: return '❓';
    }
  };

  const getColor = () => {
    if (!network.isOnline) return '#EF4444';
    switch (network.connectionType) {
      case 'wifi': return '#22C55E';
      case 'mobile_data': return '#F59E0B';
      case 'ethernet': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const getLabel = () => {
    if (!network.isOnline) return 'Offline';
    if (network.connectionType === 'wifi' && network.wifiSSID) {
      return `WiFi: ${network.wifiSSID}`;
    }
    if (network.connectionType === 'mobile_data') return 'Mobile Data';
    return network.connectionType || 'Connected';
  };

  const getSignalBars = (strength) => {
    if (!strength) return '';
    if (strength >= -50) return '▂▄▆█';
    if (strength >= -60) return '▂▄▆░';
    if (strength >= -70) return '▂▄░░';
    return '▂░░░';
  };

  const timeSince = () => {
    if (!network.lastUpdated) return '';
    try {
      const seconds = Math.floor(
        (Date.now() - network.lastUpdated.toDate()) / 1000
      );
      if (seconds < 60) return `${seconds}s ago`;
      return `${Math.floor(seconds / 60)}m ago`;
    } catch {
      return '';
    }
  };

  const color = getColor();

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      backgroundColor: `${color}15`,
      border: `1px solid ${color}40`,
      borderRadius: '20px',
      padding: '3px 10px',
      fontSize: '11px',
      fontWeight: '700',
      color,
      whiteSpace: 'nowrap',
    }}>
      <span>{getIcon()}</span>
      <span>{getLabel()}</span>
      {network.signalStrength && (
        <span style={{ letterSpacing: '-1px', opacity: 0.8 }}>
          {getSignalBars(network.signalStrength)}
        </span>
      )}
      {network.downloadSpeed > 0 && (
        <span style={{ opacity: 0.7, fontWeight: 400 }}>
          ↓{network.downloadSpeed}KB/s
        </span>
      )}
      <span style={{ opacity: 0.5, fontWeight: 400, fontSize: '10px' }}>
        {timeSince()}
      </span>
    </div>
  );
}
