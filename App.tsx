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

    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      await displayLocalNotification(remoteMessage);
    });

    // 앱이 백그라운드 상태에서 Notification 클릭
    const unsubscribeBackground = messaging().onNotificationOpenedApp(remoteMessage => {
      const highlightParticipantId = remoteMessage.data?.highlightParticipantId
        ? Number(remoteMessage.data.highlightParticipantId)
        : null;

      if (highlightParticipantId) {
        navigationRef.current?.navigate('UserParticipation', { highlightParticipantId});
      }
    });

    // 앱이 종료 상태에서 Notification 클릭
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        const highlightParticipantId = remoteMessage?.data?.highlightParticipantId
          ? Number(remoteMessage.data.highlightParticipantId)
          : null;

        if (highlightParticipantId) {
          setTimeout(() => {
            navigationRef.current?.navigate('UserParticipation', { highlightParticipantId });
          }, 500); // navigation 준비 대기
        }
      });

    initFCM();

    return () => {
      unsubscribeForeground();
      unsubscribeBackground();
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
