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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      allergies: {
        Row: {
          code: string
          created_at: string
          id: string
          is_none: boolean
          label: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_none?: boolean
          label: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_none?: boolean
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      attendance_records: {
        Row: {
          attendance_date: string
          check_in_at: string | null
          check_out_at: string | null
          child_id: string
          created_at: string
          id: string
          notes: string | null
          recorded_by: string | null
          updated_at: string
        }
        Insert: {
          attendance_date: string
          check_in_at?: string | null
          check_out_at?: string | null
          child_id: string
          created_at?: string
          id?: string
          notes?: string | null
          recorded_by?: string | null
          updated_at?: string
        }
        Update: {
          attendance_date?: string
          check_in_at?: string | null
          check_out_at?: string | null
          child_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          recorded_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      authorized_pickup_persons: {
        Row: {
          child_id: string
          created_at: string
          document: string | null
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          relationship: string | null
          updated_at: string
        }
        Insert: {
          child_id: string
          created_at?: string
          document?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          phone?: string | null
          relationship?: string | null
          updated_at?: string
        }
        Update: {
          child_id?: string
          created_at?: string
          document?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          relationship?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "authorized_pickup_persons_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      child_allergies: {
        Row: {
          allergy_id: string
          child_id: string
          created_at: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          allergy_id: string
          child_id: string
          created_at?: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          allergy_id?: string
          child_id?: string
          created_at?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_allergies_allergy_id_fkey"
            columns: ["allergy_id"]
            isOneToOne: false
            referencedRelation: "allergies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "child_allergies_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      child_health: {
        Row: {
          child_id: string
          created_at: string
          medication_consent: boolean
          nap_notes: string | null
          pediatrician_name: string | null
          pediatrician_phone: string | null
          special_care_notes: string | null
          updated_at: string
          urgent_medical_flag: boolean
          vaccination_note: string | null
        }
        Insert: {
          child_id: string
          created_at?: string
          medication_consent?: boolean
          nap_notes?: string | null
          pediatrician_name?: string | null
          pediatrician_phone?: string | null
          special_care_notes?: string | null
          updated_at?: string
          urgent_medical_flag?: boolean
          vaccination_note?: string | null
        }
        Update: {
          child_id?: string
          created_at?: string
          medication_consent?: boolean
          nap_notes?: string | null
          pediatrician_name?: string | null
          pediatrician_phone?: string | null
          special_care_notes?: string | null
          updated_at?: string
          urgent_medical_flag?: boolean
          vaccination_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "child_health_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: true
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      child_tutors: {
        Row: {
          child_id: string
          created_at: string
          id: string
          is_legal_guardian: boolean
          is_primary: boolean
          photo_consent: boolean
          photo_consent_at: string | null
          relationship: string | null
          tutor_id: string
          updated_at: string
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          is_legal_guardian?: boolean
          is_primary?: boolean
          photo_consent?: boolean
          photo_consent_at?: string | null
          relationship?: string | null
          tutor_id: string
          updated_at?: string
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          is_legal_guardian?: boolean
          is_primary?: boolean
          photo_consent?: boolean
          photo_consent_at?: string | null
          relationship?: string | null
          tutor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_tutors_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "child_tutors_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          birth_date: string
          classroom_id: string
          created_at: string
          document: string | null
          full_name: string
          gender: Database["public"]["Enums"]["gender"] | null
          id: string
          nickname: string | null
          primary_educator_id: string | null
          schedule: Database["public"]["Enums"]["schedule"] | null
          updated_at: string
        }
        Insert: {
          birth_date: string
          classroom_id: string
          created_at?: string
          document?: string | null
          full_name: string
          gender?: Database["public"]["Enums"]["gender"] | null
          id?: string
          nickname?: string | null
          primary_educator_id?: string | null
          schedule?: Database["public"]["Enums"]["schedule"] | null
          updated_at?: string
        }
        Update: {
          birth_date?: string
          classroom_id?: string
          created_at?: string
          document?: string | null
          full_name?: string
          gender?: Database["public"]["Enums"]["gender"] | null
          id?: string
          nickname?: string | null
          primary_educator_id?: string | null
          schedule?: Database["public"]["Enums"]["schedule"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "children_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "children_primary_educator_id_fkey"
            columns: ["primary_educator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classroom_educators: {
        Row: {
          classroom_id: string
          created_at: string
          educator_id: string
          id: string
          is_lead: boolean
          updated_at: string
        }
        Insert: {
          classroom_id: string
          created_at?: string
          educator_id: string
          id?: string
          is_lead?: boolean
          updated_at?: string
        }
        Update: {
          classroom_id?: string
          created_at?: string
          educator_id?: string
          id?: string
          is_lead?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classroom_educators_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_educators_educator_id_fkey"
            columns: ["educator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classrooms: {
        Row: {
          age_max_months: number
          age_min_months: number
          age_range: string
          capacity: number | null
          created_at: string
          description: string | null
          id: string
          name: string
          recommended: boolean
          slug: string
          tagline: string | null
          updated_at: string
        }
        Insert: {
          age_max_months: number
          age_min_months: number
          age_range: string
          capacity?: number | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          recommended?: boolean
          slug: string
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          age_max_months?: number
          age_min_months?: number
          age_range?: string
          capacity?: number | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          recommended?: boolean
          slug?: string
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          child_id: string
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          relationship: string | null
          status: Database["public"]["Enums"]["invitation_status"]
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          child_id: string
          code: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          relationship?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          child_id?: string
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          relationship?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          post_id: string
          sort_order: number
          storage_path: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          post_id: string
          sort_order?: number
          storage_path: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          post_id?: string
          sort_order?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_images_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string | null
          author_name: string
          body: string
          category: Database["public"]["Enums"]["post_category"] | null
          classroom_id: string | null
          created_at: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          author_name?: string
          body: string
          category?: Database["public"]["Enums"]["post_category"] | null
          classroom_id?: string | null
          created_at?: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          author_name?: string
          body?: string
          category?: Database["public"]["Enums"]["post_category"] | null
          classroom_id?: string | null
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          daily_summary_enabled: boolean
          email: string | null
          full_name: string
          id: string
          notify_on_post: boolean
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          daily_summary_enabled?: boolean
          email?: string | null
          full_name: string
          id: string
          notify_on_post?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          daily_summary_enabled?: boolean
          email?: string | null
          full_name?: string
          id?: string
          notify_on_post?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_tutor_invitation: {
        Args: { p_code: string; p_photo_consent?: boolean }
        Returns: string
      }
      can_staff_access_child: { Args: { p_child_id: string }; Returns: boolean }
      count_children_without_photo_consent: {
        Args: { p_classroom_id?: string }
        Returns: number
      }
      create_child: {
        Args: {
          p_allergy_codes: string[]
          p_allergy_notes: string
          p_birth_date: string
          p_classroom_id: string
          p_document: string
          p_full_name: string
          p_gender: Database["public"]["Enums"]["gender"]
          p_medication_consent: boolean
          p_nap_notes: string
          p_nickname: string
          p_pediatrician_name: string
          p_pediatrician_phone: string
          p_primary_educator_id: string
          p_schedule: Database["public"]["Enums"]["schedule"]
          p_urgent_medical_flag: boolean
        }
        Returns: string
      }
      create_tutor_invitation: {
        Args: { p_child_id: string; p_email: string; p_relationship?: string }
        Returns: {
          code: string
          expires_at: string
          invitation_id: string
        }[]
      }
      get_invitation_preview: {
        Args: { p_code: string }
        Returns: {
          child_display_name: string
          classroom_name: string
          email: string
          expires_at: string
        }[]
      }
      is_active_admin: { Args: never; Returns: boolean }
      is_active_manager: { Args: never; Returns: boolean }
      is_active_staff: { Args: never; Returns: boolean }
      is_assigned_educator: {
        Args: { p_classroom_id: string }
        Returns: boolean
      }
      is_linked_tutor: { Args: { p_child_id: string }; Returns: boolean }
      is_tutor_of_classroom: {
        Args: { p_classroom_id: string }
        Returns: boolean
      }
      list_active_staff_profiles: {
        Args: never
        Returns: {
          avatar_url: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }[]
      }
      revoke_tutor_invitation: {
        Args: { p_invitation_id: string }
        Returns: undefined
      }
    }
    Enums: {
      gender: "boy" | "girl" | "other"
      invitation_status: "pending" | "accepted" | "revoked" | "expired"
      post_category: "actividad" | "aviso" | "menu" | "foto" | "espacio"
      schedule:
        | "full_day"
        | "mornings_with_lunch"
        | "mornings_only"
        | "afternoon"
      user_role: "admin" | "director" | "educator" | "tutor"
      user_status: "pending" | "active"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      gender: ["boy", "girl", "other"],
      invitation_status: ["pending", "accepted", "revoked", "expired"],
      post_category: ["actividad", "aviso", "menu", "foto", "espacio"],
      schedule: [
        "full_day",
        "mornings_with_lunch",
        "mornings_only",
        "afternoon",
      ],
      user_role: ["admin", "director", "educator", "tutor"],
      user_status: ["pending", "active"],
    },
  },
} as const
