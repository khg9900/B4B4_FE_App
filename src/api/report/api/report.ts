// src/api/report/api/report.ts
import axiosInstance from '../../global/api/axiosInstance.ts';
import { ApiResponse, ReportResponse } from '../types/api.ts';

export const getReports = async () => {
  const res = await axiosInstance.get<ApiResponse<ReportResponse[]>>('/reports');
  return res.data.payload;
};

export const createReport = async (payload: {
  disasterType: string;
  description: string;
  imageUrl?: string; // 사용 안 할 경우 제거 가능
  videoUrl?: string;
  province: string;
  city: string;
  latitude: number;
  longitude: number;
  image?: {
    uri: string;
    type: string;
    fileName: string;
  };
  video?: {
    uri: string;
    type: string;
    fileName: string;
  };
}) => {
  const formData = new FormData();

  const jsonPayload = {
    disasterType: payload.disasterType,
    description: payload.description,
    province: payload.province,
    city: payload.city,
    latitude: payload.latitude,
    longitude: payload.longitude
  };

  formData.append('request', JSON.stringify(jsonPayload));

  // 이미지나 비디오가 실제 파일 객체일 경우에만 append
  if (payload.image) {
    formData.append('image', {
      uri: payload.image.uri,
      name: payload.image.fileName,
      type: payload.image.type
    } as any);
  }

  if (payload.video) {
    formData.append('video', {
      uri: payload.video.uri,
      name: payload.video.fileName,
      type: payload.video.type
    } as any);
  }

  const res = await axiosInstance.post('/reports', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  console.log('📥 신고 응답:', res.data);
  return res.data.payload;
};

export const updateReportStatus = async (id: number, newStatus: string) => {
  await axiosInstance.patch(`/reports/${id}/status?newStatus=${newStatus}`);
};
