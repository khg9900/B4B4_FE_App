import { NativeModules, Platform } from 'react-native';

const { IntentLauncher } = NativeModules;

type ServiceAction =
  | 'START_TRACKING'
  | 'STOP_TRACKING'
  | 'START_SENDER'
  | 'STOP_SENDER'
  | 'START_FOREGROUND'
  | 'STOP_FOREGROUND';

function invokeService(
  className: string,
  action: ServiceAction,
  foreground = false
) {
  if (Platform.OS !== 'android') return;
  if (!IntentLauncher) return;

  console.log(
    `[invokeService] 호출 → className: ${className}, action: ${action}, foreground: ${foreground}`
  );

  try {
    if (foreground) {
      IntentLauncher.startForegroundService?.(className, action);
    } else {
      IntentLauncher.startService?.(className, action);
    }
  } catch (e) {
    console.error(`[invokeService] error during ${action} → ${className}:`, e);
  }
}

// 서비스 클래스명 (패키지 포함 전체 경로)
const TRACKING_SERVICE = 'com.disasteraidplatform.service.TrackingService';
const SENDER_SERVICE = 'com.disasteraidplatform.service.LocationSenderService';
const FOREGROUND_SERVICE = 'com.disasteraidplatform.service.ForegroundService';

// START는 모두 foreground=true
export function startTrackingService() {
  invokeService(TRACKING_SERVICE, 'START_TRACKING', true);
}
export function stopTrackingService() {
  invokeService(TRACKING_SERVICE, 'STOP_TRACKING', false);
}

export function startLocationSenderService() {
  invokeService(SENDER_SERVICE, 'START_SENDER', true);
}
export function stopLocationSenderService() {
  invokeService(SENDER_SERVICE, 'STOP_SENDER', false);
}

export function startForegroundService() {
  invokeService(FOREGROUND_SERVICE, 'START_FOREGROUND', true);
}
export function stopForegroundService() {
  invokeService(FOREGROUND_SERVICE, 'STOP_FOREGROUND', false);
}

// 앱 시작 시 한 번에 3개 모두 띄우고 싶으면
export function startAllServices() {
  startForegroundService();
  startTrackingService();
  startLocationSenderService();
}
