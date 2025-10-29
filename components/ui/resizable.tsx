'use client'

import { GripVertical } from 'lucide-react'
import * as ResizablePrimitive from 'react-resizable-panels'

import { cn } from '@/lib/utils'

// --- Componentes com forwardRef ---

// Adicionamos `forwardRef` e tipamos as props herdando do componente primitivo da biblioteca.
const ResizablePanelGroup = React.forwardRef<
  React.ElementRef<typeof ResizablePrimitive.PanelGroup>,
  React.ComponentPropsWithoutRef<typeof ResizablePrimitive.PanelGroup>
>(({ className, ...props }, ref) => (
  <ResizablePrimitive.PanelGroup
    ref={ref}
    className={cn('flex h-full w-full data-[panel-group-direction=vertical]:flex-col', className)}
    {...props}
  />
))
ResizablePanelGroup.displayName = 'ResizablePanelGroup'

// --- Componentes Simples (Apenas re-exportações) ---

// Este componente já vem tipado da biblioteca, então apenas o re-exportamos.
const ResizablePanel = ResizablePrimitive.Panel

// --- Componente com Props Customizadas ---

// Criamos uma interface para as props do `ResizableHandle`.
// Ela estende as props do componente primitivo `PanelResizeHandle` e adiciona nossa prop customizada `withHandle`.
interface ResizableHandleProps
  extends React.ComponentPropsWithoutRef<typeof ResizablePrimitive.PanelResizeHandle> {
  withHandle?: boolean
}

const ResizableHandle = React.forwardRef<React.ElementRef<typeof ResizablePrimitive.PanelResizeHandle>, ResizableHandleProps>(
  ({ withHandle, className, ...props }, ref) => (
    <ResizablePrimitive.PanelResizeHandle
      ref={ref}
      className={cn(
        'relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90',
        className,
      )}
      {...props}
    >
      {withHandle && (
        <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
          <GripVertical className="h-2.5 w-2.5" />
        </div>
      )}
    </ResizablePrimitive.PanelResizeHandle>
  )
)
ResizableHandle.displayName = 'ResizableHandle'

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }