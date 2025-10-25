# Solução Alternativa - Criar Tabela Users via Interface Visual

## Problema
O SQL não está criando a tabela `users` ou o cache não atualizou.

## Solução Alternativa - Usar Table Editor

### Passo 1: Verifique se a tabela existe

1. Supabase Dashboard → **Table Editor**
2. Procure por tabela chamada **users**
3. Se NÃO existir, siga os passos abaixo

---

### Passo 2: Criar Tabela Manualmente

1. **Supabase Dashboard** → **Table Editor**
2. Clique em **New table** (botão verde)
3. Configure:

**Nome da tabela:** `users`

**Colunas (adicione uma por uma):**

| Nome | Tipo | Default | Opcional |
|------|------|---------|----------|
| `id` | uuid | `NULL` | ❌ (Primary Key) |
| `name` | text | `NULL` | ✅ |
| `email` | text | `NULL` | ✅ |
| `height_cm` | int4 | `NULL` | ✅ |
| `weight_kg` | numeric | `NULL` | ✅ |
| `goals_json` | jsonb | `'{}'` | ✅ |
| `created_at` | timestamptz | `now()` | ✅ |
| `updated_at` | timestamptz | `now()` | ✅ |

4. Em **Primary Key**, selecione: `id`
5. Clique em **Save**

---

### Passo 3: Configurar Foreign Key

1. Na tabela `users` criada, clique em **Edit table**
2. Clique na coluna `id`
3. Em **Foreign Key Relations**, configure:
   - **Related table:** `auth.users`
   - **Related column:** `id`
   - **On delete:** `CASCADE`
4. Salve

---

### Passo 4: Habilitar RLS

1. Na tabela `users`, clique no ícone de **cadeado** (Enable RLS)
2. Clique em **Add policy**
3. Crie 3 políticas:

**Política 1 - SELECT:**
- Nome: `Users can view own profile`
- Policy command: `SELECT`
- USING expression: `auth.uid() = id`

**Política 2 - UPDATE:**
- Nome: `Users can update own profile`
- Policy command: `UPDATE`
- USING expression: `auth.uid() = id`

**Política 3 - INSERT:**
- Nome: `Users can insert own profile`
- Policy command: `INSERT`
- WITH CHECK expression: `auth.uid() = id`

---

### Passo 5: Teste Novamente

1. Volte para o app
2. **Recarregue a página** (Ctrl+R ou F5)
3. Preencha o perfil
4. Clique "Começar a jornada"
5. Deve funcionar! ✅

---

## Verificação Rápida

**Se ainda não funcionar, verifique:**

1. Dashboard Supabase → **Table Editor**
2. Confirme que a tabela `users` existe
3. Confirme que tem todas as 8 colunas
4. Confirme que RLS está ENABLED (ícone de cadeado fechado)

**Se a tabela existir mas ainda der erro:**
- Aguarde 30-60 segundos (cache do Supabase)
- Recarregue a página do app
- Tente novamente

---

## Última Alternativa - SQL Direto

Se nada funcionar, tente este SQL simplificado:

```sql
DROP TABLE IF EXISTS public.users CASCADE;

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  height_cm INTEGER,
  weight_kg NUMERIC,
  goals_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enable_all_for_users" ON public.users
  FOR ALL USING (auth.uid() = id);
```

Isso cria uma política mais simples que permite todas as operações.
