import { cn } from '@/lib/utils'

// Criamos uma interface para as props do componente.
// Ela estende todas as props de um elemento <div> HTML padrão, como `id`, `data-testid`, etc.
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-primary/10', className)}
      {...props}
    />
  )
}

// Adicionar um displayName é uma boa prática para depuração e ferramentas de desenvolvedor.
Skeleton.displayName = 'Skeleton'

export { Skeleton }