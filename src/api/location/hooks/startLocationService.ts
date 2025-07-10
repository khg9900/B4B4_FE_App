import { NativeModules, Platform } from 'react-native';

const { IntentLauncher } = NativeModules;

type ServiceAction =
  | 'START_TRACKING'
  | 'STOP_TRACKING'
  | 'START_SENDER'
  | 'STOP_SENDER'
  | 'START_FOREGROUND'
  | 'STOP_FOREGROUND';

function invokeService(className: string, action: ServiceAction) {
  if (Platform.OS !== 'android') {
    console.warn(`invokeService(${action}) only supported on Android`);
    return;
  }
  if (!IntentLauncher || typeof IntentLauncher.startService !== 'function') {
    console.error('IntentLauncher.startService is not available');
    return;
  }
  try {
    IntentLauncher.startService(className, action);
  } catch (e) {
    console.error(`[invokeService] error during ${action} → ${className}:`, e);
  }
}

// ✅ 서비스별 실제 클래스 이름
const TRACKING_SERVICE = 'com.disasteraidplatform.TrackingService';
const SENDER_SERVICE = 'com.disasteraidplatform.LocationSenderService';
const FOREGROUND_SERVICE = 'com.disasteraidplatform.ForegroundService';

// 🎯 외부에서 호출하는 함수들
export function startTrackingService() {
  invokeService(TRACKING_SERVICE, 'START_TRACKING');
}

export function stopTrackingService() {
  invokeService(TRACKING_SERVICE, 'STOP_TRACKING');
}

export function startLocationSenderService() {
  invokeService(SENDER_SERVICE, 'START_SENDER');
}

export function stopLocationSenderService() {
  invokeService(SENDER_SERVICE, 'STOP_SENDER');
}

export function startForegroundService() {
  invokeService(FOREGROUND_SERVICE, 'START_FOREGROUND');
}

export function stopForegroundService() {
  invokeService(FOREGROUND_SERVICE, 'STOP_FOREGROUND');
}
