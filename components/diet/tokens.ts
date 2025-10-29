// components/diet/tokens.ts

/**
 * Design Tokens centralizados para os módulos de dieta.
 * Mantém consistência de radius, sombras, cores e superfícies.
 */

export const TOKENS = {
  radius: { lg: 'rounded-2xl', xl: 'rounded-3xl' },
  shadow: { soft: 'shadow-lg', deep: 'shadow-2xl' },
  blur: 'backdrop-blur-xl',
  border: 'border border-white/15 dark:border-zinc-700/40',
  surface: 'bg-white/70 dark:bg-zinc-900/60',
  textMuted: 'text-muted-foreground',
  gradientAction: 'bg-gradient-to-r from-amber-500 to-orange-600',
} as const

/** Classe base de Card usada em toda a UI da dieta */
export const cardBase =
  `${TOKENS.surface} ${TOKENS.blur} ${TOKENS.border} ${TOKENS.shadow.deep} ${TOKENS.radius.xl}`
