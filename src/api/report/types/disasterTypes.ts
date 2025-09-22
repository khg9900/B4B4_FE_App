export enum DisasterType {
  EARTHQUAKE = 'EARTHQUAKE',
  FLOOD = 'FLOOD',
  TYPHOON = 'TYPHOON',
  WILDFIRE = 'WILDFIRE',
  LANDSLIDE = 'LANDSLIDE',
  POWER_OUTAGE = 'POWER_OUTAGE',
  TERROR_ATTACK = 'TERROR_ATTACK',
  BUILDING_COLLAPSE = 'BUILDING_COLLAPSE'
}

// 재난 유형별 한글 이름
export const disasterTypeNames: Record<DisasterType, string> = {
  [DisasterType.EARTHQUAKE]: '지진',
  [DisasterType.FLOOD]: '홍수',
  [DisasterType.TYPHOON]: '태풍',
  [DisasterType.WILDFIRE]: '산불',
  [DisasterType.LANDSLIDE]: '산사태',
  [DisasterType.POWER_OUTAGE]: '정전',
  [DisasterType.TERROR_ATTACK]: '테러',
  [DisasterType.BUILDING_COLLAPSE]: '건물 붕괴'
};

// 공통 컬러 코드
export const B4_ORANGE = '#FF6B00';
export const B4_ORANGE_LIGHT = '#FFD4B3';
