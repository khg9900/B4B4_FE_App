import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

/** 📍 위치 권한 요청 (Android Foreground + Background) */
export async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const fineGranted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );

    if (fineGranted !== PermissionsAndroid.RESULTS.GRANTED) {
      Alert.alert('정확한 위치 권한이 거부되었습니다.');
      return false;
    }

    if (Platform.Version >= 29) {
      const backgroundGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
      );

      if (backgroundGranted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert('백그라운드 위치 권한이 거부되었습니다.');
        return false;
      }
    }

    console.log('✅ [Android] 위치 권한 허용됨');
  }

  // iOS는 react-native-permissions 사용 필요 (필요 시 추가)
  return true;
}

