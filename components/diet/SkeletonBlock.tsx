'use client'

import { memo } from 'react'

/**
 * SkeletonBlock
 * — Placeholder de carregamento reutilizável.
 * — Visual consistente com Phoenix UI (raios e cores).
 * — Acessível: marcado como decorativo (aria-hidden).
 */

interface SkeletonBlockProps {
  className?: string
  /** Desativa a animação de pulso quando false */
  animate?: boolean
}

const TOKENS = {
  radius: 'rounded-2xl',
  // fundo levemente translúcido, com bom contraste em dark mode
  light: 'bg-zinc-200/70 dark:bg-zinc-800/70',
} as const

const SkeletonBlock = memo(function SkeletonBlock({
  className = '',
  animate = true,
}: SkeletonBlockProps) {
  return (
    <div
      className={`${animate ? 'animate-pulse' : ''} ${TOKENS.light} ${TOKENS.radius} ${className}`}
      aria-hidden
    />
  )
})

export default SkeletonBlock
