'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'
import {
  Toaster as SonnerToaster,
  type ToasterProps as SonnerToasterProps,
} from 'sonner'

/**
 * Toaster (wrapper para sonner)
 * - Mantém a mesma API de props do `sonner`
 * - Integra com `next-themes` para alternância light/dark/system
 * - Evita importar tipos inexistentes em certas versões (Theme)
 */

// Reexportamos o tipo para quem quiser tipar o uso externamente.
export type ToasterProps = SonnerToasterProps

// Tema inferido a partir das props do próprio Sonner:
type SonnerTheme = NonNullable<SonnerToasterProps['theme']>
// fallback caso o genérico não funcione na sua versão:
// type SonnerTheme = 'light' | 'dark' | 'system'

export const Toaster: React.FC<ToasterProps> = (props) => {
  const { theme, resolvedTheme } = useTheme()

  // Fallback seguro para SSR/hidratação:
  const effectiveTheme: SonnerTheme =
    (theme === 'system'
      ? (resolvedTheme as SonnerTheme)
      : (theme as SonnerTheme)) ?? 'light'

  return (
    <SonnerToaster
      theme={effectiveTheme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          title: 'group-[.toast]:font-medium',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:hover:opacity-90',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:hover:opacity-90',
        },
      }}
      {...props}
    />
  )
}

export default Toaster
