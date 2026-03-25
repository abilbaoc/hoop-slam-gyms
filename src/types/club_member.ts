export interface ClubMember {
  id: string;
  gymId: string;
  userId: string;
  nickname: string;
  email?: string;
  joinedAt: string;
  level?: number;
  gamesPlayed?: number;
  gamesWon?: number;
  winPercentage?: number;
}
