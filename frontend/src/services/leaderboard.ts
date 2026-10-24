import { request } from './api';
import { LeaderboardResponse, UserRankResponse } from '../types';

export const leaderboardService = {
  async getLeaderboard(page: number = 1, pageSize: number = 500): Promise<LeaderboardResponse> {
    return request<LeaderboardResponse>(`/api/leaderboard?page=${page}&page_size=${pageSize}`);
  },

  async getMyRank(): Promise<UserRankResponse> {
    return request<UserRankResponse>('/api/leaderboard/me');
  },
};
