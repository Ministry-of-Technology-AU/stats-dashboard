'use client';

import { createContext, useContext, useState, useCallback } from 'react';

interface DashboardContextType {
  onRefresh?: () => void;
  isRefreshing?: boolean;
  lastUpdate?: Date;
  userEmail?: string | null;
  setRefreshCallback: (callback: () => Promise<void>) => void;
  setIsRefreshing: (value: boolean) => void;
  setLastUpdate: (date: Date) => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within DashboardWrapper');
  }
  return context;
}

export function DashboardWrapper({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail?: string | null;
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [refreshCallback, setRefreshCallbackState] = useState<(() => Promise<void>) | null>(null);

  const setRefreshCallback = useCallback((callback: () => Promise<void>) => {
    setRefreshCallbackState(() => callback);
  }, []);

  const onRefresh = useCallback(async () => {
    if (refreshCallback) {
      await refreshCallback();
    }
  }, [refreshCallback]);

  return (
    <DashboardContext.Provider
      value={{
        onRefresh,
        isRefreshing,
        lastUpdate,
        userEmail,
        setRefreshCallback,
        setIsRefreshing,
        setLastUpdate,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}
