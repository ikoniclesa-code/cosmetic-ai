export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          role: "user" | "admin";
          credits: number;
          language: "sr" | "hr" | "en";
          onboarding_completed: boolean;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          role?: "user" | "admin";
          credits?: number;
          language?: "sr" | "hr" | "en";
          onboarding_completed?: boolean;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          role?: "user" | "admin";
          credits?: number;
          language?: "sr" | "hr" | "en";
          onboarding_completed?: boolean;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      businesses: {
        Row: {
          id: string;
          user_id: string;
          name: string | null;
          industry: "cosmetics" | "home_chemistry" | "both" | null;
          logo_url: string | null;
          description: string | null;
          target_audience: string | null;
          communication_tone: string | null;
          social_networks: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string | null;
          industry?: "cosmetics" | "home_chemistry" | "both" | null;
          logo_url?: string | null;
          description?: string | null;
          target_audience?: string | null;
          communication_tone?: string | null;
          social_networks?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          name?: string | null;
          industry?: "cosmetics" | "home_chemistry" | "both" | null;
          logo_url?: string | null;
          description?: string | null;
          target_audience?: string | null;
          communication_tone?: string | null;
          social_networks?: string[] | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "businesses_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_customer_id: string;
          stripe_subscription_id: string | null;
          plan_type: "starter" | "pro" | "pro_plus";
          billing_cycle: "monthly" | "yearly";
          status: "active" | "canceled" | "past_due" | "incomplete";
          monthly_credits: number;
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_customer_id: string;
          stripe_subscription_id?: string | null;
          plan_type: "starter" | "pro" | "pro_plus";
          billing_cycle: "monthly" | "yearly";
          status?: "active" | "canceled" | "past_due" | "incomplete";
          monthly_credits: number;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          stripe_customer_id?: string;
          stripe_subscription_id?: string | null;
          plan_type?: "starter" | "pro" | "pro_plus";
          billing_cycle?: "monthly" | "yearly";
          status?: "active" | "canceled" | "past_due" | "incomplete";
          monthly_credits?: number;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      credit_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          type:
            | "subscription_renewal"
            | "usage"
            | "admin_adjustment"
            | "initial_free"
            | "refund";
          description: string | null;
          generation_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          type:
            | "subscription_renewal"
            | "usage"
            | "admin_adjustment"
            | "initial_free"
            | "refund";
          description?: string | null;
          generation_id?: string | null;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          amount?: number;
          type?:
            | "subscription_renewal"
            | "usage"
            | "admin_adjustment"
            | "initial_free"
            | "refund";
          description?: string | null;
          generation_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "credit_transactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "credit_transactions_generation_id_fkey";
            columns: ["generation_id"];
            isOneToOne: false;
            referencedRelation: "generations";
            referencedColumns: ["id"];
          },
        ];
      };
      generations: {
        Row: {
          id: string;
          user_id: string;
          business_id: string | null;
          type: "text" | "image_from_prompt" | "image_from_upload";
          prompt: string;
          input_image_url: string | null;
          result_text: string | null;
          result_image_url: string | null;
          credits_used: number;
          tokens_used: number | null;
          status: "pending" | "completed" | "failed";
          error_message: string | null;
          ai_model: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          business_id?: string | null;
          type: "text" | "image_from_prompt" | "image_from_upload";
          prompt: string;
          input_image_url?: string | null;
          result_text?: string | null;
          result_image_url?: string | null;
          credits_used: number;
          tokens_used?: number | null;
          status?: "pending" | "completed" | "failed";
          error_message?: string | null;
          ai_model: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          business_id?: string | null;
          type?: "text" | "image_from_prompt" | "image_from_upload";
          prompt?: string;
          input_image_url?: string | null;
          result_text?: string | null;
          result_image_url?: string | null;
          credits_used?: number;
          tokens_used?: number | null;
          status?: "pending" | "completed" | "failed";
          error_message?: string | null;
          ai_model?: string;
        };
        Relationships: [
          {
            foreignKeyName: "generations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "generations_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      stripe_events: {
        Row: {
          id: string;
          stripe_event_id: string;
          event_type: string;
          processed: boolean;
          data: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          stripe_event_id: string;
          event_type: string;
          processed?: boolean;
          data?: Json;
          created_at?: string;
        };
        Update: {
          stripe_event_id?: string;
          event_type?: string;
          processed?: boolean;
          data?: Json;
        };
        Relationships: [];
      };
      admin_logs: {
        Row: {
          id: string;
          admin_id: string;
          action: string;
          target_user_id: string | null;
          details: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          action: string;
          target_user_id?: string | null;
          details?: Json | null;
          created_at?: string;
        };
        Update: {
          admin_id?: string;
          action?: string;
          target_user_id?: string | null;
          details?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "admin_logs_admin_id_fkey";
            columns: ["admin_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "admin_logs_target_user_id_fkey";
            columns: ["target_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
