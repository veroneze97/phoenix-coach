'use client'

import * as React from 'react'
import { OTPInput, OTPInputContext } from 'input-otp'
import { Minus } from 'lucide-react'

import { cn } from '@/lib/utils'

/* =========================================================================
   Input OTP – wrapper estável para 'input-otp'
   - Exige e repassa 'maxLength' (obrigatório no componente base)
   - Tipagem robusta usando 'type' (evita problemas de 'interface extends')
   - Suporte a className e containerClassName
   - Slots seguros (contexto pode não existir em certos momentos)
   ========================================================================= */

type OTPInputBaseProps = React.ComponentPropsWithoutRef<typeof OTPInput>

type InputOTPProps = OTPInputBaseProps & {
  /** Classe aplicada ao container interno do OTP (prop específica do input-otp) */
  containerClassName?: string
  /** Classe aplicada diretamente no componente OTPInput (wrapper) */
  className?: string
  /** Obrigatório pelo input-otp: número total de slots */
  maxLength: number
}

const InputOTP = React.forwardRef<React.ElementRef<typeof OTPInput>, InputOTPProps>(
  ({ className, containerClassName, maxLength, ...props }, ref) => {
    return (
      <OTPInput
        ref={ref}
        maxLength={maxLength}
        containerClassName={cn(
          'flex items-center gap-2 has-[:disabled]:opacity-50',
          containerClassName,
        )}
        className={cn('disabled:cursor-not-allowed', className)}
        {...props}
      />
    )
  },
)
InputOTP.displayName = 'InputOTP'

/* ============================================
   Grupo de slots (container dos dígitos)
   ============================================ */

const InputOTPGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex items-center', className)} {...props} />
))
InputOTPGroup.displayName = 'InputOTPGroup'

/* ============================================
   Slot individual (cada “caixinha” do código)
   ============================================ */

type InputOTPSlotProps = React.HTMLAttributes<HTMLDivElement> & {
  index: number
}

const InputOTPSlot = React.forwardRef<HTMLDivElement, InputOTPSlotProps>(
  ({ index, className, ...props }, ref) => {
    const ctx = React.useContext(OTPInputContext)

    // Acesso defensivo ao slot – evita crash quando contexto ainda não está pronto.
    const slot = ctx?.slots?.[index]
    const char = slot?.char ?? ''
    const hasFakeCaret = slot?.hasFakeCaret ?? false
    const isActive = slot?.isActive ?? false

    return (
      <div
        ref={ref}
        role="textbox"
        aria-label={`Código ${index + 1}`}
        className={cn(
          'relative flex h-9 w-9 items-center justify-center border-y border-r border-input text-sm shadow-sm transition-all',
          'first:rounded-l-md first:border-l last:rounded-r-md',
          isActive && 'z-10 ring-1 ring-ring',
          className,
        )}
        {...props}
      >
        {char}
        {hasFakeCaret && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-4 w-px bg-foreground animate-[blink_1s_steps(2,start)_infinite]" />
          </div>
        )}
      </div>
    )
  },
)
InputOTPSlot.displayName = 'InputOTPSlot'

/* ============================================
   Separador visual entre blocos (ex.: 3-3)
   ============================================ */

const InputOTPSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} role="separator" className={cn('px-1 text-muted-foreground', className)} {...props}>
    <Minus aria-hidden="true" />
  </div>
))
InputOTPSeparator.displayName = 'InputOTPSeparator'

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
