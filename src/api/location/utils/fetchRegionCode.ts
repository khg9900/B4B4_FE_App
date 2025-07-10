// src/utils/fetchRegionCode.ts
import { KAKAO_REST_API_KEY } from '@env';

export type Region = {
  province: string;    // 시/도
  city: string | null; // 시/군/구, 세종시는 null 처리
};

export default async function fetchRegionCode(latitude: number, longitude: number): Promise<Region> {
  try {
    const res = await fetch(
      `https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?x=${longitude}&y=${latitude}`,
      {
        method: 'GET',
        headers: {
          Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
        },
      }
    );

    if (!res.ok) throw new Error(`카카오 API 에러: ${res.status}`);

    const data = await res.json();

    if (data.documents && data.documents.length > 0) {
      const region = data.documents[0];
      return parseProvinceCity(
        region.region_1depth_name,
        region.region_2depth_name,
        region.region_3depth_name
      );
    }

    return { province: '', city: null };
  } catch (error) {
    console.error('카카오 지역 변환 오류:', error);
    return { province: '', city: null };
  }
}

function parseProvinceCity(region1: string, region2: string, region3: string): Region {
  if (region1.includes('세종')) {
    return {
      province: region1,
      city: null,
    };
  }

  return {
    province: region1,
    city: region2, // region2까지만 사용
  };
}
