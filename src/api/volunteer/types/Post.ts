// 서버 DTO 기반 게시글 리스트 아이템
export interface PostsResponse {
  id: number;
  title: string;
  volunteerDate: string; // yyyy-MM-dd
  province?: string;
  city?: string;
  category: 'RECRUITMENT' | 'SUPPORT';
  totalCapacity: number;
  recruitmentStartDate?: string;
  recruitmentEndDate?: string;
  status: 'OPEN' | 'CLOSED' | 'COMPLETED';
}

export interface PostsTotalResponse {
  id: number;
  title: string;
  volunteerDate: string; // yyyy-MM-dd
  province?: string;
  city?: string;
  category: 'RECRUITMENT' | 'SUPPORT';
  totalCapacity: number;
  currentParticipants: number;
  recruitmentStartDate?: string;
  recruitmentEndDate?: string;
  status: 'OPEN' | 'CLOSED' | 'COMPLETED';
}


// Slice 구조
export interface SliceResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  last: boolean;
}

// 게시글 상세
export interface PostDetailResponse {
  title: string;
  content: string;
  category: 'RECRUITMENT' | 'SUPPORT';
  totalCapacity: number;
  teamSize: number;
  volunteerDate: string; // yyyy-MM-dd
  volunteerStartTime: string; // ISO 8601
  volunteerEndTime: string;   // ISO 8601
  location: {
    placeName: string;
    latitude: number;
    longitude: number;
    province: string;
    city: string;
  };
  attendancePolicy: {
    checkinStart: string;
    checkinEnd: string;
    allowedRadiusM: number;
    minStayMinutes: number;
  };
}

// 팀 관련
export interface PostTeamsResponse {
  postId: number;
  teams: TeamStatus[];
}

export interface TeamStatus {
  teamId: number;
  teamNumber: number;
  maxCapacity: number;
  currentCount: number;
}

// 필터 요청
export interface PostFilterRequest {
  province?: string;
  city?: string;
  status?: 'OPEN' | 'CLOSED' | 'COMPLETED';
  category?: 'RECRUITMENT' | 'SUPPORT';
  volunteerStartDate?: string; // yyyy-MM-dd
  volunteerEndDate?: string;   // yyyy-MM-dd
}
