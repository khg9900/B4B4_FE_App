import axiosInstance from '../../global/api/axiosInstance';
import type { VolunteerParticipationResponse } from '../types/Participation';

import type {
  CreatePostRequest,
  PostDetailResponse,
  VolunteerPostPage,
  PostTeamsResponse,
} from '../types/Post';

export const volunteercreatepostApi = {
  createPost: (data: CreatePostRequest) => axiosInstance.post('/post', data),
};

export const volunteerpostsApi = {
  fetchPosts: async (page: number = 0, size: number = 10): Promise<VolunteerPostPage> => {
    const response = await axiosInstance.get(`/post?page=${page}&size=${size}`);
    return response.data.payload;
  },
};

export const volunteerpostApi = {
  getPostDetail: async (postId: number): Promise<PostDetailResponse> => {
    const response = await axiosInstance.get(`/post/${postId}`);
    return response.data.payload;
  },

  getPostTeams: async (postId: number): Promise<PostTeamsResponse> => {
    const response = await axiosInstance.get(`/post/${postId}/teams`);
    return response.data.payload;
  },

  applyToTeam: async (postId: number, teamNumber: number): Promise<void> => {
    await axiosInstance.post(`/posts/${postId}/teams/${teamNumber}/apply`);
  },
};

export const volunteerparticipantApi = {
  getMyParticipations: async (params?: {
    status?: string;
    startTime?: string;
    endTime?: string;
  }): Promise<VolunteerParticipationResponse[]> => {
    const res = await axiosInstance.get('/volunteer-participants/my', { params });
    return res.data.payload;
  },

  cancelParticipation: async (participantId: number): Promise<void> => {
    await axiosInstance.patch(`/volunteer-participants/${participantId}`, {
      status: 'CANCELLED',
    });
  },
};