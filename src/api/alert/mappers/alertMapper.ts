import { Alert, DisasterAlert, VolunteerAlert } from '../types';

// --- API 응답 타입 (백엔드 원본) -------------------------------
// 엔드포인트가 알림 혼합 배열을 줄 수도, 개별로 줄 수도 있으니 분리 정의
export type DisasterAlertApi = {
  id: number;
  province: string;
  city: string | null | undefined;  // "" 또는 null 가능
  disasterType: string;
  count: number;
  createdAt: string;                // ISO string
};

export type VolunteerAlertApi = {
  id: number;
  title: string;
  placeName: string;
  volunteerDate: string;            // ISO string
  createdAt: string;                // ISO string
};

// --- 정규화 유틸 -----------------------------------------------
const normalizeCity = (city: string | null | undefined): string | null =>
  city && city.length > 0 ? city : null;

// --- 개별 매퍼 -------------------------------------------------
export const mapDisasterAlert = (a: DisasterAlertApi): DisasterAlert => ({
  id: a.id,
  type: 'disaster',
  province: a.province,
  city: normalizeCity(a.city),
  disasterType: a.disasterType,
  count: a.count,
  createdAt: a.createdAt,
});

export const mapVolunteerAlert = (a: VolunteerAlertApi): VolunteerAlert => ({
  id: a.id,
  type: 'volunteer',
  title: a.title,
  placeName: a.placeName,
  volunteerDate: a.volunteerDate,
  createdAt: a.createdAt,
});

// --- 혼합 배열 매핑(선택) --------------------------------------
// 백엔드가 혼합 배열을 줄 때 사용: 속성 존재 여부로 판별
export const mapAlerts = (arr: Array<DisasterAlertApi | VolunteerAlertApi>): Alert[] =>
  arr.map((item) => {
    if ('disasterType' in item) return mapDisasterAlert(item as DisasterAlertApi);
    return mapVolunteerAlert(item as VolunteerAlertApi);
  });
