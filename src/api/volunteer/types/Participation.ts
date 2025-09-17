export interface VolunteerParticipationResponse {
  participantId: number;
  postId: number;
  postTitle: string;
  teamNumber: number;
  status: 'PARTICIPATED' | 'CANCELLED' | 'BLACKLISTED' | 'PRESENT' | 'ABSENT';
  volunteerDate: string;
  volunteerStartTime: string;
  volunteerEndTime: string;
  province: string;
  city: string;
  placeName: string;
}
