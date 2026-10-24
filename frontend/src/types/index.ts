export type ChallengeStatus = 'active' | 'completed' | 'interrupted' | 'abandoned';

export type EndReason = 
  | 'duration_completed' 
  | 'page_hidden' 
  | 'page_exit' 
  | 'manual_end' 
  | 'recovered_after_disconnect';

export interface Student {
  id: string;
  email: string;
  name: string;
  picture?: string | null;
  best_score_seconds: number;
  best_attempt_id?: string | null;
  best_achieved_at?: string | null;
  completed_challenges_count: number;
  total_attempts_count: number;
  created_at: string;
  last_active_at: string;
}

export interface ChallengeAttempt {
  id: string;
  student_id: string;
  target_seconds: number;
  started_at: string;
  ended_at?: string | null;
  elapsed_seconds: number;
  status: ChallengeStatus;
  end_reason?: EndReason | string | null;
  is_new_personal_best?: boolean;
  previous_best_seconds?: number;
  current_best_seconds?: number;
  user_rank?: number | null;
}

export interface LeaderboardEntry {
  rank: number;
  student_id: string;
  display_name: string;
  avatar_initials: string;
  picture?: string | null;
  best_score_seconds: number;
  formatted_duration: string;
  best_achieved_at?: string | null;
  is_current_user: boolean;
}

export interface LeaderboardResponse {
  total_students: number;
  page: number;
  page_size: number;
  total_pages: number;
  entries: LeaderboardEntry[];
  current_user_entry?: LeaderboardEntry | null;
}

export interface UserRankResponse {
  student_id: string;
  display_name: string;
  rank?: number | null;
  best_score_seconds: number;
  formatted_duration: string;
  best_achieved_at?: string | null;
  total_participants: number;
}

export interface AuthMeResponse {
  authenticated: boolean;
  student_id?: string | null;
  email?: string | null;
  name?: string | null;
  picture?: string | null;
  best_score_seconds?: number;
  best_achieved_at?: string | null;
  completed_challenges_count?: number;
  allowed_domain: string;
  is_dev_mode: boolean;
}
