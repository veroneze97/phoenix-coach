# 💪 Módulo de Treino - Phoenix Coach

## Configuração do Banco de Dados

### Passo 1: Execute o Schema Principal

No **SQL Editor** do Supabase, execute:

```sql
-- Cole e execute o conteúdo de: /app/TREINO_SUPABASE_SCHEMA.sql
```

Isso criará:
- ✅ `exercise_library` - Biblioteca de exercícios
- ✅ `workout_plans` - Planos de treino
- ✅ `workouts` - Treinos diários
- ✅ `exercises` - Exercícios dentro dos treinos
- ✅ `prs` - Recordes pessoais
- ✅ RLS (Row Level Security) em todas as tabelas
- ✅ Índices para performance

### Passo 2: Popule a Biblioteca de Exercícios

Execute em seguida:

```sql
-- Cole e execute o conteúdo de: /app/TREINO_EXERCISE_DATA.sql
```

Isso irá popular a biblioteca com **55 exercícios comuns**:
- 🫀 **Peito**: Supino, Crucifixo, Flexões, etc.
- 💪 **Costas**: Terra, Remadas, Barra, etc.
- 🦵 **Pernas**: Agachamento, Leg Press, etc.
- 🏋️ **Ombros**: Desenvolvimento, Elevações, etc.
- 💪 **Braços**: Roscas, Tríceps, etc.
- 🎯 **Core**: Pranchas, Abdominais, etc.
- ❤️ **Cardio**: Corrida, Bike, etc.

---

## 🎯 Funcionalidades Implementadas

### Editor Diário de Treino

#### ✅ Gerenciamento de Exercícios
- **Adicionar exercícios** da biblioteca (55+ pré-cadastrados)
- **Busca e filtros** por categoria e nome
- **Reordenar exercícios** (drag-and-drop ready)
- **Remover exercícios** facilmente
- **Exercícios personalizados** (usuário pode criar os seus)

#### ✅ Controle Completo de Séries
Para cada exercício você pode definir:
- **Séries**: Número de séries (ex: 3, 4, 5)
- **Repetições**: Número de reps (ex: 8-12)
- **Carga**: Peso em kg (ex: 100kg)
- **Descanso**: Tempo entre séries (15s - 5min)
- **RPE**: Rate of Perceived Exertion (escala 1-10)
- **Notas**: Observações sobre o exercício

#### ✅ Sistema de PRs (Personal Records)
- **Detecção automática** de novos recordes pessoais
- **Notificação** quando você bate um novo PR 🔥
- **Histórico** de PRs por exercício
- **Comparação** com PR anterior em tempo real

#### ✅ Templates de Treino
Três templates prontos para usar:

**1. ABC (3x semana)**
- A: Peito + Ombro + Tríceps
- B: Costas + Bíceps
- C: Pernas + Core

**2. Upper/Lower (4x semana)**
- Upper: Membros superiores
- Lower: Membros inferiores
- 2x cada por semana

**3. Push/Pull/Legs (6x semana)**
- Push: Empurrar (peito, ombro, tríceps)
- Pull: Puxar (costas, bíceps)
- Legs: Pernas completo
- 2x cada por semana

#### ✅ Persistência de Dados
- **Auto-save**: Dados salvos automaticamente no Supabase
- **Sincronização**: Acesso de qualquer dispositivo
- **Histórico**: Todos os treinos salvos por data

---

## 📱 Como Usar

### 1. Primeiro Uso

1. Entre no app Phoenix Coach
2. Vá para a aba **Treino** 💪
3. Escolha um **template** rápido ou começe do zero

### 2. Adicionar Exercícios

1. Clique em **"Adicionar Exercício"**
2. Use a **busca** ou filtre por **categoria**
3. Clique no exercício desejado para adicionar

### 3. Configurar Séries

1. Clique na **seta para baixo** ⬇️ no card do exercício
2. Ajuste:
   - **Séries**: 3, 4, 5...
   - **Reps**: 8, 10, 12...
   - **Carga**: Use os botões + / - ou digite
   - **Descanso**: Slider de 15s a 5min
   - **RPE**: Escala de esforço 1-10
   - **Notas**: Adicione observações

### 4. Tracking de PRs

- Quando você bater um **novo recorde**, verá:
  - 🏆 Ícone de troféu no exercício
  - 🔥 Notificação de novo PR
  - 💪 Comparação com PR anterior

### 5. Salvar Treino

1. Clique em **"Salvar"** no topo
2. Seu treino é gravado no Supabase
3. RPE médio é calculado automaticamente

---

## 🎨 Visual Design

### Estilo Apple Fitness + Phoenix

✨ **Glassmorphism**
- Cards com fundo semi-transparente
- Blur backdrop
- Bordas douradas/âmbar

🔥 **Cores Phoenix**
- Primária: `#FFB300` (Amber)
- Secundária: `#D97706` (Gold)
- Destaque: `#B45309` (Dark Gold)

⚡ **Animações Suaves**
- Framer Motion para transições
- Micro-interações nos cards
- Feedback visual em PRs

📐 **Border Radius**
- Consistente: 20px (lg)
- Cards arredondados
- Inputs com cantos suaves

---

## 🚀 Próximas Funcionalidades (Fases 2-4)

### Fase 2: Visão Semanal
- ✅ Cards de 7 dias (Seg-Dom)
- ✅ Mini-indicadores de treino completo
- ✅ Navegação rápida entre dias
- ✅ Resumo semanal de volume

### Fase 3: Calendário Mensal
- ✅ Visão de mês completo
- ✅ Drag-and-drop de sessões
- ✅ Planejamento avançado
- ✅ Templates por dia da semana

### Fase 4: Analytics & Gráficos
- ✅ Volume semanal (Recharts)
- ✅ Histórico de PRs por exercício
- ✅ Consistência (% treinos realizados)
- ✅ Progressão de carga ao longo do tempo
- ✅ Comparação entre períodos

---

## 🔧 Troubleshooting

### "Não consigo adicionar exercícios"
- **Solução**: Verifique se você executou o `TREINO_EXERCISE_DATA.sql`
- Vá no Supabase → **Database** → **exercise_library**
- Deve haver ~55 registros

### "Erro ao salvar treino"
- **Solução**: Verifique RLS policies
- Vá no Supabase → **Authentication** → **Policies**
- Todas as tabelas devem ter policies ativas

### "PRs não estão sendo detectados"
- **Solução**: Verifique se `prs` table existe
- Execute o schema novamente se necessário
- PRs são salvos quando load > PR anterior

### "Templates não aparecem"
- **Solução**: Templates são client-side
- Verifique se `/app/lib/workout-helpers.js` está presente
- Recarregue a página

---

## 📊 Estrutura de Dados

### Workout
```javascript
{
  id: 'uuid',
  user_id: 'uuid',
  date: '2025-01-15',
  title: 'Treino A',
  duration_min: 60,
  rpe_avg: 8.5,
  completed: true,
  notes: 'Ótimo treino!'
}
```

### Exercise
```javascript
{
  id: 'uuid',
  workout_id: 'uuid',
  name: 'Supino Reto',
  order_index: 0,
  sets: 4,
  reps: 10,
  load_kg: 100,
  rest_s: 90,
  rpe: 8.5,
  notes: 'Última série foi difícil'
}
```

### PR
```javascript
{
  id: 'uuid',
  user_id: 'uuid',
  exercise_name: 'Supino Reto',
  best_load: 105,
  best_reps: 10,
  best_volume: 4200,  // 105kg * 10 * 4 sets
  date: '2025-01-15'
}
```

---

## 💡 Dicas de Uso

### Para Iniciantes
1. Use o template **ABC**
2. Comece com cargas leves
3. Foque na técnica (RPE 6-7)
4. Aumente 2.5kg por semana

### Para Intermediários
1. Use **Upper/Lower** ou **PPL**
2. Varie reps (8-12)
3. RPE 7-9 na maioria das séries
4. Track seus PRs

### Para Avançados
1. Crie seus próprios templates
2. Use RPE para auto-regular
3. Periodize seu treino
4. Analise gráficos de progressão

---

## 🎯 Metas de Performance

### Lighthouse (Mobile)
- ✅ Performance: > 90
- ✅ Acessibilidade: > 95
- ✅ Best Practices: > 90
- ✅ SEO: > 90

### UX
- ⚡ Load time: < 2s
- 📱 Touch targets: > 48px
- 🎨 Contraste: WCAG AA
- ⌨️ Keyboard navigation: Full support

---

**Pronto para começar! 🔥💪**

Qualquer dúvida, verifique os exemplos nos templates ou crie um exercício teste para explorar todas as funcionalidades.
