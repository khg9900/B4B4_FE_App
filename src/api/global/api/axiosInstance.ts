// 📁 src/api/axiosInstance.ts
import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ 환경별 baseURL 정의
const emulatorURL = 'http://10.0.2.2:8080/api'; // Android 에뮬레이터용
const localIP = '192.168.25.177';                // PC 로컬 IP
const localURL = `http://${localIP}:8080/api`;
const productionURL = 'http://54.180.32.246:8080/api'; // ✅ EC2 서버

// ✅ 현재는 무조건 EC2 서버에 요청 (에러 회피용)
const baseURL = localURL;

console.log('🌐 [Axios] BaseURL:', baseURL);

// Axios 인스턴스 생성
const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: accessToken 자동 삽입
axiosInstance.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    console.warn('⚠️ [Axios] accessToken 불러오기 실패:', e);
  }
  return config;
});

// 응답 인터셉터: accessToken 만료 시 refreshToken으로 재발급 시도
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('refreshToken 없음');

        const res = await axios.post(`${baseURL}/auth/reissue`, { refreshToken });
        const newAccessToken = res.data?.payload?.accessToken;
        if (!newAccessToken) throw new Error('accessToken 재발급 실패');

        await AsyncStorage.setItem('accessToken', newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        console.log('🔄 [Axios] accessToken 재발급 성공');
        return axiosInstance(originalRequest); // 원래 요청 재시도
      } catch (reissueError) {
        console.error('🔴 [Axios] 토큰 재발급 실패:', reissueError);
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
        // TODO: 로그인 화면으로 이동 처리 필요 시 여기에 작성
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
