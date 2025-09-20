import { useState, useEffect } from 'react';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import fetchRegionCode from '../utils/fetchRegionCode';

const INTENT_LAUNCHER_MODULE = NativeModules.IntentLauncher;
const LOCATION_CACHE_MODULE = NativeModules.LocationCache;
const TRACKING_EVENT_NAME = 'tracking';

type Location = { latitude: number; longitude: number };

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
    let timeoutId: NodeJS.Timeout;

    const updateLocation = async ({ latitude: lat, longitude: lng }: Location) => {
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

      if (isMounted) setLoading(false);
    };

    const handleTracking = (event: Location) => {
      if (!event?.latitude || !event?.longitude) return;
      updateLocation(event);
    };

    const eventEmitter = new NativeEventEmitter(INTENT_LAUNCHER_MODULE);
    const subscription = eventEmitter.addListener(TRACKING_EVENT_NAME, handleTracking);

    const fetchCachedLocation = async () => {
      if (!LOCATION_CACHE_MODULE?.getCachedLocation) return setLoading(false);
      try {
        const cached: Location | null = await LOCATION_CACHE_MODULE.getCachedLocation();
        if (cached?.latitude && cached?.longitude) updateLocation(cached);
        else setLoading(false);
      } catch (e) {
        console.warn('캐시 위치 불러오기 실패', e);
        setLoading(false);
      }
    };

    fetchCachedLocation();
    timeoutId = setTimeout(() => isMounted && setLoading(false), 2000);

    return () => {
      isMounted = false;
      subscription.remove();
      clearTimeout(timeoutId);
    };
  }, []);

  return { latitude, longitude, province, city, loading };
}
