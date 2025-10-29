'use client'

import { memo } from 'react'

/**
 * SkeletonBlock
 * — Componente reutilizável para placeholders de carregamento.
 * — Mantém consistência visual entre telas (usa tokens base da Phoenix UI).
 */

interface SkeletonBlockProps {
  className?: string
  animate?: boolean
}

const TOKENS = {
  radius: 'rounded-2xl',
  light: 'bg-zinc-200/70 dark:bg-zinc-800/70',
}

/**
 * Exemplo de uso:
 * <SkeletonBlock className="h-6 w-1/2" />
 * <SkeletonBlock className="h-48 w-full" animate={false} />
 */
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
