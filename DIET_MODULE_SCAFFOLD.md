# 🥗 Módulo de Dieta - Phoenix Coach (UI Scaffold)

## 📋 O Que Foi Implementado

### ✅ Layout Semanal Completo

- **Grid Responsivo**: 7 dias × 4 refeições = 28 células
- **Estrutura Organizada**:
  - ☕ Café da Manhã (Amarelo)
  - 🌞 Almoço (Laranja)
  - 🌅 Jantar (Roxo)
  - 🍪 Lanches (Rosa)

### ✅ Cards com Glassmorphism

- **Design Phoenix**: 20px border radius, vidro fosco
- **Estados Visuais**:
  - ✅ **Conforme**: Verde com check
  - ❌ **Fora do Plano**: Vermelho com X
- **Interatividade**:
  - Click para alternar estado
  - Animação de escala (Framer Motion)
  - Hover com gradiente dourado
  - Ícone da refeição em background

### ✅ Dashboard de Progresso

**Ring Chart (Recharts)**:

- Círculo de progresso animado
- % de aderência em tempo real
- Cores dinâmicas por performance:
  - 🔥 90%+: Dourado (Excelente)
  - 💚 75-89%: Verde (Muito bem)
  - 💛 60-74%: Amarelo (Bom)
  - 🟠 <60%: Laranja (Melhorar)

**Métricas**:

- Barra de progresso total
- Contador de refeições conformes
- Mensagem motivacional contextual
- Cards de estatísticas:
  - Refeições conformes
  - Fora do plano
  - Status emoji

### ✅ Navegação Temporal

- **Seletor de Semana**:
  - ◀️ Semana anterior
  - 📅 "Esta Semana" (atual)
  - ▶️ Próxima semana
- Indicador visual do dia atual (dourado)

### ✅ Ações Rápidas

**2 Botões de Atalho**:

1. **Marcar Tudo Conforme** ✅
   - Define todas as 28 refeições como conformes
   - Útil para semana perfeita

2. **Limpar Semana** ❌
   - Reset de todas as refeições
   - Começar do zero

### ✅ Preview de Features Futuras

- Card "Em Breve" com roadmap
- Planejamento de refeições
- Contador de calorias
- Macros personalizados
- Receitas

---

## 🎨 Design System

### Cores por Refeição

```javascript
Café da Manhã: text-yellow-500  (☕)
Almoço:        text-orange-500  (🌞)
Jantar:        text-purple-500  (🌅)
Lanches:       text-pink-500    (🍪)
```

### Estados dos Cards

```css
Conforme:
- bg-green-500/20
- border-green-500/40
- shadow-green-500/10
- Check icon (branco em círculo verde)

Fora do Plano:
- bg-red-500/10
- border-red-500/20
- X icon (branco em círculo vermelho)
```

### Progress Ring

```javascript
Aderência >= 90%: #FFB300 (Phoenix Amber)
75-89%:           #10B981 (Verde)
60-74%:           #EAB308 (Amarelo)
< 60%:            #F97316 (Laranja)
```

---

## 📱 Como Usar

### 1. Navegar para Dieta

- Entre no Phoenix Coach
- Clique na tab **Dieta** 🥗

### 2. Marcar Refeições

1. Clique em qualquer **card** no grid
2. ✅ Verde = Conforme ao plano
3. ❌ Vermelho = Fora do plano
4. Veja o % de aderência atualizar em tempo real

### 3. Visualizar Progresso

- **Ring Chart**: % visual de aderência
- **Barra de Progresso**: Linear progress
- **Estatísticas**: Cards com números
- **Mensagem**: Feedback motivacional

### 4. Navegar Semanas

- Use **◀️ ▶️** para mudar de semana
- "Esta Semana" mostra semana atual
- Dia atual destacado em **dourado**

### 5. Ações Rápidas

- **Marcar Tudo**: Semana perfeita
- **Limpar**: Reset completo

---

## 🔧 Estado Atual (Scaffold Only)

### ✅ Implementado

- Layout completo
- UI totalmente funcional
- Estado local (useState)
- Cálculo de aderência
- Animações Framer Motion
- Recharts integration
- Navegação de semanas
- Ações rápidas

### 🚫 NÃO Implementado (Por Design)

- ❌ Conexão com Supabase
- ❌ Persistência de dados
- ❌ API calls
- ❌ Database schema
- ❌ Sincronização entre dispositivos

**Motivo**: Você pediu apenas o **UI scaffold** com estado estático. Dados são gerados aleatoriamente na inicialização e persistem apenas na sessão.

---

## 🚀 Próximos Passos (Backend Integration)

### Fase 1: Database Schema

```sql
CREATE TABLE diet_meals (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  date DATE NOT NULL,
  meal_type TEXT NOT NULL, -- 'breakfast', 'lunch', 'dinner', 'snacks'
  is_conform BOOLEAN DEFAULT false,
  notes TEXT,
  calories INTEGER,
  macros JSONB, -- {protein: 30, carbs: 50, fat: 20}
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Fase 2: Meal Planning

- Biblioteca de receitas
- Planejamento semanal
- Templates de dieta (low carb, high protein, etc)
- Geração automática de planos

### Fase 3: Calorie & Macro Tracking

- Input de alimentos
- Banco de dados de alimentos (API externa?)
- Cálculo automático de macros
- Gráficos de progressão

### Fase 4: Advanced Analytics

- Histórico de aderência (Recharts)
- Correlação com peso/medidas
- Insights personalizados
- Sugestões de ajustes

---

## 📊 Estrutura de Dados (Atual - Local State)

```javascript
weekData: {
  0: { // Seg
    breakfast: true,  // Conforme
    lunch: false,     // Fora do plano
    dinner: true,
    snacks: true
  },
  1: { // Ter
    breakfast: true,
    lunch: true,
    dinner: false,
    snacks: true
  },
  // ... até 6 (Dom)
}
```

### Cálculo de Aderência

```javascript
adherencePercent = (conformMeals / totalMeals) * 100

// Exemplo:
// 21 refeições conformes / 28 total = 75%
```

---

## 🎯 UX Highlights

### Feedback Visual

- ✅ Cores semânticas (verde/vermelho)
- 🎨 Gradientes suaves nos hovers
- ⚡ Animações de escala no click
- 💫 Transições suaves Framer Motion

### Mobile-First

- Grid responsivo (scroll horizontal em mobile)
- Touch targets > 48px (cards de 80px height)
- Ícones grandes e claros
- Espaçamento generoso (gap-3)

### Acessibilidade

- Buttons com aria labels implícitos
- Cores com contraste WCAG AA
- Keyboard navigation ready
- Screen reader friendly

---

## 💡 Tips de Implementação Backend

### 1. Supabase Schema

```sql
-- Enable RLS
ALTER TABLE diet_meals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see/edit own meals
CREATE POLICY "Users manage own meals"
  ON diet_meals
  FOR ALL
  USING (auth.uid() = user_id);
```

### 2. API Integration

```javascript
// Load week data
const loadWeekData = async (weekOffset = 0) => {
  const startDate = getWeekStart(weekOffset)
  const endDate = getWeekEnd(weekOffset)

  const { data, error } = await supabase
    .from('diet_meals')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)

  return transformToGridFormat(data)
}

// Toggle meal
const toggleMeal = async (date, mealType, isConform) => {
  const { error } = await supabase.from('diet_meals').upsert(
    {
      user_id: user.id,
      date,
      meal_type: mealType,
      is_conform: isConform,
    },
    { onConflict: 'user_id,date,meal_type' },
  )
}
```

### 3. Sync with Home Tab

- Atualizar `dietAdherence` na Home com base em dados reais
- Mostrar aderência do dia atual
- Integrar no Phoenix Score

---

## 📁 Arquivos

### Criados

- `/app/components/DietPlanner.js` - Componente principal (400+ linhas)

### Modificados

- `/app/app/page.js` - Import + integração na tab Dieta

---

## ✨ Features de Destaque

### 1. Progress Ring Interativo

- Recharts PieChart com hole no meio
- Valor % centralizado
- Cores dinâmicas por performance
- Animação suave de transição

### 2. Grid Inteligente

- Scroll horizontal em mobile
- Colunas fixas para meal labels
- Highlight do dia atual
- Ícones contextuais por refeição

### 3. Mensagens Motivacionais

```javascript
>= 90%: "Excelente! Continue assim! 🔥"
>= 75%: "Muito bem! Está no caminho certo 💪"
>= 60%: "Bom trabalho! Pode melhorar 👍"
<  60%: "Vamos focar na consistência! 🎯"
```

### 4. State Management Local

- useState puro (sem Redux/Zustand)
- Cálculo reativo de métricas
- Performance otimizada
- Pronto para migrar para Supabase

---

## 🎨 Visual Examples

### Card States

```
┌─────────────┐
│  ☕ [✅]    │  Conforme (Verde)
│             │
└─────────────┘

┌─────────────┐
│  🌞 [❌]    │  Fora do Plano (Vermelho)
│             │
└─────────────┘
```

### Grid Layout

```
         Seg  Ter  Qua  Qui  Sex  Sáb  Dom
☕ Café   ✅   ✅   ❌   ✅   ✅   ❌   ✅
🌞 Almoço ✅   ✅   ✅   ✅   ❌   ✅   ✅
🌅 Jantar ❌   ✅   ✅   ✅   ✅   ✅   ❌
🍪 Lanch  ✅   ❌   ✅   ✅   ✅   ✅   ✅

Aderência: 82% 🔥
```

---

**🥗 UI Scaffold pronto! Navegue para a tab Dieta e explore o layout completo.**

Quando quiser conectar ao backend, é só seguir os passos da seção "Próximos Passos (Backend Integration)".
