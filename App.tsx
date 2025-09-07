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


const App = () => {
  useEffect(() => {
    const initFCM = async () => {
      const granted = await requestPushPermission();
      const location = await requestLocationPermission();
      if (!granted) {
        console.warn('❌ FCM 권한 거부됨');
        return;
      }

      if (!location) {
        console.warn('❌ 위치 권한 거부됨');
        Alert.alert('위치 권한이 필요합니다. 앱을 종료합니다.');
        return;
      }

      const token = await getFcmToken();
      if (token) console.log('📱 FCM 토큰:', token);
    };

    const unsubscribe = messaging().onMessage(async remoteMessage => {
      await displayLocalNotification(remoteMessage);
    });

    initFCM();

    return () => {
      unsubscribe();
    };
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
