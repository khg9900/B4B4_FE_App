import axiosInstance from '../../global/api/axiosInstance';
import type {
  CreatePostRequest,
  PostDetailResponse,
  PostsResponse,
  PostTeamsResponse,
  SliceResponse,
  PostFilterRequest,
  TeamStatus,
} from '../types/Post';

export const volunteerApi = {
  // 게시글 리스트 조회 (Slice 구조)
  getPosts: async (
    filter: PostFilterRequest = {},
    page: number = 0,
    size: number = 10
  ): Promise<SliceResponse<PostsResponse>> => {
    const params = { ...filter, page, size };
    const response = await axiosInstance.get('/post', { params });
    return response.data.payload;
  },

  // 게시글 상세 조회
  getPostDetail: async (postId: number): Promise<PostDetailResponse> => {
    const response = await axiosInstance.get(`/post/${postId}`);
    return response.data.payload;
  },

  // 게시글 작성
  createPost: async (data: CreatePostRequest) => {
    const response = await axiosInstance.post('/post', data);
    return response.data.payload;
  },

  // 팀 정보 조회
  getPostTeams: async (postId: number): Promise<PostTeamsResponse> => {
    const response = await axiosInstance.get(`/post/${postId}/teams`);
    return response.data.payload;
  },

  // 팀 신청
  applyToTeam: async (postId: number, teamNumber: number): Promise<void> => {
    await axiosInstance.post(`/post/${postId}/teams/${teamNumber}/apply`);
  },
};

// 참여자 관련 API
export const volunteerParticipantApi = {
  getMyParticipations: async (params?: {
    status?: string;
    startTime?: string;
    endTime?: string;
  }): Promise<any[]> => {
    const res = await axiosInstance.get('/volunteer-participants/my', { params });
    return res.data.payload;
  },

  cancelParticipation: async (participantId: number): Promise<void> => {
    await axiosInstance.patch(`/volunteer-participants/${participantId}`, {
      status: 'CANCELLED',
    });
  },
};
