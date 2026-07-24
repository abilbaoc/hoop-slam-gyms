export interface ClubMember {
  id: string;
  gymId: string;
  userId: string;
  nickname: string;
  // email eliminado en migration 003 (RGPD) — no volver a añadirlo
  joinedAt: string;
  level?: number;
  gamesPlayed?: number;
  gamesWon?: number;
  winPercentage?: number;
}
