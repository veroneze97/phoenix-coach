'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

// Usamos o tipo `ToasterProps` exportado pela própria biblioteca `sonner`.
// Isso garante que nosso componente aceite exatamente as mesmas props que o componente original.
const Toaster = ({ ...props }: ToasterProps) => {
  // O hook `useTheme` do `next-themes` já é bem tipado.
  // O valor de `theme` será 'light' | 'dark' | 'system', que é exatamente o que o `Sonner` espera.
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }