
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "notification_logs": {
                  Row: {
                    "body": string,"channel": string,"error_message": string | null,"id": string,"is_read": boolean,"sent_at": string,"status": string,"subscription_id": string | null,"title": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"channel"?: string,"error_message"?: string | null,"id"?: string,"is_read"?: boolean,"sent_at"?: string,"status"?: string,"subscription_id"?: string | null,"title": string,"user_id": string
                  }
                  Update: {
                    "body"?: string,"channel"?: string,"error_message"?: string | null,"id"?: string,"is_read"?: boolean,"sent_at"?: string,"status"?: string,"subscription_id"?: string | null,"title"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notification_logs_subscription_id_fkey"
      columns: ["subscription_id"]
isOneToOne: false
      referencedRelation: "subscriptions"
      referencedColumns: ["id"]
    }
                  ]
                },"notification_preferences": {
                  Row: {
                    "created_at": string,"dispatch_time": string,"is_enabled": boolean,"remind_days": (number)[],"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"dispatch_time"?: string,"is_enabled"?: boolean,"remind_days"?: (number)[],"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"dispatch_time"?: string,"is_enabled"?: boolean,"remind_days"?: (number)[],"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"display_name": string | null,"email": string | null,"id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"display_name"?: string | null,"email"?: string | null,"id": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"display_name"?: string | null,"email"?: string | null,"id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"push_subscriptions": {
                  Row: {
                    "auth": string,"created_at": string,"endpoint": string,"id": string,"p256dh": string,"updated_at": string,"user_agent": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "auth": string,"created_at"?: string,"endpoint": string,"id"?: string,"p256dh": string,"updated_at"?: string,"user_agent"?: string | null,"user_id": string
                  }
                  Update: {
                    "auth"?: string,"created_at"?: string,"endpoint"?: string,"id"?: string,"p256dh"?: string,"updated_at"?: string,"user_agent"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"subscription_notification_schedules": {
                  Row: {
                    "created_at": string,"days_before": number,"id": string,"idempotency_key": string,"retry_count": number,"scheduled_at": string,"status": Database["public"]['Enums']["notification_schedule_status"],"subscription_id": string,"target_date": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"days_before": number,"id"?: string,"idempotency_key": string,"retry_count"?: number,"scheduled_at": string,"status"?: Database["public"]['Enums']["notification_schedule_status"],"subscription_id": string,"target_date": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"days_before"?: number,"id"?: string,"idempotency_key"?: string,"retry_count"?: number,"scheduled_at"?: string,"status"?: Database["public"]['Enums']["notification_schedule_status"],"subscription_id"?: string,"target_date"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "subscription_notification_schedules_subscription_id_fkey"
      columns: ["subscription_id"]
isOneToOne: false
      referencedRelation: "subscriptions"
      referencedColumns: ["id"]
    }
                  ]
                },"subscription_presets": {
                  Row: {
                    "cancellation_guide_text": string,"cancellation_official_url": string,"category": string,"created_at": string,"default_amount": number,"default_billing_cycle": Database["public"]['Enums']["billing_cycle_type"],"default_currency": Database["public"]['Enums']["currency_code"],"id": string,"logo_url": string | null,"service_name": string,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "cancellation_guide_text": string,"cancellation_official_url": string,"category": string,"created_at"?: string,"default_amount"?: number,"default_billing_cycle"?: Database["public"]['Enums']["billing_cycle_type"],"default_currency"?: Database["public"]['Enums']["currency_code"],"id"?: string,"logo_url"?: string | null,"service_name": string,"sort_order"?: number
                  }
                  Update: {
                    "cancellation_guide_text"?: string,"cancellation_official_url"?: string,"category"?: string,"created_at"?: string,"default_amount"?: number,"default_billing_cycle"?: Database["public"]['Enums']["billing_cycle_type"],"default_currency"?: Database["public"]['Enums']["currency_code"],"id"?: string,"logo_url"?: string | null,"service_name"?: string,"sort_order"?: number
                  }
                  Relationships: [
                    
                  ]
                },"subscriptions": {
                  Row: {
                    "amount": number,"billing_cycle": Database["public"]['Enums']["billing_cycle_type"],"billing_day": number,"category": string,"created_at": string,"currency": Database["public"]['Enums']["currency_code"],"custom_alert_days": (number)[] | null,"custom_alert_time": string | null,"id": string,"memo": string | null,"next_billing_date": string,"payment_method_memo": string | null,"preset_id": string | null,"service_name": string,"status": Database["public"]['Enums']["subscription_status"],"updated_at": string,"use_custom_alert": boolean,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"billing_cycle"?: Database["public"]['Enums']["billing_cycle_type"],"billing_day": number,"category": string,"created_at"?: string,"currency"?: Database["public"]['Enums']["currency_code"],"custom_alert_days"?: (number)[] | null,"custom_alert_time"?: string | null,"id"?: string,"memo"?: string | null,"next_billing_date": string,"payment_method_memo"?: string | null,"preset_id"?: string | null,"service_name": string,"status"?: Database["public"]['Enums']["subscription_status"],"updated_at"?: string,"use_custom_alert"?: boolean,"user_id": string
                  }
                  Update: {
                    "amount"?: number,"billing_cycle"?: Database["public"]['Enums']["billing_cycle_type"],"billing_day"?: number,"category"?: string,"created_at"?: string,"currency"?: Database["public"]['Enums']["currency_code"],"custom_alert_days"?: (number)[] | null,"custom_alert_time"?: string | null,"id"?: string,"memo"?: string | null,"next_billing_date"?: string,"payment_method_memo"?: string | null,"preset_id"?: string | null,"service_name"?: string,"status"?: Database["public"]['Enums']["subscription_status"],"updated_at"?: string,"use_custom_alert"?: boolean,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "subscriptions_preset_id_fkey"
      columns: ["preset_id"]
isOneToOne: false
      referencedRelation: "subscription_presets"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            [_ in never]: never
          }
          Enums: {
            "billing_cycle_type": "MONTHLY"|"YEARLY","currency_code": "KRW"|"USD","notification_schedule_status": "PENDING"|"SENT"|"FAILED"|"CANCELLED","subscription_status": "ACTIVE"|"PAUSED"|"TERMINATED"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "billing_cycle_type": ["MONTHLY", "YEARLY"],"currency_code": ["KRW", "USD"],"notification_schedule_status": ["PENDING", "SENT", "FAILED", "CANCELLED"],"subscription_status": ["ACTIVE", "PAUSED", "TERMINATED"]
          }
        }
} as const
