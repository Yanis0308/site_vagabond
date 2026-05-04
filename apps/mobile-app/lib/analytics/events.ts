export type SignInMethod = "google" | "apple";
export type PhotoSource = "camera" | "gallery";
export type LeaderboardPeriod = "all_time" | "monthly";
export type SocialPlatform = "instagram" | "facebook" | "twitter";

export interface EventSchemas {
  sign_in_started: { method: SignInMethod };
  sign_in_succeeded: { method: SignInMethod };
  sign_in_failed: { method: SignInMethod; reason: string };
  sign_out: Record<string, never>;
  account_deleted: Record<string, never>;

  map_viewed: Record<string, never>;
  map_recenter_pressed: Record<string, never>;

  poi_details_viewed: { poi_id: string };
  poi_details_scrolled: { poi_id: string };
  poi_opening_hours_expanded: { poi_id: string };
  poi_validation_started: { poi_id: string; source: PhotoSource };
  poi_validation_cancelled: { poi_id: string };
  poi_validated: { poi_id: string };
  poi_validation_deleted: { visited_poi_id: number };
  poi_report_started: { poi_id: string };
  poi_report_submitted: {
    poi_id: string;
  };
  map_feedback_started: Record<string, never>;
  map_feedback_submitted: Record<string, never>;
  place_suggestion_started: Record<string, never>;
  place_suggestion_submitted: Record<string, never>;
  poi_search_performed: { query_length: number; results_count: number };
  poi_search_result_selected: { result_type: string; result_id: string };
  poi_phone_called: { poi_id: string };
  poi_website_opened: { poi_id: string };
  poi_directions_requested: { poi_id: string };
  poi_social_link_opened: { poi_id: string; platform: SocialPlatform };

  photo_upload_started: { source: PhotoSource; poi_id: string };
  photo_upload_succeeded: { visited_poi_id: number };
  photo_upload_failed: { reason: string; visited_poi_id: number };

  profile_viewed: { is_self: boolean; viewed_user_id: string };
  nickname_updated: Record<string, never>;
  privacy_settings_changed: { is_private: boolean };
  leaderboard_viewed: { period: LeaderboardPeriod };
  app_review_submitted: { positive: boolean; has_comment: boolean };
  app_review_dismissed: { visited_poi_count: number; is_re_prompt: boolean };

  api_error: { endpoint: string; status: number; method: string };
}

export type EventName = keyof EventSchemas;
export type EventParams<K extends EventName> = EventSchemas[K];
