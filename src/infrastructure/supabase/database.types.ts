// Gerado a partir do schema real (mcp__Supabase__generate_typescript_types)
// após aplicar supabase/migrations/20260823200000_schema_multitenant_rls.sql.
// Não editar à mão — regenerar sempre que o schema mudar.
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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      categorias: {
        Row: {
          ativo: boolean
          id: string
          nome: string
          ordem: number
          tenant_id: string
        }
        Insert: {
          ativo?: boolean
          id?: string
          nome: string
          ordem?: number
          tenant_id: string
        }
        Update: {
          ativo?: boolean
          id?: string
          nome?: string
          ordem?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorias_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      fidelidade_clientes: {
        Row: {
          nome: string | null
          pontos: number
          telefone: string
          tenant_id: string
          ultimo_pedido: string | null
        }
        Insert: {
          nome?: string | null
          pontos?: number
          telefone: string
          tenant_id: string
          ultimo_pedido?: string | null
        }
        Update: {
          nome?: string | null
          pontos?: number
          telefone?: string
          tenant_id?: string
          ultimo_pedido?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fidelidade_clientes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          cliente_nome: string
          cliente_telefone: string
          criado_em: string
          endereco: string | null
          forma_pagamento: string
          id: string
          itens: Json
          numero: number
          observacao: string | null
          status: string
          subtotal: number
          taxa_entrega: number
          tenant_id: string
          tipo: string
          total: number
        }
        Insert: {
          cliente_nome: string
          cliente_telefone: string
          criado_em?: string
          endereco?: string | null
          forma_pagamento: string
          id?: string
          itens: Json
          numero: number
          observacao?: string | null
          status?: string
          subtotal: number
          taxa_entrega?: number
          tenant_id: string
          tipo: string
          total: number
        }
        Update: {
          cliente_nome?: string
          cliente_telefone?: string
          criado_em?: string
          endereco?: string | null
          forma_pagamento?: string
          id?: string
          itens?: Json
          numero?: number
          observacao?: string | null
          status?: string
          subtotal?: number
          taxa_entrega?: number
          tenant_id?: string
          tipo?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          ativo: boolean
          categoria_id: string
          descricao: string | null
          id: string
          imagem_url: string | null
          nome: string
          ordem: number
          preco: number
          tenant_id: string
        }
        Insert: {
          ativo?: boolean
          categoria_id: string
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          nome: string
          ordem?: number
          preco: number
          tenant_id: string
        }
        Update: {
          ativo?: boolean
          categoria_id?: string
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          nome?: string
          ordem?: number
          preco?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_categoria_tenant_fk"
            columns: ["categoria_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "produtos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_usuarios: {
        Row: {
          criado_em: string
          role: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          criado_em?: string
          role?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          criado_em?: string
          role?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_usuarios_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          ativo: boolean
          cidade: string
          cor_fundo: string | null
          cor_primaria: string | null
          criado_em: string
          custom_domain: string | null
          endereco: string | null
          horarios: Json
          id: string
          logo_url: string | null
          nome: string
          pedido_minimo: number
          plano: string
          slug: string
          taxa_entrega: number
          whatsapp: string | null
        }
        Insert: {
          ativo?: boolean
          cidade?: string
          cor_fundo?: string | null
          cor_primaria?: string | null
          criado_em?: string
          custom_domain?: string | null
          endereco?: string | null
          horarios?: Json
          id?: string
          logo_url?: string | null
          nome: string
          pedido_minimo?: number
          plano?: string
          slug: string
          taxa_entrega?: number
          whatsapp?: string | null
        }
        Update: {
          ativo?: boolean
          cidade?: string
          cor_fundo?: string | null
          cor_primaria?: string | null
          criado_em?: string
          custom_domain?: string | null
          endereco?: string | null
          horarios?: Json
          id?: string
          logo_url?: string | null
          nome?: string
          pedido_minimo?: number
          plano?: string
          slug?: string
          taxa_entrega?: number
          whatsapp?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consultar_pontos_fidelidade: {
        Args: { p_telefone: string; p_tenant_id: string }
        Returns: number
      }
      is_tenant_member: { Args: { p_tenant_id: string }; Returns: boolean }
      is_tenant_owner: { Args: { p_tenant_id: string }; Returns: boolean }
      tenant_esta_ativo: { Args: { p_tenant_id: string }; Returns: boolean }
      tenants_publico: {
        Args: never
        Returns: {
          ativo: boolean
          cidade: string
          cor_fundo: string
          cor_primaria: string
          custom_domain: string
          endereco: string
          horarios: Json
          id: string
          logo_url: string
          nome: string
          pedido_minimo: number
          slug: string
          taxa_entrega: number
          whatsapp: string
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
