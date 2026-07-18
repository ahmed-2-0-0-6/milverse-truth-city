export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      assessment_entries: {
        Row: {
          accuracy: number
          calibration_gap: number
          codename_hash: string
          created_at: string
          false_alarms: number
          form: string
          group_code: string
          id: string
          items: Json
          mean_confidence: number
          missed_scams: number
          overconfident_errors: number
          phase: string
          unverifiable_recognized: number
        }
        Insert: {
          accuracy: number
          calibration_gap: number
          codename_hash: string
          created_at?: string
          false_alarms: number
          form: string
          group_code: string
          id?: string
          items: Json
          mean_confidence: number
          missed_scams: number
          overconfident_errors: number
          phase: string
          unverifiable_recognized: number
        }
        Update: {
          accuracy?: number
          calibration_gap?: number
          codename_hash?: string
          created_at?: string
          false_alarms?: number
          form?: string
          group_code?: string
          id?: string
          items?: Json
          mean_confidence?: number
          missed_scams?: number
          overconfident_errors?: number
          phase?: string
          unverifiable_recognized?: number
        }
        Relationships: []
      }
      assessment_phase: {
        Row: {
          group_code: string
          phase: string
          updated_at: string
        }
        Insert: {
          group_code: string
          phase?: string
          updated_at?: string
        }
        Update: {
          group_code?: string
          phase?: string
          updated_at?: string
        }
        Relationships: []
      }
      citizen_cases: {
        Row: {
          created_at: string
          device_id: string | null
          id: string
          scenario_config: Json
          share_code: string
          source: string
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          id?: string
          scenario_config: Json
          share_code: string
          source?: string
        }
        Update: {
          created_at?: string
          device_id?: string | null
          id?: string
          scenario_config?: Json
          share_code?: string
          source?: string
        }
        Relationships: []
      }
      daily_plays: {
        Row: {
          case_id: string
          correct: boolean
          created_at: string
          device_id: string
          drop_date: string
          id: string
          stake: number
          verdict: string
        }
        Insert: {
          case_id: string
          correct: boolean
          created_at?: string
          device_id: string
          drop_date: string
          id?: string
          stake: number
          verdict: string
        }
        Update: {
          case_id?: string
          correct?: boolean
          created_at?: string
          device_id?: string
          drop_date?: string
          id?: string
          stake?: number
          verdict?: string
        }
        Relationships: []
      }
      devintel_briefs: {
        Row: {
          brief: Json
          created_at: string
          id: string
          source: string
          stats: Json
        }
        Insert: {
          brief: Json
          created_at?: string
          id?: string
          source?: string
          stats: Json
        }
        Update: {
          brief?: Json
          created_at?: string
          id?: string
          source?: string
          stats?: Json
        }
        Relationships: []
      }
      district_votes: {
        Row: {
          created_at: string
          device_id: string | null
          district: string
          id: string
          suggestion: string | null
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          district: string
          id?: string
          suggestion?: string | null
        }
        Update: {
          created_at?: string
          device_id?: string | null
          district?: string
          id?: string
          suggestion?: string | null
        }
        Relationships: []
      }
      editions: {
        Row: {
          content: Json
          created_at: string
          edition_date: string
          edition_number: number
          id: string
          motto: string
          published_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          content: Json
          created_at?: string
          edition_date: string
          edition_number: number
          id?: string
          motto?: string
          published_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          edition_date?: string
          edition_number?: number
          id?: string
          motto?: string
          published_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      family_code_attempts: {
        Row: {
          code: string
          count: number
          hour_bucket: string
        }
        Insert: {
          code: string
          count?: number
          hour_bucket: string
        }
        Update: {
          code?: string
          count?: number
          hour_bucket?: string
        }
        Relationships: []
      }
      family_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          revoked_at: string | null
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          revoked_at?: string | null
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          revoked_at?: string | null
        }
        Relationships: []
      }
      paper_interactions: {
        Row: {
          correct: boolean
          created_at: string
          device_id: string | null
          edition_number: number
          id: string
          section: string
        }
        Insert: {
          correct: boolean
          created_at?: string
          device_id?: string | null
          edition_number: number
          id?: string
          section: string
        }
        Update: {
          correct?: boolean
          created_at?: string
          device_id?: string | null
          edition_number?: number
          id?: string
          section?: string
        }
        Relationships: []
      }
      pilot_entries: {
        Row: {
          case_id: string
          created_at: string
          device_id: string
          group_code: string
          id: string
          points: number
          probe_stats: Json | null
          result: string
          tier: number | null
          wing: string
        }
        Insert: {
          case_id: string
          created_at?: string
          device_id: string
          group_code: string
          id?: string
          points: number
          probe_stats?: Json | null
          result: string
          tier?: number | null
          wing: string
        }
        Update: {
          case_id?: string
          created_at?: string
          device_id?: string
          group_code?: string
          id?: string
          points?: number
          probe_stats?: Json | null
          result?: string
          tier?: number | null
          wing?: string
        }
        Relationships: []
      }
      story_submissions: {
        Row: {
          country: string | null
          created_at: string
          device_id: string | null
          id: string
          published_share_code: string | null
          reviewer_notes: string | null
          status: string
          story: Json
          updated_at: string
          year: number | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          device_id?: string | null
          id?: string
          published_share_code?: string | null
          reviewer_notes?: string | null
          status?: string
          story: Json
          updated_at?: string
          year?: number | null
        }
        Update: {
          country?: string | null
          created_at?: string
          device_id?: string | null
          id?: string
          published_share_code?: string | null
          reviewer_notes?: string | null
          status?: string
          story?: Json
          updated_at?: string
          year?: number | null
        }
        Relationships: []
      }
      telemetry_events: {
        Row: {
          case_id: string | null
          event_type: string
          id: number
          payload: Json
          route: string | null
          session_id: string | null
          ts: string
        }
        Insert: {
          case_id?: string | null
          event_type: string
          id?: number
          payload?: Json
          route?: string | null
          session_id?: string | null
          ts?: string
        }
        Update: {
          case_id?: string | null
          event_type?: string
          id?: number
          payload?: Json
          route?: string | null
          session_id?: string | null
          ts?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      family_code_is_active: { Args: { _code: string }; Returns: boolean }
      family_code_register: { Args: { _code: string }; Returns: undefined }
      family_code_revoke: { Args: { _code: string }; Returns: undefined }
      family_code_touch: {
        Args: { _code: string; _limit?: number }
        Returns: boolean
      }
      get_assessment_group_entries: {
        Args: { _code: string }
        Returns: {
          accuracy: number
          calibration_gap: number
          codename_hash: string
          created_at: string
          false_alarms: number
          form: string
          items: Json
          mean_confidence: number
          missed_scams: number
          overconfident_errors: number
          phase: string
          unverifiable_recognized: number
        }[]
      }
      get_case_city_stats: {
        Args: { _case_id: string }
        Returns: {
          false_alarms: number
          fooled: number
          total: number
        }[]
      }
      get_city_board: {
        Args: { _code: string }
        Returns: {
          correct_count: number
          false_alarms: number
          handle: string
          missed: number
          plays: number
          points: number
        }[]
      }
      get_daily_split: {
        Args: { _case_id: string; _drop_date: string }
        Returns: {
          correct_count: number
          total: number
        }[]
      }
      get_most_devious_designer: {
        Args: never
        Returns: {
          case_id: string
          fooled_pct: number
          plays: number
        }[]
      }
      get_paper_split: {
        Args: { _edition_number: number; _section: string }
        Returns: {
          correct_count: number
          total: number
        }[]
      }
      get_pilot_group_entries: {
        Args: { _code: string }
        Returns: {
          case_id: string
          created_at: string
          device_id: string
          points: number
          result: string
          tier: number
          wing: string
        }[]
      }
      get_sharpest_watch: {
        Args: never
        Returns: {
          correct_pct: number
          handle: string
          plays: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
