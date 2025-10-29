'use client'

import { useToast } from '@/hooks/use-toast'
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  type ToastProps, // Importamos o tipo das props do componente Toast
} from '@/components/ui/toast'

// Definimos a interface para o objeto que o hook `useToast` retorna para cada toast.
// Ela estende as props do componente `Toast` (para incluir `variant`, etc.) e adiciona
// as propriedades específicas de dados como `id`, `title`, `description` e `action`.
export interface ToasterToast extends ToastProps {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
}

export function Toaster() {
  // Assumimos que o hook `useToast` retorna um array de toasts com o tipo `ToasterToast`.
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}