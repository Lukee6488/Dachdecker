export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      leads: {
        Row: {
          id: string
          name: string
          kontakt: string | null
          kategorie: string | null
          nachricht: string | null
          quelle: string | null
          datum: string
          status: string
        }
        Insert: {
          id?: string
          name: string
          kontakt?: string | null
          kategorie?: string | null
          nachricht?: string | null
          quelle?: string | null
          datum?: string
          status?: string
        }
        Update: {
          id?: string
          name?: string
          kontakt?: string | null
          kategorie?: string | null
          nachricht?: string | null
          quelle?: string | null
          datum?: string
          status?: string
        }
      }
      profiles: {
        Row: {
          id: string
          display_name: string
          role: string
          created_at: string
        }
        Insert: {
          id: string
          display_name: string
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          role?: string
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
