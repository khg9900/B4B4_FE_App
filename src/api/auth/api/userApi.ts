import axiosInstance, { clearTokens, saveTokens } from '../../global/api/axiosInstance';
import type { SignUpRequestDto, LoginRequestDto } from '../types/User';
import { navigate } from '../../../navigation/AppNavigation';

// 에러 출력
const logError = (label: string, error: any) => {
  console.error(`${label}:`, error?.response?.data ?? error?.message ?? error);
};

export const userApi = {
  // 회원가입
  signUp: async (data: SignUpRequestDto) => {
    try {
      await clearTokens();
      delete axiosInstance.defaults.headers.Authorization;

      const response = await axiosInstance.post('/auth/signup', data);
      return response.data;
    } catch (error: any) {
      logError('signUp 에러', error);
      throw error;
    }
  },

  // 로그인
  login: async (data: LoginRequestDto) => {
    try {
      await clearTokens();
      delete axiosInstance.defaults.headers.Authorization;

      const response = await axiosInstance.post('/auth/login', data);
      const payload = response.data?.payload;

      if (!payload?.accessToken || !payload?.refreshToken) {
        throw new Error('로그인 토큰 누락');
      }

      // NativeModule + AsyncStorage에 토큰 저장
      await saveTokens(payload.accessToken, payload.refreshToken);

      // axios 기본 헤더 세팅
      axiosInstance.defaults.headers.Authorization = `Bearer ${payload.accessToken}`;

      return payload; // { accessToken, refreshToken }
    } catch (error: any) {
      logError('login 에러', error);
      throw error;
    }
  },

  // 내 정보 조회
  fetchMyInfo: async () => {
    try {
      const response = await axiosInstance.get('/user/me');
      return response.data;
    } catch (error: any) {
      logError('fetchMyInfo 에러', error);
      throw error;
    }
  },

  // 로그아웃
  logout: async () => {
    try {
      await clearTokens();
      await axiosInstance.post('/auth/logout');
      delete axiosInstance.defaults.headers.Authorization;
      navigate('Login');
    } catch (error: any) {
      logError('logout 에러', error);
      throw error;
    }
  },
};
