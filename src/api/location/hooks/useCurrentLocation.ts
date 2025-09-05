import { useState, useEffect } from 'react';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import fetchRegionCode from '../utils/fetchRegionCode';

const INTENT_LAUNCHER_MODULE = NativeModules.IntentLauncher;
const LOCATION_CACHE_MODULE = NativeModules.LocationCache;
const TRACKING_EVENT_NAME = 'tracking';

export function useCurrentLocation() {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [province, setProvince] = useState('');
  const [city, setCity] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      setLoading(false);
      return;
    }

    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;

    const handleTracking = async (event: any) => {
      if (!isMounted) return;

      const { latitude: lat, longitude: lng } = event ?? {};
      if (typeof lat !== 'number' || typeof lng !== 'number') return;

      setLatitude(lat);
      setLongitude(lng);

      try {
        const region = await fetchRegionCode(lat, lng);
        if (isMounted) {
          setProvince(region.province);
          setCity(region.city);
        }
      } catch (e) {
        console.warn('fetchRegionCode 실패', e);
      }

      setLoading(false);
      if (timeoutId) clearTimeout(timeoutId);
    };

    const eventEmitter = new NativeEventEmitter(INTENT_LAUNCHER_MODULE);
    const subscription = eventEmitter.addListener(TRACKING_EVENT_NAME, handleTracking);

    const fetchCachedLocation = async () => {
      if (!LOCATION_CACHE_MODULE?.getCachedLocation) {
        setLoading(false);
        return;
      }

      try {
        const cached = await LOCATION_CACHE_MODULE.getCachedLocation();
        if (cached && typeof cached.latitude === 'number' && typeof cached.longitude === 'number') {
          setLatitude(cached.latitude);
          setLongitude(cached.longitude);

          try {
            const region = await fetchRegionCode(cached.latitude, cached.longitude);
            if (isMounted) {
              setProvince(region.province);
              setCity(region.city);
            }
          } catch (e) {
            console.warn('fetchRegionCode 실패', e);
          }
        }
      } catch (e) {
        console.warn('캐시 위치 불러오기 실패', e);
      } finally {
        setLoading(false);
      }
    };

    timeoutId = setTimeout(() => {
      if (isMounted && loading) setLoading(false);
    }, 10000);

    fetchCachedLocation();

    return () => {
      isMounted = false;
      subscription.remove();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return { latitude, longitude, province, city, loading };
}
