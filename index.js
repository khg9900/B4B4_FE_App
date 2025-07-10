import messaging from '@react-native-firebase/messaging';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// ✅ 백그라운드 메시지 수신 핸들러 등록
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('🔵 백그라운드 메시지 수신:', remoteMessage);
  // 여기서 백그라운드 메시지 로직 추가 가능 (예: 저장, 로깅 등)
});

AppRegistry.registerComponent(appName, () => App);
