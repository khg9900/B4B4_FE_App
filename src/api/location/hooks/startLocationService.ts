import { NativeModules, Platform } from 'react-native';

const { IntentLauncher } = NativeModules;

type ServiceAction =
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
      IntentLauncher.startForegroundService?.(action); // className 불필요
    } else {
      IntentLauncher.stopService?.(); // className 불필요
    }
  } catch (e) {
    console.error(`[invokeService] error during ${action} → ${className}:`, e);
  }
}

// 통합 포그라운드 서비스 클래스명 (Kotlin 단에서 단일 서비스만 import)
const FOREGROUND_SERVICE = 'com.disasteraidplatform.service.ForegroundLocationService';

export function startForegroundService() {
  invokeService(FOREGROUND_SERVICE, 'START_FOREGROUND', true);
}

export function stopForegroundService() {
  invokeService(FOREGROUND_SERVICE, 'STOP_FOREGROUND', false);
}

// 앱 시작 시 서비스 한 번만 실행
export function startAllServices() {
  startForegroundService();
}
