// components/diet/tokens.ts

/**
 * Design Tokens centralizados para os módulos de dieta.
 * — Consistência de radius, sombras, cores e superfícies
 * — Acessibilidade: focus ring visível e coerente
 * — Utilitários: transições e estados comuns para Cards/Buttons
 */

export const TOKENS = {
  radius: {
    lg: 'rounded-2xl',
    xl: 'rounded-3xl',
    full: 'rounded-full',
  },
  shadow: {
    soft: 'shadow-lg',
    deep: 'shadow-2xl',
  },
  blur: 'backdrop-blur-xl',

  // Bordas/superfícies coerentes com modo claro/escuro
  border: 'border border-white/15 dark:border-zinc-700/40',
  surface: 'bg-white/70 dark:bg-zinc-900/60',

  // Tipografia/cores
  textMuted: 'text-muted-foreground',

  // Ação principal (gradiente Phoenix)
  gradientAction: 'bg-gradient-to-r from-amber-500 to-orange-600',

  // Estados/efeitos globais
  transition: 'transition-all duration-200',
  hoverLift: 'hover:-translate-y-0.5',
  focusRing:
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2',

  // Variações (opcionais) para badges/botões informativos
  badge: {
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    warn: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    danger: 'bg-red-500/10 text-red-600 dark:text-red-400',
  },

  // Superfícies auxiliares
  surfaces: {
    subtle: 'bg-zinc-50/60 dark:bg-zinc-900/50',
    accent: 'bg-accent/40',
  },
} as const

/** Classe base de Card usada em toda a UI da dieta */
export const cardBase =
  `${TOKENS.surface} ${TOKENS.blur} ${TOKENS.border} ${TOKENS.shadow.deep} ${TOKENS.radius.xl} ${TOKENS.transition}`
