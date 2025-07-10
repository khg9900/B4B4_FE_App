// src/types/Map.ts
export type ShelterDto = {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

export type DisasterType =
  | 'EARTHQUAKE'
  | 'FLOOD'
  | 'TYPHOON'
  | 'WILDFIRE'
  | 'LANDSLIDE'
  | 'POWER_OUTAGE'
  | 'TERROR_ATTACK'
  | 'BUILDING_COLLAPSE';

export type DisasterDto = {
  disasterType: DisasterType;
  status: string;
  count: number;
  latitude: number;
  longitude: number;
};

export const disasterTypeNameMap: Record<DisasterType, string> = {
  EARTHQUAKE: '지진',
  FLOOD: '홍수',
  TYPHOON: '태풍',
  WILDFIRE: '산불',
  LANDSLIDE: '산사태',
  POWER_OUTAGE: '정전',
  TERROR_ATTACK: '테러',
  BUILDING_COLLAPSE: '건물 붕괴',
};
