// 📁 src/alert/api/alertApi.ts
import axiosInstance from '../../global/api/axiosInstance';

export const fetchAlerts = async (type: 'disaster' | 'volunteer') => {
  const res = await axiosInstance.get(`/alerts?alertType=${type}`);
  return res.data;
};
