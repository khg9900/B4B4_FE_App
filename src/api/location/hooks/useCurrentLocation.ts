import { useState, useEffect } from 'react';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import fetchRegionCode from '../utils/fetchRegionCode';

const { IntentLauncher, LocationCache } = NativeModules;

export function useCurrentLocation() {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [province, setProvince] = useState('');
  const [city, setCity] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;

    async function init() {
      if (Platform.OS === 'android') {
        const eventEmitter = new NativeEventEmitter(IntentLauncher);

        const subscription = eventEmitter.addListener('tracking', async (event) => {
          if (!isMounted) return;

          const { latitude, longitude } = event;
          console.log('[tracking 이벤트 수신] latitude:', latitude, 'longitude:', longitude);

          setLatitude(latitude);
          setLongitude(longitude);

          const region = await fetchRegionCode(latitude, longitude);
          setProvince(region.province);
          setCity(region.city);

          setLoading(false);

          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
        });

        async function fetchCachedLocation() {
          try {
            const cached = await LocationCache.getLastLocation();
            console.log('[Cached Location]', cached);

            if (cached?.latitude && cached?.longitude) {
              if (!isMounted) return;

              setLatitude(cached.latitude);
              setLongitude(cached.longitude);

              const region = await fetchRegionCode(cached.latitude, cached.longitude);
              setProvince(region.province);
              setCity(region.city);

              setLoading(false);

              if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
              }
            }
          } catch (e) {
            console.warn('위치 캐시 불러오기 실패:', e);
          }
        }

        timeoutId = setTimeout(() => {
          if (isMounted && loading) {
            console.warn('위치 수신 타임아웃으로 loading 종료');
            setLoading(false);
          }
        }, 10000);

        fetchCachedLocation();

        IntentLauncher.startService('com.disasteraidplatform.TrackingService', 'START_TRACKING');

        return () => {
          isMounted = false;
          subscription.remove();

          IntentLauncher.startService('com.disasteraidplatform.TrackingService', 'STOP_TRACKING');

          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
        };
      } else {
        setLoading(false);
      }
    }
    init();

    return () => {
      isMounted = false;
    };
  }, []);

  return { latitude, longitude, province, city, loading };
}
