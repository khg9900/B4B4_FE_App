// src/api/report/api/myReportApi.ts
import apiClient from '../../global/api/axiosInstance'

export interface ReportFilter {
  page?: number;
  size?: number;
  status?: string;
  start?: string;    // ISO Date string
  end?: string;      // ISO Date string
  sort?: string;
}

export interface ReportPayload<T> {
  content: T[];
  last: boolean;
  // 필요시 totalPages, totalElements 등 추가
}

export const fetchMyReports = async <T = any>(
  filter: ReportFilter
): Promise<ReportPayload<T>> => {
  try {
    const { page = 0, size = 10, status, start, end, sort } = filter;
    const params: any = { page, size };
    if (status) params.status = status;
    if (start)  params.start  = start;
    if (end)    params.end    = end;
    if (sort)   params.sort   = sort;

    const response = await apiClient.get('/reports/my', { params });
    return response.data.payload;
  } catch (error: any) {
    console.error('📌 fetchMyReports 에러:', error.response?.data || error.message);
    throw error; // 호출하는 쪽에서 추가 처리 가능
  }
};
