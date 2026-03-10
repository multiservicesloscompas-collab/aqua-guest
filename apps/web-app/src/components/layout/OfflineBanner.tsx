import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useNetworkState } from '@/hooks/useNetworkState';
import { cn } from '@/lib/utils';

export const OfflineBanner: React.FC = () => {
    const isOnline = useNetworkState();
    const [showSyncing, setShowSyncing] = useState(false);
    const [lastState, setLastState] = useState(isOnline);

    // Detect transition from offline to online to show a brief "syncing/back" message
    useEffect(() => {
        if (!lastState && isOnline) {
            setShowSyncing(true);
            const timer = setTimeout(() => setShowSyncing(false), 3000);
            setLastState(isOnline);
            return () => clearTimeout(timer);
        }
        setLastState(isOnline);
        return undefined;
    }, [isOnline, lastState]);

    if (isOnline && !showSyncing) return null;

    return (
        <div
            className={cn(
                "fixed top-0 left-0 right-0 z-[100] flex items-center justify-center p-2 text-sm font-medium transition-all duration-300 animate-in slide-in-from-top",
                isOnline
                    ? "bg-green-600 text-white"
                    : "bg-amber-600 text-white"
            )}
        >
            <div className="flex items-center gap-2">
                {isOnline ? (
                    <>
                        <Wifi className="h-4 w-4" />
                        <span>Conexión restablecida. Sincronizando datos...</span>
                    </>
                ) : (
                    <>
                        <WifiOff className="h-4 w-4" />
                        <span>Sin conexión. Trabajando en modo offline.</span>
                    </>
                )}
            </div>
        </div>
    );
};
