'use client'

import * as React from 'react'
import * as ResizablePrimitive from 'react-resizable-panels'
import { cn } from '@/lib/utils'

/**
 * Resizable – Wrapper para react-resizable-panels (compatível com v2)
 * - PanelGroup com forwardRef (ok nessa lib)
 * - Panel re-export simples
 * - PanelResizeHandle SEM forwardRef e SEM children (evita TS2322)
 * - Visual do handle via pseudo-elementos (::before/::after) no próprio handle
 */

/* PanelGroup ---------------------------------------------------------------- */
const ResizablePanelGroup = React.forwardRef<
  React.ElementRef<typeof ResizablePrimitive.PanelGroup>,
  React.ComponentPropsWithoutRef<typeof ResizablePrimitive.PanelGroup>
>(({ className, ...props }, ref) => {
  return (
    <ResizablePrimitive.PanelGroup
      ref={ref}
      className={cn(
        'flex h-full w-full data-[panel-group-direction=vertical]:flex-col',
        className,
      )}
      {...props}
    />
  )
})
ResizablePanelGroup.displayName = 'ResizablePanelGroup'

/* Panel (re-export simples) ------------------------------------------------- */
const ResizablePanel = ResizablePrimitive.Panel

/* Handle -------------------------------------------------------------------- */
/** Props iguais às do PanelResizeHandle + flag visual opcional */
type ResizableHandleProps = React.ComponentPropsWithoutRef<
  typeof ResizablePrimitive.PanelResizeHandle
> & {
  withHandle?: boolean
}

/**
 * IMPORTANTE:
 * - Não usamos forwardRef aqui, pois algumas versões da lib não tipam o handle como forwardRef.
 * - Não passamos children, pois certas tipagens do handle não aceitam (gera TS2322).
 * - Visual 100% via classes utilitárias (pseudo-elementos), sem filhos.
 */
function ResizableHandleBase({ withHandle = true, className, ...props }: ResizableHandleProps) {
  return (
    <ResizablePrimitive.PanelResizeHandle
      // NÃO passar ref aqui (evita o erro de tipos da sua versão)
      role="separator"
      aria-orientation="vertical"
      className={cn(
        // trilho/base horizontal
        'relative flex w-px items-center justify-center bg-border focus-visible:outline-none',
        'focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1',
        // trilho central (horizontal) usando ::after
        'after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2',
        // quando o group é vertical, o handle vira barra horizontal
        'data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full',
        'data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1',
        'data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2',
        // grip opcional via ::before (um “pill” com duas listras)
        withHandle &&
          [
            'before:content-[""] before:absolute before:z-10 before:flex before:h-4 before:w-3',
            'before:-translate-x-1/2 before:-translate-y-1/2 before:left-1/2 before:top-1/2',
            'before:rounded-sm before:border before:bg-border',
            // duas “riscas” internas com background gradients
            'before:[background-image:linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor)]',
            'before:[background-repeat:no-repeat,no-repeat] before:[background-size:1px_60%,1px_60%]',
            'before:[background-position:35%_50%,65%_50%] before:text-foreground',
            // em layout vertical, rotaciona o “pill”
            'data-[panel-group-direction=vertical]:before:rotate-90',
          ].join(' '),
        className,
      )}
      {...props}
    />
  )
}

const ResizableHandle = ResizableHandleBase

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
