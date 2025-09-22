import { Alert, DisasterAlert, VolunteerAlert, VolunteerAlertSubtype } from '../types';

export type DisasterAlertApi = {
  id: number;
  province: string;
  city: string | null | undefined;
  disasterType: string;
  count: number;
  createdAt: string;
};

export type VolunteerAlertApi = {
  id: number;
  title: string;
  placeName: string;
  volunteerDate: string;
  createdAt: string;
  subtype: VolunteerAlertSubtype;
};

const normalizeCity = (city: string | null | undefined): string | null =>
  city && city.length > 0 ? city : null;

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
  subtype: a.subtype,
});

export const mapAlerts = (arr: Array<DisasterAlertApi | VolunteerAlertApi>): Alert[] =>
  arr.map((item) => {
    if ('disasterType' in item) return mapDisasterAlert(item as DisasterAlertApi);
    return mapVolunteerAlert(item as VolunteerAlertApi);
  });
