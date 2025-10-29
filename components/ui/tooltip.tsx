'use client'

import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils'

/**
 * ✅ Tooltip (Radix v1) – implementação estável e compatível
 * - Usa Provider/Root/Trigger/Content do Radix
 * - forwardRef no Content (tipagem 100% correta)
 * - Portal + Arrow (opcional) com classes utilitárias
 * - Sem props/keys obsoletas; classes utilitárias eficientes
 * - Mantém a API esperada pelo restante do projeto
 */

// Provider: controle global (atraso, etc.)
const TooltipProvider = TooltipPrimitive.Provider

// Root e Trigger são reexportados diretamente do Radix
const Tooltip = TooltipPrimitive.Root
const TooltipTrigger = TooltipPrimitive.Trigger

type TooltipContentProps = React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & {
  /** Exibir seta na borda do tooltip (default: true) */
  withArrow?: boolean
}

/**
 * Conteúdo do Tooltip com tipagem correta e classes animadas.
 * - sideOffset default = 4 (afasta um pouco do target)
 * - withArrow controla a seta (true por padrão)
 */
const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  TooltipContentProps
>(({ className, sideOffset = 4, withArrow = true, ...props }, ref) => {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          // Camadas, shape e cores
          'z-50 rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground',
          // Animações de entrada/saída e direção
          'origin-[--radix-tooltip-content-transform-origin] animate-in fade-in-0 zoom-in-95',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          'data-[side=bottom]:slide-in-from-top-2',
          'data-[side=left]:slide-in-from-right-2',
          'data-[side=right]:slide-in-from-left-2',
          'data-[side=top]:slide-in-from-bottom-2',
          // Borda/sombra leve (opcional – ajusta ao seu design system)
          'shadow-md',
          className,
        )}
        {...props}
      >
        {props.children}
        {withArrow && (
          <TooltipPrimitive.Arrow
            className="fill-primary"
            // width/height defaultam bem; ajuste se quiser seta maior/menor
            width={8}
            height={4}
          />
        )}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
})
TooltipContent.displayName = 'TooltipContent'

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
