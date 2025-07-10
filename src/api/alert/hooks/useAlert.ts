// 📁 src/alert/hooks/useAlert.ts
import { useState, useEffect, useCallback } from 'react';
import { fetchAlerts } from '../api/alertApi';
import { Alert } from '../types';

export const useAlert = (type: 'disaster' | 'volunteer') => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAlertsData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchAlerts(type);

      const typedPayload: Alert[] = res.payload.map((item: any) => ({
        ...item,
        type: type,
      }));

      setAlerts(typedPayload);
    } catch (err) {
      console.error('[useAlert] 알림 조회 실패', err);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    fetchAlertsData();
  }, [fetchAlertsData]);

  const refetch = async () => {
    await fetchAlertsData();
  };

  return { alerts, loading, refetch };
};
