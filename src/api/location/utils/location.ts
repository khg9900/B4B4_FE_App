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
      const remaining = Math.max(0, 5000 - elapsed);
      setTimeout(() => {
        setLocation({ latitude: lat, longitude: lng });
      }, remaining);
    };

    const subscription = eventEmitter.addListener('onLocationUpdate', (event) => {
      if (event.latitude && event.longitude) {
        setLocationWithMinDelay(event.latitude, event.longitude);
      }
    });

    async function fetchCachedLocation() {
      try {
        const cached = await LocationCache.getLastLocation();
        if (cached?.latitude && cached?.longitude) {
          setLocationWithMinDelay(cached.latitude, cached.longitude);
        }
      } catch (e) {
        console.warn('위치 캐시 불러오기 실패:', e);
      }
    }

    fetchCachedLocation();

    return () => subscription.remove();
  }, []);

  return location;
}
