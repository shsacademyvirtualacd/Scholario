import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-[#EF4444] text-white text-xs font-bold py-2.5 px-4 flex items-center justify-center gap-2 z-[9999] shadow-md animate-in slide-in-from-top duration-300">
      <WifiOff size={14} className="animate-pulse shrink-0" />
      <span>You're offline — changes may not save</span>
    </div>
  );
};

export default OfflineBanner;
