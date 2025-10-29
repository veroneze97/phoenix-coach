'use client'

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'

interface PhoenixBackgroundProps {
  /** 0–100: porcentagem de progresso para modular o “glow” */
  progress: number
  /** Se true, aplica um leve grid por trás do glow (sutil) */
  showGrid?: boolean
  className?: string
}

/** Converte 0–100 para 0–1 com limites */
function clamp01FromPct(pct: number) {
  if (!Number.isFinite(pct)) return 0
  if (pct <= 0) return 0
  if (pct >= 100) return 1
  return pct / 100
}

/** Curva de intensidade para o glow (mais suave nos extremos) */
function easeInOutQuad(t: number) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

const PhoenixBackground = memo(function PhoenixBackground({
  progress,
  showGrid = false,
  className = '',
}: PhoenixBackgroundProps) {
  const intensity = useMemo(() => easeInOutQuad(clamp01FromPct(progress)), [progress])

  // Opacidades derivadas (capadas para não “sujar” a UI)
  const glow1 = Math.min(0.28, 0.28 * intensity) // círculo central quente
  const glow2 = Math.min(0.18, 0.18 * intensity) // halo secundário
  const fog = Math.min(0.10, 0.10 * (0.6 + intensity * 0.4)) // “neblina” sutil

  // Grid opcional super sutil
  const grid = showGrid
    ? `linear-gradient(
         to bottom,
         transparent 0%,
         transparent 95%,
         rgba(255,255,255,0.035) 100%
       ),
       linear-gradient(
         to right,
         transparent 0%,
         transparent 95%,
         rgba(255,255,255,0.03) 100%
       ),`
    : ''

  return (
    <motion.div
      className={`pointer-events-none fixed inset-0 -z-10 ${className}`}
      style={{
        // Camada base: cor do tema (card/background) para integrar com o design
        background: `linear-gradient(
          to bottom,
          hsl(var(--background)) 0%,
          hsl(var(--muted)) 100%
        )`,
      }}
      aria-hidden
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {/* Camada de brilhos (radiais) */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            ${grid}
            radial-gradient(
              40% 40% at 50% 40%,
              rgba(251,146,60,${glow1}) 0%,
              rgba(251,146,60,0) 60%
            ),
            radial-gradient(
              60% 60% at 50% 65%,
              rgba(234,88,12,${glow2}) 0%,
              rgba(234,88,12,0) 70%
            ),
            radial-gradient(
              80% 80% at 50% 55%,
              rgba(255,255,255,${fog}) 0%,
              rgba(255,255,255,0) 80%
            )
          `,
          // mistura para harmonizar com o tema e não "lavar" as cores
          mixBlendMode: 'normal',
        }}
      />
    </motion.div>
  )
})

export default PhoenixBackground
