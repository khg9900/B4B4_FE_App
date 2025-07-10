export interface VolunteerParticipationResponse {
  participantId: number;
  postId: number;
  postTitle: string;
  teamNumber: number;
  status: 'PARTICIPATED' | 'CANCELLED' | 'BLACKLISTED' | 'PRESENT' | 'ABSENT';
  joinedAt: string;
  checkinStart: string;
  checkinEnd: string;
  placeName: string;
}
