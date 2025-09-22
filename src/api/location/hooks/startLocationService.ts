// src/api/location/hooks/startLocationService.ts
import { NativeModules, Platform } from 'react-native';
const { IntentLauncher } = NativeModules;

type ServiceAction = 'START_FOREGROUND' | 'STOP_FOREGROUND';
const FOREGROUND_SERVICE = 'com.disasteraidplatform.service.ForegroundLocationService';

function invokeService(className: string, action: ServiceAction, foreground = false) {
  if (Platform.OS !== 'android') return;
  if (!IntentLauncher) return;

  console.log(`[invokeService] 호출 → className: ${className}, action: ${action}, foreground: ${foreground}`);

  try {
    if (foreground) {
      IntentLauncher.startForegroundService?.(action);
    } else {
      IntentLauncher.stopService?.();
    }
  } catch (e) {
    console.error(`[invokeService] error during ${action} → ${className}:`, e);
  }
}

export function startForegroundService() { invokeService(FOREGROUND_SERVICE, 'START_FOREGROUND', true); }
export function stopForegroundService() { invokeService(FOREGROUND_SERVICE, 'STOP_FOREGROUND', false); }
export function startAllServices() { startForegroundService(); }
export function stopAllServices() { stopForegroundService(); }
