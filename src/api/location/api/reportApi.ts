// src/api/location/api/reportApi.ts
import axiosInstance from '../../global/api/axiosInstance';
import type { DisasterDto } from '../types/Map';

export const reportApi = {
  async getNearbyDisasters(
    latitude: number,
    longitude: number,
    radiusMeter: number
  ): Promise<DisasterDto[]> {
    try {
      const res = await axiosInstance.get('/reports/map', {
        params: { latitude, longitude, radiusMeter},
      });
      return res.data.payload;
    } catch (error: any) {
      console.error(
        '📌 getNearbyDisasters 에러:',
        error.response?.data || error.message
      );
      throw error; // 호출하는 쪽에서 추가 처리 가능
    }
  },
};
