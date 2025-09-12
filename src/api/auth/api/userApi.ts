import axiosInstance, { saveTokens, clearTokens } from '../../global/api/axiosInstance';
import type { SignUpRequestDto, LoginRequestDto } from '../types/User';

/**
 * userApi
 */
export const userApi = {
  // 회원가입
  signUp: async (data: SignUpRequestDto) => {
    try {

      await clearTokens();
      delete axiosInstance.defaults.headers.Authorization;

      const response = await axiosInstance.post('/auth/signup', data);
      return response.data;
    } catch (error: any) {
      console.error('📌 signUp 에러:', error.response?.data || error.message);
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

      // 토큰 저장 및 axios 헤더 세팅
      await saveTokens(payload.accessToken, payload.refreshToken);
      axiosInstance.defaults.headers.Authorization = `Bearer ${payload.accessToken}`;

      return payload; // { accessToken, refreshToken }
    } catch (error: any) {
      console.error('📌 login 에러:', error.response?.data || error.message);
      throw error;
    }
  },

  // 내 정보 조회
  fetchMyInfo: async () => {
    try {
      const response = await axiosInstance.get('/user/me');
      return response.data;
    } catch (error: any) {
      console.error('📌 fetchMyInfo 에러:', error.response?.data || error.message);
      throw error;
    }
  },

  // 로그아웃
  logout: async () => {
    try {
      await clearTokens();
      await axiosInstance.post('/auth/logout');
      delete axiosInstance.defaults.headers.Authorization;
    } catch (error: any) {
      console.error('📌 logout 에러:', error.message);
      throw error;
    }
  },
};
