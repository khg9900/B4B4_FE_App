// src/api/userApi.ts
import axiosInstance from '../../global/api/axiosInstance';
import type { SignUpRequestDto, LoginRequestDto } from '../types/User';

export const userApi = {
  signUp: (data: SignUpRequestDto) => axiosInstance.post('/auth/signup', data),
  login: (data: LoginRequestDto) => axiosInstance.post('/auth/login', data),
};

export const fetchMyInfo = async () => {
  const response = await axiosInstance.get('/user/me'); 
  return response.data;
};
