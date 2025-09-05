import axiosInstance from '../../global/api/axiosInstance';
import type { ShelterDto } from '../types/Map';

export const shelterApi = {
  async getNearbyShelters(
    latitude: number,
    longitude: number,
    radiusMeter: number = 10000
  ): Promise<ShelterDto[]> {

    const res = await axiosInstance.get('/shelters', {
      params: { latitude, longitude, radiusMeter },
    });
    return res.data.payload;
  },
};
