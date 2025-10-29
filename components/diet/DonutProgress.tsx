'use client'

import { memo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Flame } from 'lucide-react'

interface DonutProgressProps {
  current: number
  goal: number
}

/**
 * DonutProgress — Indicador circular de progresso (kcal)
 * - Totalmente independente, pode ser usado em qualquer módulo
 * - Usa SVG + animação suave com framer-motion
 * - Mostra percentual e valores absolutos
 */
const DonutProgress = memo(function DonutProgress({ current, goal }: DonutProgressProps) {
  const reduce = useReducedMotion()
  const pct = Math.max(0, Math.min(100, goal > 0 ? (current / goal) * 100 : 0))
  const size = 220
  const stroke = 16
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (pct / 100) * c

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="rotate-[-90deg]">
        {/* fundo */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(0,0,0,0.08)"
          strokeWidth={stroke}
          fill="none"
        />
        {/* círculo animado */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#phoenix-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          initial={{ strokeDasharray: c, strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={reduce ? { duration: 0 } : { duration: 1.2, ease: 'easeOut' }}
          style={{ filter: 'drop-shadow(0 2px 8px rgba(251,146,60,.35))' }}
        />
        <defs>
          <linearGradient id="phoenix-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f59e0b" /> {/* amber-500 */}
            <stop offset="100%" stopColor="#ea580c" /> {/* orange-600 */}
          </linearGradient>
        </defs>
      </svg>

      {/* conteúdo central */}
      <div className="absolute rotate-0 text-center">
        <div className="flex items-center justify-center gap-1 text-3xl font-bold text-foreground">
          <Flame className="h-6 w-6 text-orange-500" /> {Math.round(pct)}%
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {Math.round(current)} / {Math.round(goal)} kcal
        </p>
      </div>
    </div>
  )
})

export default DonutProgress
