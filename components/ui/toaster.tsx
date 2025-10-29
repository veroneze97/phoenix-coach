'use client'

import * as React from 'react'
import { useToast } from '@/hooks/use-toast'
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast'

// Inferimos as props do componente Toast
type InferredToastProps = React.ComponentProps<typeof Toast>

/**
 * Formato dos toasts gerenciados pelo hook:
 * - Removemos 'title' e 'children' das props inferidas do <Toast /> para poder
 *   reintroduzi-las com os tipos que queremos renderizar aqui no Toaster.
 */
export type ToasterToast = Omit<InferredToastProps, 'title' | 'children'> & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
}

export function Toaster() {
  // Ajuste a tipagem do hook para refletir o formato acima
  const { toasts } = useToast() as { toasts: ToasterToast[] }

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props}>
          <div className="grid gap-1">
            {title ? <ToastTitle>{title}</ToastTitle> : null}
            {description ? <ToastDescription>{description}</ToastDescription> : null}
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
