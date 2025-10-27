import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '@/lib/auth-context'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Phoenix Coach - Rise Stronger Every Day',
  description: 'Your personal health and fitness coach',
  manifest: '/manifest.json',
  themeColor: '#FFB300',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  // CORREÇÃO: Substitui a propriedade obsoleta 'appleWebApp' pela nova 'mobileWebApp'
  mobileWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Phoenix Coach',
  },
  // CORREÇÃO: Adiciona uma configuração de ícones mais completa para evitar erros 404
  icons: {
    icon: '/favicon.ico', // Ícone padrão para navegadores
    apple: '/icon-192.png', // Ícone para dispositivos Apple
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      {/* 
        CORREÇÃO: Adiciona tags de link na <head> para máxima compatibilidade de ícones.
        Isso garante que o ícone apareça corretamente em diferentes navegadores e plataformas.
      */}
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            {children}
            <Toaster position="top-center" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}