'use client'

import * as React from 'react'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { Circle } from 'lucide-react'

import { cn } from '@/lib/utils'

// --- Componente Raiz (Root) ---

// Aplicamos a tipagem genérica do `forwardRef`.
// - `React.ElementRef<typeof RadioGroupPrimitive.Root>`: Tipa a `ref` do componente.
// - `React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>`: Herda todas as props do primitivo,
//   como `defaultValue`, `value`, `onValueChange`, `disabled`, `name`, etc.
const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return <RadioGroupPrimitive.Root className={cn('grid gap-2', className)} {...props} ref={ref} />
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

// --- Componente Item ---

// Aplicamos a mesma lógica para o `RadioGroupItem`.
// - `React.ElementRef<typeof RadioGroupPrimitive.Item>`: Tipa a `ref`.
// - `React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>`: Herda props como `value`, `disabled`, `id`, etc.
const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        'aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-3.5 w-3.5 fill-primary" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }