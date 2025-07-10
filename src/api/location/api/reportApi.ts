import axiosInstance from '../../global/api/axiosInstance';
import type { DisasterDto } from '../types/Map';

export const reportApi = {
  async getNearbyDisasters(
    latitude: number,
    longitude: number,
    radiusMeter: number = 1000,
    secondsAgo: number = 3600
  ): Promise<DisasterDto[]> {
    const res = await axiosInstance.get('/reports/map', {
      params: { latitude, longitude, radiusMeter, secondsAgo },
    });
    return res.data.payload;
  },
};
