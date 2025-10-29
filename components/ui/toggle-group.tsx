'use client'

import * as React from 'react'
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group'
import { type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'
import { toggleVariants } from '@/components/ui/toggle'

// --- Tipagem do Contexto ---

// Criamos uma interface para o valor do nosso contexto.
// Usamos `Required<VariantProps<...>>` para garantir que `size` e `variant` sempre estejam presentes no objeto do contexto.
interface ToggleGroupContextType extends Required<VariantProps<typeof toggleVariants>> {}

const ToggleGroupContext = React.createContext<ToggleGroupContextType>({
  size: 'default',
  variant: 'default',
})

// --- Componente Provedor (ToggleGroup) ---

// A interface das props combina as props do Radix com as variantes de estilo.
interface ToggleGroupProps
  extends React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>,
    VariantProps<typeof toggleVariants> {}

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  ToggleGroupProps
>(({ className, variant, size, children, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn('flex items-center justify-center gap-1', className)}
    {...props}
  >
    <ToggleGroupContext.Provider value={{ variant: variant || 'default', size: size || 'default' }}>
      {children}
    </ToggleGroupContext.Provider>
  </ToggleGroupPrimitive.Root>
))

ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

// --- Componente Item (ToggleGroupItem) ---

// A interface das props do item também combina as props do Radix com as variantes,
// permitindo que um item individual sobrescreva o estilo do grupo.
interface ToggleGroupItemProps
  extends React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>,
    VariantProps<typeof toggleVariants> {}

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  ToggleGroupItemProps
>(({ className, children, variant, size, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext)

  // Usamos as variantes do contexto, mas permitimos que o item as sobrescreva.
  // A lógica `context.variant || variant` funciona perfeitamente, pois se `context.variant` for `undefined`
  // (o que não acontecerá se o item estiver dentro do grupo), ele usará a prop do item.
  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        className,
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
})

ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName

export { ToggleGroup, ToggleGroupItem }