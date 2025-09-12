import axiosInstance from '../../global/api/axiosInstance';
import type {
  CreatePostRequest,
  PostDetailResponse,
  PostsResponse,
  PostTeamsResponse,
  SliceResponse,
  PostFilterRequest,
  PostsTotalResponse,
  TeamStatus,
} from '../types/Post';

export const volunteerApi = {
  getPosts: async (
    filter: PostFilterRequest = {},
    page: number = 0,
    size: number = 10
  ): Promise<SliceResponse<PostsTotalResponse>> => {
    try {
      const params = { ...filter, page, size };
      const response = await axiosInstance.get('/post', { params });
      return response.data.payload;
    } catch (error: any) {
      console.error('📌 getPosts 에러:', error.response?.data || error.message);
      throw error;
    }
  },

  getPostDetail: async (postId: number): Promise<PostDetailResponse> => {
    try {
      const response = await axiosInstance.get(`/post/${postId}`);
      return response.data.payload;
    } catch (error: any) {
      console.error('📌 getPostDetail 에러:', error.response?.data || error.message);
      throw error;
    }
  },

  createPost: async (data: CreatePostRequest) => {
    try {
      const response = await axiosInstance.post('/post', data);
      return response.data.payload;
    } catch (error: any) {
      console.error('📌 createPost 에러:', error.response?.data || error.message);
      throw error;
    }
  },

  getPostTeams: async (postId: number): Promise<PostTeamsResponse> => {
    try {
      const response = await axiosInstance.get(`/post/${postId}/teams`);
      return response.data.payload;
    } catch (error: any) {
      console.error('📌 getPostTeams 에러:', error.response?.data || error.message);
      throw error;
    }
  },

  applyToTeam: async (postId: number, teamNumber: number): Promise<void> => {
    try {
      await axiosInstance.post(`/post/${postId}/teams/${teamNumber}/apply`);
    } catch (error: any) {
      console.error('📌 applyToTeam 에러:', error.response?.data || error.message);
      throw error;
    }
  },
};

export const volunteerParticipantApi = {
  getMyParticipations: async (params?: {
    status?: string;
    startTime?: string;
    endTime?: string;
  }): Promise<any[]> => {
    try {
      const res = await axiosInstance.get('/volunteer-participants/my', { params });
      return res.data.payload;
    } catch (error: any) {
      console.error('📌 getMyParticipations 에러:', error.response?.data || error.message);
      throw error;
    }
  },

  cancelParticipation: async (participantId: number): Promise<void> => {
    try {
      await axiosInstance.patch(`/volunteer-participants/${participantId}`, {
        status: 'CANCELLED',
      });
    } catch (error: any) {
      console.error('📌 cancelParticipation 에러:', error.response?.data || error.message);
      throw error;
    }
  },
};
