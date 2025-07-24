import { useState, useEffect } from 'react';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import fetchRegionCode from '../utils/fetchRegionCode';
import {
  startTrackingService,
  stopTrackingService,
} from '../hooks/startLocationService';

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

    if (!INTENT_LAUNCHER_MODULE) {
      console.warn('IntentLauncher native module not available');
      setLoading(false);
      return;
    }

    const eventEmitter = new NativeEventEmitter(INTENT_LAUNCHER_MODULE);

    const subscription = eventEmitter.addListener(TRACKING_EVENT_NAME, async (event) => {
      if (!isMounted) return;

      console.log('[tracking 이벤트 수신] 이벤트 데이터:', event);

      const { latitude: lat, longitude: lng } = event ?? {};
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        console.warn('[tracking 이벤트 수신] 유효하지 않은 좌표:', event);
        return;
      }

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

      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    });

    async function fetchCachedLocation() {
      if (!LOCATION_CACHE_MODULE?.getCachedLocation) {
        console.warn('LocationCache native module 또는 getCachedLocation 메서드가 없습니다.');
        setLoading(false);
        return;
      }

      try {
        console.log('캐시 위치 호출 시도');
        const cached = await LOCATION_CACHE_MODULE.getCachedLocation();
        console.log('캐시 위치 응답:', cached);

        if (
          cached &&
          typeof cached.latitude === 'number' &&
          typeof cached.longitude === 'number'
        ) {
          if (isMounted) {
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
            setLoading(false);
          }
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
        } else {
          console.warn('캐시된 위치 데이터가 유효하지 않습니다.', cached);
          setLoading(false);
        }
      } catch (e) {
        console.warn('위치 캐시 불러오기 실패:', e);
        setLoading(false);
      }
    }

    timeoutId = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('위치 수신 타임아웃으로 loading 종료');
        setLoading(false);
      }
    }, 10000);

    fetchCachedLocation();

    startTrackingService();

    return () => {
      isMounted = false;
      subscription.remove();
      stopTrackingService();

      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };
  }, []);

  return { latitude, longitude, province, city, loading };
}
