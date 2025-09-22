import axiosInstance from '../../global/api/axiosInstance';
import type { ShelterDto } from '../types/Map';

export const shelterApi = {
  async getNearbyShelters(
    latitude: number,
    longitude: number,
    radiusMeter: number = 3000
  ): Promise<ShelterDto[]> {
    try {
      const res = await axiosInstance.get('/shelters', {
        params: { latitude, longitude, radiusMeter },
      });
      return res.data.payload;
    } catch (error: any) {
      console.error(
        '📌 getNearbyShelters 에러:',
        error.response?.data || error.message
      );
      throw error;
    }
  },
};
