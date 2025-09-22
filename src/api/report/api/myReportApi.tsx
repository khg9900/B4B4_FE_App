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

// 에러 출력
const logError = (label: string, error: any) => {
  console.error(`${label}:`, error?.response?.data ?? error?.message ?? error);
};

export const fetchMyReportsCursor = async (
  req: ReportCursorRequest
): Promise<CursorResponse<ReportResponse>> => {
  try {
    const response = await apiClient.get('/reports/my/cursor', { params: req });
    return response.data.payload;
  } catch (error: any) {
    logError('fetchMyReportsCursor 실패', error);
    throw error;
  }
};
