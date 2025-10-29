'use client'

import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'

import { cn } from '@/lib/utils'

// Usamos a sintaxe genérica do `forwardRef` para tipar o componente.
// - O primeiro tipo, `React.ElementRef<typeof ProgressPrimitive.Root>`, define o tipo da referência (ref).
// - O segundo tipo, `React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>`, define as props que o componente aceita.
//   Isso é muito poderoso, pois herdamos automaticamente todas as props do componente primitivo do Radix,
//   incluindo `className` e a prop `value` (que já é tipada como `number | undefined` por eles).
const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn('relative h-2 w-full overflow-hidden rounded-full bg-primary/20', className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }