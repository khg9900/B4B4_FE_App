import axiosInstance from '../../global/api/axiosInstance.ts';
import { ApiResponse, ReportResponse } from '../types/api.ts';

// 에러 출력
const logError = (label: string, error: any) => {
  console.error(`${label}:`, error?.response?.data ?? error?.message ?? error);
};

export const getReports = async () => {
  try {
    const res = await axiosInstance.get<ApiResponse<ReportResponse[]>>('/reports');
    return res.data.payload;
  } catch (error: any) {
    logError('getReports 실패', error);
    throw error;
  }
};

export const createReport = async (payload: {
  disasterType: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  province: string;
  city: string;
  latitude: number;
  longitude: number;
  image?: { uri: string; type: string; fileName: string };
  video?: { uri: string; type: string; fileName: string };
}) => {
  try {
    const formData = new FormData();

    const jsonPayload = {
      disasterType: payload.disasterType,
      description: payload.description,
      province: payload.province,
      city: payload.city,
      latitude: payload.latitude,
      longitude: payload.longitude,
    };

    formData.append('request', JSON.stringify(jsonPayload));

    if (payload.image) {
      formData.append('image', {
        uri: payload.image.uri,
        name: payload.image.fileName,
        type: payload.image.type,
      } as any);
    }

    if (payload.video) {
      formData.append('video', {
        uri: payload.video.uri,
        name: payload.video.fileName,
        type: payload.video.type,
      } as any);
    }

    const res = await axiosInstance.post('/reports', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return res.data.payload;
  } catch (error: any) {
    logError('createReport 실패', error);
    throw error;
  }
};

export const updateReportStatus = async (id: number, newStatus: string) => {
  try {
    await axiosInstance.patch(`/reports/${id}/status?newStatus=${newStatus}`);
  } catch (error: any) {
    logError('updateReportStatus 실패', error);
    throw error;
  }
};
