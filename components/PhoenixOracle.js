import { useMemo } from 'react';
import { Sparkles, TrendingUp, Target, AlertCircle } from 'lucide-react';

// Função auxiliar para pegar os últimos N dias de dados
const getLastNDays = (data, n) => {
  if (!data || data.length === 0) return [];
  return data.slice(-n).reverse();
};

// O Componente Oráculo
const PhoenixOracle = ({ dailyIntake, mealTotals, weeklySummary }) => {
  const insight = useMemo(() => {
    // --- Lógica para gerar insights ---
    // 1. Verificar consistência
    const last7Days = getLastNDays(weeklySummary, 7);
    const isConsistent = last7Days.length === 7 && last7Days.every(day => day.avg_adherence_pct > 0);

    if (isConsistent) {
      return {
        title: '🔥 Incrível Consistência!',
        message: 'Sua disciplina nos últimos 7 dias é o alicerce do sucesso. Continue assim!',
        color: 'text-green-600',
        icon: TrendingUp,
      };
    }

    // 2. Verificar foco em proteína
    if (dailyIntake && dailyIntake.total_protein_g > 0) {
      const proteinRatio = (dailyIntake.total_protein_g / (dailyIntake.goal_protein_g || 150)) * 100;
      if (proteinRatio >= 90) {
        return {
          title: '💪 Foco em Proteína!',
          message: 'Hoje seu foco em proteína está impecável. Essencial para a recuperação muscular.',
          color: 'text-blue-600',
          icon: Target,
        };
      }
    }

    // 3. Verificar se houve uma refeição rica em carboidratos (pós-treino)
    const highCarbMeal = mealTotals.some(meal => {
      const carbs = meal.total_carbs_g || 0;
      const totalKcal = meal.total_kcal || 0;
      return totalKcal > 0 && (carbs / totalKcal) * 100 > 60; // Ex: > 60% das calorias de carboidratos
    });

    if (highCarbMeal) {
        return {
            title: '⚡ Energia para o Treino!',
            message: 'Essa refeição rica em carboidratos te dará o combustível necessário para o seu treino.',
            color: 'text-orange-600',
            icon: Sparkles,
        };
    }

    // 4. Verificar se a meta de calorias foi batida
    const calorieProgress = dailyIntake ? (dailyIntake.total_kcal / dailyIntake.goal_kcal) * 100 : 0;
    if (calorieProgress >= 100) {
        return {
            title: '🎯 Meta Batida!',
            message: 'Parabéns! Você atingiu sua meta de calorias hoje. Celebre essa conquista!',
            color: 'text-phoenix-600',
            icon: Sparkles,
        };
    }

    // 5. Verificar se o dia foi de baixa ingestão calórica
    if (dailyIntake && calorieProgress < 25 && dailyIntake.total_kcal > 0) {
        return {
            title: '🌱 Um Novo Começo',
            message: 'Todo dia é uma nova chance. Lembre-se de que pequenas escolhas constroem grandes mudanças.',
            color: 'text-orange-600',
            icon: AlertCircle,
        };
    }

    // 6. Mensagem motivacional padrão
    return {
      title: '🌅 Continue Sua Jornada',
      message: 'Cada refeição é um passo em direção à sua melhor versão. Você está no caminho certo!',
      color: 'text-muted-foreground',
      icon: Sparkles,
    };
  }, [dailyIntake, mealTotals, weeklySummary]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-phoenix-100 to-phoenix-200 dark:from-phoenix-900/50 dark:to-phoenix-800/50 border border-phoenix-300/50 dark:border-phoenix-700/50 rounded-3xl p-6 text-center"
    >
      <div className="flex items-center justify-center gap-3 mb-4">
        <insight.icon className="w-8 h-8" style={{ color: `hsl(var(--${insight.color.replace('text-', '')})` }} />
        <div>
          <h3 className="text-lg font-bold text-foreground">{insight.title}</h3>
          <p className="text-sm text-muted-foreground max-w-xs">{insight.message}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default PhoenixOracle;