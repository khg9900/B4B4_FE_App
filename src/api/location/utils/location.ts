import React, { useEffect, useState } from 'react';
import { NativeEventEmitter, NativeModules } from 'react-native';

const { IntentLauncher, LocationCache } = NativeModules;

export default function useLocation() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const eventEmitter = new NativeEventEmitter(IntentLauncher);

    const setLocationWithMinDelay = (lat: number, lng: number) => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 5000 - elapsed); // 최소 5초 보장
      setTimeout(() => {
        setLocation({ latitude: lat, longitude: lng });
      }, remaining);
    };

    // 실시간 위치 이벤트 리스너
    const subscription = eventEmitter.addListener('onLocationUpdate', (event) => {
      console.log('📡 위치 이벤트 받음:', event);
      if (event.latitude && event.longitude) {
        setLocationWithMinDelay(event.latitude, event.longitude);
      }
    });

    // 위치 캐시에서 읽기 (emit 이벤트가 없을 경우 대비)
    async function fetchCachedLocation() {
      try {
        const cached = await LocationCache.getLastLocation();
        console.log('🗂️ 캐시 위치 불러오기:', cached);
        if (cached?.latitude && cached?.longitude) {
          setLocationWithMinDelay(cached.latitude, cached.longitude);
        }
      } catch (e) {
        console.warn('🚨 위치 캐시 불러오기 실패:', e);
      }
    }

    fetchCachedLocation();

    return () => subscription.remove();
  }, []);

  return location;
}
