import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { requestPushPermission } from './src/api/alert/fcm/fcmPermissions';
import { getFcmToken } from './src/api/alert/fcm/fcmTokenManager';
import { displayLocalNotification } from './src/api/alert/utils/showLocalNotification';
import { requestLocationPermission } from './src/api/global/utils/PermissionUtil';
import { navigationRef } from './src/navigation/AppNavigation';

// 릴리스에서 에러만 출력
const logError = (label: string, error: any) => {
  if (!__DEV__) {
    console.error(`${label}:`, error?.message ?? error);
  }
};

const App = () => {
  useEffect(() => {
    const initFCM = async () => {
      try {
        const granted = await requestPushPermission();
        const location = await requestLocationPermission();
        if (!granted) {
          return;
        }
        if (!location) {
          Alert.alert('위치 권한이 필요합니다. 앱을 종료합니다.');
          return;
        }

        await getFcmToken(); 
      } catch (e) {
        logError('initFCM 실패', e);
      }
    };

    const unsubscribe = messaging().onMessage(async remoteMessage => {
      try {
        await displayLocalNotification(remoteMessage);
      } catch (e) {
        logError('로컬 알림 표시 실패', e);
      }
    });

    initFCM();
    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
