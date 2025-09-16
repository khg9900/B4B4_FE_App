// src/api/report/api/myReportApi.ts
import apiClient from '../../global/api/axiosInstance';
import type { ReportResponse } from '../types/api';

export interface ReportCursorRequest {
  province?: string;
  city?: string;
  status?: string;
  pageSize?: number;
  lastCreatedAt?: string; 
  lastId?: number;  
  startDate?: string; 
  endDate?: string; 
  sortOrder?: 'ASC' | 'DESC';
}

export interface CursorResponse<T> {
  content: T[];
  last: boolean;
  lastId?: number;
  lastCreatedAt?: string;
}

export const fetchMyReportsCursor = async (
  req: ReportCursorRequest
): Promise<CursorResponse<ReportResponse>> => {
  try {
    const response = await apiClient.get('/reports/my/cursor', { params: req });
    return response.data.payload;
  } catch (error: any) {
    console.error('📌 fetchMyReportsCursor 에러:', error.response?.data || error.message);
    throw error;
  }
};
