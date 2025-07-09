import { useState } from 'react';
import { refreshService } from '@/services/refresh-service';

export function useRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = async () => {
    if (isRefreshing) return;

    try {
      setIsRefreshing(true);
      await refreshService.refreshAll();
    } catch (error) {
      console.error('Manual refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    isRefreshing,
    refresh
  };
}