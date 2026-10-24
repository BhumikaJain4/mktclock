import { request } from './api';
import { ChallengeAttempt } from '../types';

export const challengeService = {
  async startChallenge(target_minutes: number): Promise<ChallengeAttempt> {
    return request<ChallengeAttempt>('/api/challenges', {
      method: 'POST',
      body: JSON.stringify({ target_minutes }),
    });
  },

  async getActiveChallenge(): Promise<{ active: ChallengeAttempt | null }> {
    return request<{ active: ChallengeAttempt | null }>('/api/challenges/active');
  },

  async heartbeat(attempt_id: string, client_elapsed_seconds?: number): Promise<{ id: string; status: string; elapsed_seconds: number }> {
    return request<{ id: string; status: string; elapsed_seconds: number }>(`/api/challenges/${attempt_id}/heartbeat`, {
      method: 'POST',
      body: JSON.stringify({ client_elapsed_seconds }),
    });
  },

  async interruptChallenge(
    attempt_id: string,
    client_elapsed_seconds?: number,
    reason: string = 'page_hidden',
    useKeepAlive: boolean = false
  ): Promise<ChallengeAttempt> {
    return request<ChallengeAttempt>(`/api/challenges/${attempt_id}/interrupt`, {
      method: 'POST',
      keepalive: useKeepAlive,
      body: JSON.stringify({
        client_elapsed_seconds,
        reason,
      }),
    });
  },

  async completeChallenge(
    attempt_id: string,
    client_elapsed_seconds?: number
  ): Promise<ChallengeAttempt> {
    return request<ChallengeAttempt>(`/api/challenges/${attempt_id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ client_elapsed_seconds }),
    });
  },

  async endChallenge(
    attempt_id: string,
    client_elapsed_seconds?: number,
    reason: string = 'manual_end'
  ): Promise<ChallengeAttempt> {
    return request<ChallengeAttempt>(`/api/challenges/${attempt_id}/end`, {
      method: 'POST',
      body: JSON.stringify({ client_elapsed_seconds, reason }),
    });
  },

  async getAttempt(attempt_id: string): Promise<ChallengeAttempt> {
    return request<ChallengeAttempt>(`/api/challenges/${attempt_id}`);
  },
};
