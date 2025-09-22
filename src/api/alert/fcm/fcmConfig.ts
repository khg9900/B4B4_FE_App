import DeviceInfo from 'react-native-device-info';

export async function getDeviceInfo(token: string) {
  const deviceType = DeviceInfo.getDeviceType();
  const os = DeviceInfo.getSystemName();
  const osVersion = DeviceInfo.getSystemVersion();
  const model = DeviceInfo.getModel();

  return {
    type: deviceType,
    os,
    osVersion,
    model,
    fcmToken: token,
  };
}