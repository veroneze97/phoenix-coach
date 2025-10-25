# 🌙 Módulo de Sono - UI Completo

## ✅ Funcionalidades Implementadas

### 🧮 Sleep Calculator (Calculadora de Sono)

**Baseado em Ciclos de Sono:**
- Cada ciclo = 90 minutos
- Acordar entre ciclos = sensação de descanso
- 3 recomendações automáticas

**Inputs:**
1. **Horário de Acordar** (type="time")
   - Icon: ☀️ Sun (laranja)
   - Default: 07:00
   - Font: Mono (melhor legibilidade)

2. **Tempo para Adormecer** (slider)
   - Icon: ⏰ Clock (azul)
   - Range: 5-45 minutos
   - Default: 15 minutos
   - Step: 5 minutos
   - Label dinâmico mostrando valor

**Recomendações (3 Cards):**

**1. Ideal (6 ciclos - 9h)**
- Emoji: 🌟
- Background: Phoenix Amber
- Border: Amber/30
- Shadow: Amber glow
- Hover: Scale 1.05

**2. Bom (5 ciclos - 7h30)**
- Emoji: 💪
- Background: Verde
- Border: Verde/30
- Descrição: "Bom para adultos"

**3. Mínimo (4 ciclos - 6h)**
- Emoji: ⚡
- Background: Azul
- Border: Azul/30
- Descrição: "Mínimo recomendado"

**Cada Card Mostra:**
- Label (Ideal/Bom/Mínimo)
- Descrição (duração)
- Horário em fonte mono grande (3xl)
- Número de ciclos

**Cálculo:**
```javascript
totalMinutes = (cycles × 90) + fallAsleepTime
bedtime = wakeUpTime - totalMinutes
```

**Info Box:**
- Icon: ℹ️ AlertCircle (azul)
- Explica como funciona ciclos de sono
- Background: Blue/10
- Border: Blue/20

---

### 📝 Manual Log Form

**Time Inputs (2 campos):**

1. **Hora que Dormiu**
   - Icon: 🌙 Moon (roxo)
   - type="time"
   - Font: Mono
   - Size: text-lg

2. **Hora que Acordou**
   - Icon: ☀️ Sun (laranja)
   - type="time"
   - Font: Mono
   - Size: text-lg

**Sleep Duration Display:**
- Calcula automaticamente quando ambos preenchidos
- Mostra: "Xh Ymin"
- Font: 3xl bold
- Color: Purple-500
- Background: Secondary/50
- Lida com sono overnight (atravessa meia-noite)

**Exemplo:**
```
Dormiu: 23:30
Acordou: 07:00
Resultado: 7h 30min
```

**Quality Slider (1-5):**

**Visual Stars:**
- 5 estrelas interativas
- Fill: Apenas até rating atual
- Cores por qualidade:
  1. ⭐ Vermelho - Péssimo
  2. ⭐⭐ Laranja - Ruim
  3. ⭐⭐⭐ Amarelo - Regular
  4. ⭐⭐⭐⭐ Verde - Bom
  5. ⭐⭐⭐⭐⭐ Dourado - Excelente

**Display Central:**
- Mostra estrelas preenchidas
- Label de qualidade
- Color-coded por valor

**Slider:**
- Range: 1-5
- Step: 1
- Labels abaixo (grid 5 colunas)

**Save Button:**
- Gradient: Purple 500 → 700
- Icon: 🌙 Moon
- Disabled quando faltam dados
- Border radius: lg (20px)
- Full width

---

### 📊 Weekly Chart (Placeholder)

**LineChart (Recharts):**
- Dados mock de 7 dias
- Eixo X: Dias da semana
- Eixo Y: Horas (0-10)
- Linha: Purple 500
- Stroke width: 3px
- Dots: Preenchidos, radius 5

**Custom Tooltip:**
- Glass card effect
- Border: Purple/20
- Mostra:
  - Dia
  - Horas de sono
  - Estrelas de qualidade

**Weekly Summary (3 Cards):**

1. **Média por Noite**
   - Value: "7.4h"
   - Color: Purple-500
   - Font: 2xl bold

2. **Qualidade Média**
   - Stars: 4/5 preenchidas
   - Color: Phoenix Amber
   - Visual com estrelas

3. **Consistência**
   - Value: "85%"
   - Color: Green-500
   - Indica regularidade

**Placeholder Note:**
- Icon: 📅 Calendar
- Border: Dashed
- Background: Muted/50
- Text: "Dados de exemplo"
- Call-to-action: Conectar Supabase

---

### 💡 Sleep Tips Section

**4 Cards de Dicas:**

1. **Ambiente Escuro**
   - Icon: 🌙 Moon (roxo)
   - Tip: Cortinas blackout

2. **Rotina Consistente**
   - Icon: ⏰ Clock (azul)
   - Tip: Mesmo horário

3. **Evite Cafeína**
   - Icon: ⚡ Zap (amarelo)
   - Tip: 6h antes de dormir

4. **Luz Natural**
   - Icon: ☀️ Sun (laranja)
   - Tip: Exposição matinal

**Estilo:**
- Grid: 2 colunas (1 em mobile)
- Background: Secondary/30
- Rounded: lg
- Padding: 12px
- Icon + texto lado a lado

---

## 🎨 Design System

### Cores Principais

**Roxo (Sleep primary):**
```css
text-purple-500
bg-purple-500/10
border-purple-500/20
```

**Secundárias:**
- Laranja: Sun/Wake up (orange-500)
- Azul: Info/Clock (blue-500)
- Amarelo: Energy (yellow-500)
- Verde: Quality (green-500)

### Typography (SF Pro)

**Font Sizes:**
- Time inputs: text-lg (18px)
- Bedtime display: text-3xl (30px)
- Section titles: text-base (16px)
- Descriptions: text-xs (12px)

**Font Families:**
- Body: SF Pro Text / Inter
- Times: Mono (melhor para horários)

### Glassmorphism

**Glass Cards:**
```css
.glass-card {
  backdrop-blur: md;
  background: rgba(255,255,255,0.8);
  border: rgba(139,92,246,0.2);
}
```

**Borders:**
- Radius: lg (20px)
- Width: 2px
- Opacity: 20-30%

### Spacing

- Card padding: 1.5rem (24px)
- Section gap: 1.5rem
- Input gap: 1rem
- Grid gap: 0.75rem (12px)

---

## 🧮 Lógica de Cálculo

### Sleep Calculator

**Input:**
```javascript
wakeUpTime = "07:00"
fallAsleepTime = 15  // minutes
```

**Para 6 ciclos (Ideal):**
```javascript
cycles = 6
totalMinutes = (6 × 90) + 15 = 555 minutes = 9h 15min
bedtime = 07:00 - 9h 15min = 21:45
```

**Para 5 ciclos (Bom):**
```javascript
cycles = 5
totalMinutes = (5 × 90) + 15 = 465 minutes = 7h 45min
bedtime = 07:00 - 7h 45min = 23:15
```

**Para 4 ciclos (Mínimo):**
```javascript
cycles = 4
totalMinutes = (4 × 90) + 15 = 375 minutes = 6h 15min
bedtime = 07:00 - 6h 15min = 00:45
```

### Duration Calculator

**Input:**
```javascript
bedTime = "23:30"
wakeTime = "07:00"
```

**Cálculo:**
```javascript
bedMinutes = (23 × 60) + 30 = 1410
wakeMinutes = (7 × 60) + 0 = 420

// Handle overnight
if (wakeMinutes <= bedMinutes) {
  wakeMinutes += 24 × 60  // Add full day
}

wakeMinutes = 420 + 1440 = 1860
diff = 1860 - 1410 = 450 minutes

hours = 450 ÷ 60 = 7h
minutes = 450 % 60 = 30min

Result: "7h 30min"
```

---

## 📊 Mock Data Structure

### Weekly Chart Data
```javascript
[
  { day: 'Seg', hours: 7.5, quality: 4 },
  { day: 'Ter', hours: 6.5, quality: 3 },
  { day: 'Qua', hours: 8.0, quality: 5 },
  { day: 'Qui', hours: 7.0, quality: 4 },
  { day: 'Sex', hours: 6.0, quality: 3 },
  { day: 'Sáb', hours: 9.0, quality: 5 },
  { day: 'Dom', hours: 8.5, quality: 4 }
]
```

---

## 🧪 Como Testar

### 1. Sleep Calculator
1. Vá para tab **Sono** 🌙
2. Ajuste horário de acordar (ex: 07:00)
3. Mova slider de latência (5-45 min)
4. Veja 3 cards com recomendações
5. Cada card mostra:
   - Emoji visual
   - Label claro
   - Horário calculado
   - Descrição de ciclos

### 2. Manual Log
1. Scroll para "Registrar Sono"
2. Preencha hora dormiu (ex: 23:00)
3. Preencha hora acordou (ex: 07:00)
4. Veja duração calculada (8h 0min)
5. Ajuste slider de qualidade (1-5)
6. Observe estrelas mudarem
7. Click "Salvar Registro" (desabilitado se faltam dados)

### 3. Weekly Chart
1. Scroll para "Última Semana"
2. Veja gráfico de linha roxo
3. Hover sobre pontos
4. Tooltip mostra:
   - Dia
   - Horas
   - Estrelas de qualidade
5. Veja resumo semanal (3 cards)

### 4. Sleep Tips
1. Scroll para "Dicas"
2. Veja 4 cards com ícones
3. Leia dicas práticas

---

## 📁 Arquivos

**Criados:**
- `/app/components/SleepTracker.js` (450+ linhas)

**Modificados:**
- `/app/app/page.js` (import + integração)

**Documentação:**
- `/app/SLEEP_MODULE_UI.md` (este arquivo)

---

## 🎯 Features Destacadas

### 1. Sleep Calculator Inteligente
- **Ciclos cientificamente baseados** (90 min)
- **3 opções** para flexibilidade
- **Latência personalizável** (realista)
- **Visual claro** com destaque para ideal

### 2. Quality Rating Interativo
- **Stars visuais** (não apenas número)
- **Color-coded** por qualidade
- **Labels descritivos**
- **Slider suave**

### 3. Duration Auto-Calculator
- **Cálculo instantâneo**
- **Lida com overnight**
- **Display grande** (fácil leitura)
- **Formato claro** (Xh Ymin)

### 4. Weekly Visualization
- **Line chart suave**
- **Tooltip rico**
- **Summary cards**
- **Mock data realista**

### 5. Actionable Tips
- **4 dicas práticas**
- **Icons contextuais**
- **Formato escaneável**
- **Baseadas em ciência**

---

## 🚀 Próximos Passos (Backend)

### Fase 1: Supabase Integration
- Tabela `sleep_logs`
- CRUD de registros
- Sincronização automática

### Fase 2: Historical Data
- Carregar semana real
- Calcular métricas reais
- Gráfico com dados do usuário

### Fase 3: Smart Insights
- Detectar padrões
- Alertas de inconsistência
- Recomendações personalizadas

### Fase 4: Advanced Features
- Sleep debt tracking
- Comparação com metas
- Correlação com treino/dieta
- Notificações inteligentes

---

## ✅ Checklist de Validação

- [x] Sleep Calculator renderizando
- [x] 3 recomendações calculadas
- [x] Latência slider funcionando
- [x] Time inputs (hora dormir/acordar)
- [x] Duration auto-calculado
- [x] Lida com overnight
- [x] Quality slider (1-5)
- [x] Visual stars
- [x] Color-coded labels
- [x] Weekly chart placeholder
- [x] LineChart Recharts
- [x] Custom tooltip
- [x] Summary cards (3)
- [x] Sleep tips (4 cards)
- [x] Glassmorphism theme
- [x] Purple color scheme
- [x] SF Pro/Mono fonts
- [x] Border radius 20px
- [x] Responsive layout
- [x] Disabled state em button

---

## 📊 Exemplo de Uso

### Cenário 1: Usuário Matutino

**Input:**
- Wake up: 06:00
- Latência: 10 min

**Output:**
- Ideal (6 ciclos): 20:50
- Bom (5 ciclos): 22:20
- Mínimo (4 ciclos): 23:50

### Cenário 2: Usuário Noturno

**Input:**
- Wake up: 09:00
- Latência: 20 min

**Output:**
- Ideal (6 ciclos): 23:50
- Bom (5 ciclos): 01:20
- Mínimo (4 ciclos): 02:50

### Cenário 3: Log Manual

**Input:**
- Dormiu: 00:15
- Acordou: 08:30
- Quality: 5 ⭐⭐⭐⭐⭐

**Display:**
- Duração: 8h 15min
- Stars: Todas douradas
- Label: "Excelente"

---

**🌙 Módulo de Sono UI completo e polido!**

**Teste agora:**
1. Vá para tab **Sono** 🌙
2. Experimente o Sleep Calculator
3. Preencha o form manual
4. Veja o chart semanal
5. Leia as dicas

**Interface completa, aguardando backend integration! ✨**
