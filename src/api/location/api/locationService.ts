// src/api/locationService.ts (이미 만든 예시)
import { NativeModules, Platform, PermissionsAndroid, Alert } from 'react-native';

const { IntentLauncher } = NativeModules;

export async function requestLocationPermissionAndStartService(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;

  const fine = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
  const background = PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION;

  const granted = await PermissionsAndroid.requestMultiple([fine, background]);

  const allGranted =
    granted[fine] === PermissionsAndroid.RESULTS.GRANTED &&
    granted[background] === PermissionsAndroid.RESULTS.GRANTED;

  if (!allGranted) {
    Alert.alert('위치 권한이 필요합니다.');
    return false;
  }

  IntentLauncher.startService('com.disasteraidplatform.RecordingService', 'START');
  return true;
}
