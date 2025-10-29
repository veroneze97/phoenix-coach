'use client'

import * as React from 'react'
import * as SeparatorPrimitive from '@radix-ui/react-separator'

import { cn } from '@/lib/utils'

// Usamos a sintaxe genérica do `forwardRef` para tipar o componente.
// - `React.ElementRef<typeof SeparatorPrimitive.Root>`: Tipa a `ref`.
// - `React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>`: Herda todas as props do primitivo.
//   Isso inclui `orientation` (tipada como 'horizontal' | 'vertical') e `decorative` (tipada como boolean).
const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = 'horizontal', decorative = true, ...props },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        'shrink-0 bg-border',
        orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
        className,
      )}
      {...props}
    />
  )
)
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }