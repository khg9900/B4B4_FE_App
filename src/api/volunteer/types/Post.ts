export interface CreatePostRequest {
  title: string;
  content: string;
  category: 'RECRUITMENT'; // 무조건 RECRUITMENT로 고정
  totalCapacity: number;
  teamSize: number;
  location: {
    placeName: string;
    latitude: number;
    longitude: number;
  };
  attendancePolicy: {
    checkinStart: string; // ISO 형식 e.g., "2025-06-20T09:00:00"
    checkinEnd: string;
    allowedRadiusM: number;
    minStayMinutes: number;
  };
}

export interface VolunteerPostItem {
  id: number;
  title: string;
  nickname: string;
  createdAt: string;
  category: 'RECRUITMENT' | 'SUPPORT';
  capacity: number;
}

export interface VolunteerPostPage {
  content: VolunteerPostItem[];
  last: boolean;
  totalPages: number;
  totalElements: number;
  number: number; // current page
  size: number;
  numberOfElements: number;
}

export interface PostDetailResponse {
  title: string;
  content: string;
  category: 'RECRUITMENT' | 'SUPPORT';
  totalCapacity: number;
  teamSize: number;
  location: {
    placeName: string;
    latitude: number;
    longitude: number;
  };
  attendancePolicy: {
    checkinStart: string;
    checkinEnd: string;
    allowedRadiusM: number;
    minStayMinutes: number;
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
