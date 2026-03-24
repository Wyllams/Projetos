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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      calendar_events: {
        Row: {
          created_at: string | null
          event_date: string
          id: string
          lead_id: string | null
          start_time: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          event_date: string
          id?: string
          lead_id?: string | null
          start_time?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          event_date?: string
          id?: string
          lead_id?: string | null
          start_time?: string | null
          title?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          city: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          state: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          state?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          state?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          lead_id: string | null
          messages: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id?: string | null
          messages?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_id?: string | null
          messages?: Json | null
        }
        Relationships: []
      }
      daily_logs: {
        Row: {
          created_at: string | null
          id: string
          log_date: string
          log_text: string
          partner_id: string | null
          project_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          log_date?: string
          log_text: string
          partner_id?: string | null
          project_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          log_date?: string
          log_text?: string
          partner_id?: string | null
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string | null
          file_name: string
          file_type: string
          file_url: string
          id: string
          project_id: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_type: string
          file_url: string
          id?: string
          project_id?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_type?: string
          file_url?: string
          id?: string
          project_id?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_pages: {
        Row: {
          city: string | null
          created_at: string | null
          id: string
          name: string
          status: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          id?: string
          name: string
          status?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          id?: string
          name?: string
          status?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          assigned_partners: string[] | null
          assigned_to: string | null
          city: string | null
          client_id: string | null
          created_at: string | null
          email: string | null
          estimated_value: number | null
          id: string
          name: string | null
          notes: string | null
          partner_id: string | null
          phone: string | null
          score: number | null
          service_type: string | null
          source: string | null
          status: string | null
          updated_at: string | null
          urgency: string | null
        }
        Insert: {
          assigned_partners?: string[] | null
          assigned_to?: string | null
          city?: string | null
          client_id?: string | null
          created_at?: string | null
          email?: string | null
          estimated_value?: number | null
          id?: string
          name?: string | null
          notes?: string | null
          partner_id?: string | null
          phone?: string | null
          score?: number | null
          service_type?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          urgency?: string | null
        }
        Update: {
          assigned_partners?: string[] | null
          assigned_to?: string | null
          city?: string | null
          client_id?: string | null
          created_at?: string | null
          email?: string | null
          estimated_value?: number | null
          id?: string
          name?: string | null
          notes?: string | null
          partner_id?: string | null
          phone?: string | null
          score?: number | null
          service_type?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_ai: boolean | null
          payload: Json | null
          receiver_id: string | null
          sender_id: string | null
          topic: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_ai?: boolean | null
          payload?: Json | null
          receiver_id?: string | null
          sender_id?: string | null
          topic?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_ai?: boolean | null
          payload?: Json | null
          receiver_id?: string | null
          sender_id?: string | null
          topic?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string | null
          id: string
          link: string | null
          read: boolean | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          link?: string | null
          read?: boolean | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          link?: string | null
          read?: boolean | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          company_name: string | null
          created_at: string | null
          full_name: string | null
          id: string
          license_number: string | null
          notifications_email: boolean | null
          notifications_sms: boolean | null
          phone: string | null
          role: string
          specialty: string | null
          state: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          license_number?: string | null
          notifications_email?: boolean | null
          notifications_sms?: boolean | null
          phone?: string | null
          role?: string
          specialty?: string | null
          state?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          license_number?: string | null
          notifications_email?: boolean | null
          notifications_sms?: boolean | null
          phone?: string | null
          role?: string
          specialty?: string | null
          state?: string | null
        }
        Relationships: []
      }
      project_documents: {
        Row: {
          created_at: string | null
          file_name: string | null
          file_type: string | null
          file_url: string | null
          id: string
          project_id: string | null
        }
        Insert: {
          created_at?: string | null
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          project_id?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_photos: {
        Row: {
          caption: string | null
          created_at: string | null
          id: string
          photo_url: string | null
          project_id: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          id?: string
          photo_url?: string | null
          project_id?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          id?: string
          photo_url?: string | null
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_photos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_stages: {
        Row: {
          created_at: string | null
          id: string
          name: string
          order_index: number | null
          project_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          order_index?: number | null
          project_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          order_index?: number | null
          project_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_stages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          address: string | null
          client_id: string | null
          contract_value: number | null
          created_at: string | null
          deadline: string | null
          id: string
          name: string
          partner_id: string | null
          progress: number | null
          service_type: string | null
          status: string | null
        }
        Insert: {
          address?: string | null
          client_id?: string | null
          contract_value?: number | null
          created_at?: string | null
          deadline?: string | null
          id?: string
          name: string
          partner_id?: string | null
          progress?: number | null
          service_type?: string | null
          status?: string | null
        }
        Update: {
          address?: string | null
          client_id?: string | null
          contract_value?: number | null
          created_at?: string | null
          deadline?: string | null
          id?: string
          name?: string
          partner_id?: string | null
          progress?: number | null
          service_type?: string | null
          status?: string | null
        }
        Relationships: []
      }
      social_accounts: {
        Row: {
          access_token: string
          created_at: string | null
          id: string
          ig_business_id: string | null
          page_id: string | null
          page_name: string | null
          platform: string
          token_expires_at: string | null
        }
        Insert: {
          access_token: string
          created_at?: string | null
          id?: string
          ig_business_id?: string | null
          page_id?: string | null
          page_name?: string | null
          platform: string
          token_expires_at?: string | null
        }
        Update: {
          access_token?: string
          created_at?: string | null
          id?: string
          ig_business_id?: string | null
          page_id?: string | null
          page_name?: string | null
          platform?: string
          token_expires_at?: string | null
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          image_url: string | null
          metrics: Json | null
          platform: string
          post_id: string | null
          post_url: string | null
          published_at: string | null
          scheduled_at: string | null
          status: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          metrics?: Json | null
          platform: string
          post_id?: string | null
          post_url?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          status?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          metrics?: Json | null
          platform?: string
          post_id?: string | null
          post_url?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      stages: {
        Row: {
          created_at: string | null
          id: string
          name: string
          order_index: number
          project_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          order_index?: number
          project_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          order_index?: number
          project_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          role: string | null
          specialty: string | null
          status: string | null
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          role?: string | null
          specialty?: string | null
          status?: string | null
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          role?: string | null
          specialty?: string | null
          status?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
