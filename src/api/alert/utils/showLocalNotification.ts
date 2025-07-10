// 📁 src/api/alert/utils/showLocalNotification.ts

import notifee, { AndroidImportance } from '@notifee/react-native';

export async function displayLocalNotification(remoteMessage: any) {
  await notifee.displayNotification({
    title: remoteMessage.notification?.title || '알림',
    body: remoteMessage.notification?.body || '',
    android: {
      channelId: 'default',
      importance: AndroidImportance.HIGH,
      pressAction: {
        id: 'default',
      },
    },
  });
}
