import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { userApi } from '../api/userApi';
import type { LoginRequestDto } from '../types/User';
import { useNavigation } from '@react-navigation/native';
import { NativeModules } from 'react-native';
import { requestPushPermission } from '../../alert/fcm/fcmPermissions';
import { getFcmToken } from '../../alert/fcm/fcmTokenManager';
import { sendDeviceInfoToServer } from '../../alert/fcm/sendDeviceInfo';
import { jwtDecode } from 'jwt-decode';
import { startAllServices } from '../../location/hooks/startLocationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../../global/api/axiosInstance';
import { authState } from '../../global/utils/authState';
import { showServerErrorAlert} from '../../global/utils/showErrorAlert';

interface DecodedToken {
  id: number;
  sub: string;
  role: 'IND' | 'GOV' | 'NGO';
  exp: number;
  iat: number;
}

const { JwtModule } = NativeModules;

// 에러 출력
const logError = (label: string, error: any) => {
  console.error(`${label}:`, error?.response?.data ?? error?.message ?? error);
};

const LoginScreen = () => {
  const navigation = useNavigation();
  const [form, setForm] = useState<LoginRequestDto>({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  // 자동 로그인 시도
  useEffect(() => {
    const tryAutoLogin = async () => {
      authState.isAutoLoggingIn = true;

      try {
        const accessToken = await AsyncStorage.getItem('accessToken');
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!accessToken) return;

        // 토큰 만료 여부 체크
        try {
          const decoded: DecodedToken = jwtDecode(accessToken);
          const isExpired = decoded.exp * 1000 <= Date.now();
          if (isExpired) {
            await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
            return;
          }
        } catch {
          await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
          return;
        }

        // 토큰 세팅
        JwtModule.setToken(accessToken, refreshToken);
        axiosInstance.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

        await startAllServices();

        const permissionGranted = await requestPushPermission();
        if (permissionGranted) {
          const fcmToken = await getFcmToken();
          if (fcmToken) await sendDeviceInfoToServer(fcmToken);
        }

        navigation.navigate('MainScreen' as never);
      } catch (e) {
        logError('자동 로그인 실패', e);
      } finally {
        authState.isAutoLoggingIn = false;
      }
    };

    tryAutoLogin();
  }, [navigation]);

  const handleLogin = async () => {
    setLoading(true);
    try {
      // login 함수 안에서 토큰 저장과 axios 헤더 세팅까지 처리됨
      const payload = await userApi.login(form);

      // 토큰 디코딩
      const decoded: DecodedToken = jwtDecode(payload.accessToken);
      const role = decoded.role;

      // FCM 권한 & 토큰 전송
      const permissionGranted = await requestPushPermission();
      if (permissionGranted) {
        const fcmToken = await getFcmToken();
        if (fcmToken) {
          await sendDeviceInfoToServer(fcmToken);
        }
      }

      JwtModule.setToken(payload.accessToken, payload.refreshToken);
      startAllServices();
      Alert.alert('로그인 성공');

      // 역할별 화면 이동
      if (role === 'IND') navigation.navigate('MainScreen' as never);
      else if (role === 'GOV') navigation.navigate('Dashboard' as never);
      else navigation.navigate('MainScreen' as never);
    } catch (error: any) {
      const serverError = error.response?.data;
      logError('로그인 실패', error);

      showServerErrorAlert(serverError);
    } finally {
      setLoading(false);
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
        placeholderTextColor="#999"
      />
      <TextInput
        placeholder="비밀번호"
        style={styles.input}
        secureTextEntry
        value={form.password}
        onChangeText={text => setForm({ ...form, password: text })}
        autoCapitalize="none"
        placeholderTextColor="#999"
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? '로그인 중...' : '로그인'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.buttonOutline, { marginTop: 12 }]}
        onPress={() => navigation.navigate('SignUp' as never)}
      >
        <Text style={styles.buttonOutlineText}>회원가입</Text>
      </TouchableOpacity>
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
    color: '#000',
  },
  button: {
    backgroundColor: '#f26522',
    borderWidth: 1,
    borderColor: '#fff',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
    height: 53,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  buttonOutline: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f26522',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    height: 53,
  },
  buttonOutlineText: {
    color: '#f26522',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default LoginScreen;
