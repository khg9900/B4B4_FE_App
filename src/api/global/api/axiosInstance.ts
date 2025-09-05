// 📁 src/api/axiosInstance.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ 환경별 baseURL
const localIP = '192.168.0.12';
const baseURL = `http://${localIP}:8080/api`;

console.log('🌐 [Axios] BaseURL:', baseURL);

const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ----------------------
// 요청 인터셉터
// ----------------------
axiosInstance.interceptors.request.use(async (config) => {
  try {
    const token = (await AsyncStorage.getItem('accessToken'))?.trim();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization; // 토큰 없으면 제거
    }
  } catch (e) {
    console.warn('⚠️ [Axios] accessToken 불러오기 실패:', e);
  }
  return config;
});

// ----------------------
// 응답 인터셉터
// ----------------------
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = (await AsyncStorage.getItem('refreshToken'))?.trim();
        if (!refreshToken) throw new Error('refreshToken 없음');

        // 🔹 refreshToken으로 accessToken 재발급
        const res = await axios.post(
          `${baseURL}/auth/reissue`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } } // Authorization 제거
        );

        const newAccessToken = res.data?.payload?.accessToken;
        const newRefreshToken = res.data?.payload?.refreshToken;

        if (!newAccessToken || !newRefreshToken) throw new Error('토큰 재발급 실패');

        // AsyncStorage 업데이트
        await AsyncStorage.multiSet([
          ['accessToken', newAccessToken],
          ['refreshToken', newRefreshToken],
        ]);

        console.log('🔄 [Axios] accessToken 재발급 성공');

        // 원래 요청 헤더 업데이트 후 재시도
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (reissueError) {
        console.error('🔴 [Axios] 토큰 재발급 실패:', reissueError);
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
        // 필요 시 앱 내 로그아웃 처리
        // 예: navigation.reset({ routes: [{ name: 'Login' }] })
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
