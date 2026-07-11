import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

const NetworkStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-[#111111] text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-3 border border-[#404040] animate-in slide-in-from-bottom-5">
      <WifiOff size={16} className="text-[#F4C430]" />
      <span className="text-sm font-medium">Connection lost. Scholario will sync once you reconnect.</span>
    </div>
  );
};

export default NetworkStatus;
