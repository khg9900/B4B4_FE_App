import { NativeModules, PermissionsAndroid, Platform, Linking, Alert } from 'react-native';

export async function startBackgroundService() {
  if (Platform.OS !== 'android') return;

  const fine = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
  const background = PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION;

  // 1. 현재 권한 상태 확인
  const fineStatus = await PermissionsAndroid.check(fine);
  const backgroundStatus = await PermissionsAndroid.check(background);

  // 2. 권한 요청
  const granted = await PermissionsAndroid.requestMultiple([fine, background]);

  const fineGranted = granted[fine] === PermissionsAndroid.RESULTS.GRANTED;
  const backgroundGranted = granted[background] === PermissionsAndroid.RESULTS.GRANTED;

  if (fineGranted && backgroundGranted) {
    console.log('✅ 위치 권한 허용됨');
    try {
      NativeModules.IntentLauncher.startService(
        'com.disasteraidplatform.RecordingService',
        'START'
      );
    } catch (e) {
      console.error('startService error:', e);
      Alert.alert('서비스 시작 오류', '서비스를 시작하는 중에 문제가 발생했습니다.');
    }
  } else {
    const neverAskAgain =
      granted[fine] === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ||
      granted[background] === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN;

    if (neverAskAgain) {
      Alert.alert(
        '위치 권한 필요',
        '앱 설정에서 위치 권한을 직접 허용해주세요.',
        [
          {
            text: '설정 열기',
            onPress: () => Linking.openSettings(),
          },
          { text: '취소', style: 'cancel' },
        ],
        { cancelable: true }
      );
    } else {
      Alert.alert('❌ 위치 권한이 필요합니다');
    }
  }
}
