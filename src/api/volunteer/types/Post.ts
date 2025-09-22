export interface PostsResponse {
  id: number;
  title: string;
  volunteerDate: string;
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
  volunteerDate: string;
  province?: string;
  city?: string;
  category: 'RECRUITMENT' | 'SUPPORT';
  totalCapacity: number;
  currentParticipants: number;
  recruitmentStartDate?: string;
  recruitmentEndDate?: string;
  status: 'OPEN' | 'CLOSED' | 'COMPLETED';
}

export interface SliceResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  last: boolean;
}

export interface PostDetailResponse {
  title: string;
  content: string;
  category: 'RECRUITMENT' | 'SUPPORT';
  totalCapacity: number;
  volunteerDate: string;
  volunteerStartTime: string;
  volunteerEndTime: string;
  recruitmentStartDate: string;
  recruitmentEndDate: string;
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';

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
  };
}

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

export interface PostFilterRequest {
  province?: string;
  city?: string;
  status?: 'OPEN' | 'CLOSED' | 'COMPLETED';
  category?: 'RECRUITMENT' | 'SUPPORT';
  volunteerStartDate?: string;
  volunteerEndDate?: string;
}
