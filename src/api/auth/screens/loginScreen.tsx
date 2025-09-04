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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setJwtToken } from '../../../nativeModules/JwtModule';
import { requestPushPermission } from '../../alert/fcm/fcmPermissions';
import { getFcmToken } from '../../alert/fcm/fcmTokenManager';
import { sendDeviceInfoToServer } from '../../alert/fcm/sendDeviceInfo';
import { jwtDecode } from 'jwt-decode';
import { startAllServices } from '../../location/hooks/startLocationService';

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
  });

  useEffect(() => {
    const tryAutoLogin = async () => {
      try {
        const savedToken = await AsyncStorage.getItem('accessToken');
        if (savedToken) {
          setJwtToken(savedToken);
          startAllServices();

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

      startAllServices();
      Alert.alert('로그인 성공');

      if (role === 'IND') navigation.navigate('MainScreen' as never);
      else if (role === 'GOV') navigation.navigate('Dashboard' as never);
      else navigation.navigate('MainScreen' as never);
    } catch (error) {
      console.error('❌ 로그인 실패:', error);
      Alert.alert('로그인 실패', '이메일 또는 비밀번호를 확인해주세요');
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
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>로그인</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.signUpLink}
        onPress={() => navigation.navigate('SignUp' as never)}
      >
        <Text style={styles.signUpText}>회원가입</Text>
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
    color: '#000', // 입력 글씨 검은색
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
  signUpLink: { marginTop: 10, alignItems: 'center' },
  signUpText: { color: '#f26522', fontWeight: '600' },
});

export default LoginScreen;
