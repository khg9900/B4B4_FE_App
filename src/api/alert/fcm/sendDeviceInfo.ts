import DeviceInfo from 'react-native-device-info';
import { getDeviceInfo } from './fcmConfig';
import axiosInstance from '../../global/api/axiosInstance';

export async function sendDeviceInfoToServer(token: string): Promise<boolean> {
  const isEmulator = await DeviceInfo.isEmulator();

  if (isEmulator) {
    console.warn('[FCM] 에뮬레이터에서는 푸시 알림을 사용할 수 없습니다.');
    return false;
  }

  const body = await getDeviceInfo(token);

  try {
    await axiosInstance.post('/devices', body);
    return true;
  } catch (error) {
    console.error('[FCM 전송 실패]', error);
    return false;
  }
}