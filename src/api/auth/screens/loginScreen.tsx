import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
} from 'react-native';
import { userApi } from '../api/userApi';
import type { LoginRequestDto } from '../types/User';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setJwtToken } from '../../../nativeModules/JwtModule';
import { requestPushPermission } from '../../alert/fcm/fcmPermissions';
import { getFcmToken } from '../../alert/fcm/fcmTokenManager';
import { sendDeviceInfoToServer } from '../../alert/fcm/sendDeviceInfo';
import { jwtDecode } from 'jwt-decode'; // 수정: named import로 변경
import { WebView } from 'react-native-webview';
import { startLocationSenderService } from '../../location/hooks/startLocationService';

interface DecodedToken {
  id: number;
  sub: string;
  role: 'IND' | 'GOV' | 'NGO';
  exp: number;
  iat: number;
}

const LoginScreen = () => {
  const navigation = useNavigation();
  const [form, setForm] = useState<LoginRequestDto>({
    email: '',
    password: '',
    loginType: 'LOCAL',
  });

  const [showWebView, setShowWebView] = useState(false);

  useEffect(() => {
    const tryAutoLogin = async () => {
      try {
        const savedToken = await AsyncStorage.getItem('accessToken');
        if (savedToken) {
          setJwtToken(savedToken);
          startLocationSenderService();

          const permissionGranted = await requestPushPermission();
          if (permissionGranted) {
            const token = await getFcmToken();
            if (token) await sendDeviceInfoToServer(token);
          }
          navigation.navigate('MainScreen' as never);
        }
      } catch (e) {
        console.log('자동 로그인 실패:', e);
      }
    };
    tryAutoLogin();
  }, [navigation]);

  const handleLogin = async () => {
    try {
      const response = await userApi.login(form);
      const accessToken = response.data?.payload?.accessToken;
      const refreshToken = response.data?.payload?.refreshToken;

      if (!accessToken || !refreshToken) {
        throw new Error('토큰이 누락되었습니다.');
      }

      await AsyncStorage.multiSet([
        ['accessToken', accessToken],
        ['refreshToken', refreshToken],
      ]);

      setJwtToken(accessToken);

      const decoded: DecodedToken = jwtDecode(accessToken);
      const role = decoded.role;

      const permissionGranted = await requestPushPermission();
      if (permissionGranted) {
        const token = await getFcmToken();
        if (token) {
          const success = await sendDeviceInfoToServer(token);
          if (!success) console.warn('[FCM] 서버 전송 실패');
        }
      }

      startLocationSenderService(); // 위치 전송 서비스 시작

      Alert.alert('로그인 성공');

      if (role === 'IND') navigation.navigate('ReportScreen' as never);
      else if (role === 'GOV') navigation.navigate('Dashboard' as never);
      else navigation.navigate('MainScreen' as never);
    } catch (error) {
      console.error('❌ 로그인 실패:', error);
      Alert.alert('로그인 실패', '이메일 또는 비밀번호를 확인해주세요');
    }
  };

  const handleKakaoLogin = () => {
    setShowWebView(true);
  };

  const handleWebViewNavigation = async (navState: any) => {
    const { url } = navState;

    if (url.startsWith('http://10.0.2.2:8080/oauth2/success')) {
      const parsed = new URL(url);
      const accessToken = parsed.searchParams.get('accessToken');
      const refreshToken = parsed.searchParams.get('refreshToken');

      if (accessToken && refreshToken) {
        await AsyncStorage.multiSet([
          ['accessToken', accessToken],
          ['refreshToken', refreshToken],
        ]);
        setJwtToken(accessToken);

        const decoded: DecodedToken = jwtDecode(accessToken);
        const role = decoded.role;

        const permissionGranted = await requestPushPermission();
        if (permissionGranted) {
          const token = await getFcmToken();
          if (token) await sendDeviceInfoToServer(token);
        }

        startLocationSenderService(); // 위치 전송 서비스 시작

        setShowWebView(false);
        Alert.alert('카카오 로그인 성공');

        if (role === 'IND') navigation.navigate('ReportScreen' as never);
        else if (role === 'GOV') navigation.navigate('Dashboard' as never);
        else navigation.navigate('MainScreen' as never);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('../../../img/b4b4.png')} style={styles.logo} />
      <TextInput
        placeholder="이메일"
        style={styles.input}
        value={form.email}
        onChangeText={text => setForm({ ...form, email: text })}
        autoCapitalize="none"
      />
      <TextInput
        placeholder="비밀번호"
        style={styles.input}
        secureTextEntry
        value={form.password}
        onChangeText={text => setForm({ ...form, password: text })}
        autoCapitalize="none"
      />
      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>로그인</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.signUpLink}
        onPress={() => navigation.navigate('SignUp' as never)}
      >
        <Text style={styles.signUpText}>회원가입</Text>
      </TouchableOpacity>

      {/* 카카오 로그인 WebView 모달 */}
      <Modal visible={showWebView} animationType="slide">
        <WebView
          source={{ uri: 'http://10.0.2.2:8080/api/auth/kakao' }}
          onNavigationStateChange={handleWebViewNavigation}
          javaScriptEnabled
          domStorageEnabled
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  logo: { width: 120, height: 120, resizeMode: 'contain', alignSelf: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
  loginButton: {
    backgroundColor: '#f26522',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
    height: 53,
  },
  loginButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  signUpLink: { marginTop: 10, alignItems: 'center' },
  signUpText: { color: '#f26522', fontWeight: '600' },
});

export default LoginScreen;
