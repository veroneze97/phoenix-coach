declare module '@/lib/auth-context' {
  export function useAuth(): {
    user: { id?: string; [k: string]: any } | null
    [k: string]: any
  }
}
