// 📁 src/alert/types/index.ts

export type Alert = DisasterAlert | VolunteerAlert;

interface BaseAlert {
  id: number;
  createdAt: string;
}

export interface DisasterAlert extends BaseAlert {
  type: 'disaster';
  province: string;
  city: string | null;
  disasterType: string;
  count: number;
}

export interface VolunteerAlert extends BaseAlert {
  type: 'volunteer';
  title: string;
  placeName: string;
  volunteerDate: string;
  suptype: string; // '취소' or '변경'
}
