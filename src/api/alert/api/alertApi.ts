// 📁 src/alert/api/alertApi.ts
import axiosInstance from '../../global/api/axiosInstance';

export const fetchAlerts = async (type: 'disaster' | 'volunteer') => {
  try {
    const res = await axiosInstance.get(`/alerts?alertType=${type}`);
    return res.data;
  } catch (error: any) {
    console.error('📌 fetchAlerts 에러:', error.response?.data || error.message);
    throw error; // 호출한 쪽에서 추가 처리 가능
  }
};
