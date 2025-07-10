import messaging from '@react-native-firebase/messaging';

export async function getFcmToken(): Promise<string | null> {
  try {
    const token = await messaging().getToken();
    return token;
  } catch (error) {
    console.error('[FCM] 토큰 발급 실패:', error);
    return null;
  }
}
