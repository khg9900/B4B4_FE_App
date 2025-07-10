// 📁 src/alert/types/index.ts

export type Alert = DisasterAlert | VolunteerAlert;

interface BaseAlert {
  id: number;
  createdAt: string;
}

export interface DisasterAlert extends BaseAlert {
  type: 'disaster';
  si: string;
  gu: string;
  disasterType: string;
  count: number;
}

export interface VolunteerAlert extends BaseAlert {
  type: 'volunteer';
  title: string;
  placeName: string;
  checkinStart: string;
}
