'use client'

import * as React from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import type {
  EmblaOptionsType,
  EmblaPluginType,
  EmblaCarouselType,
} from 'embla-carousel'
import { ArrowLeft, ArrowRight } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { type VariantProps } from 'class-variance-authority'

/* =========================================================================
   Tipagem robusta (compatível com Embla v8)
   - NÃO importamos tipos de 'embla-carousel-react' (eles não exportam os nomes usados)
   - Tipos base vêm do core 'embla-carousel'
   ======================================================================== */

type CarouselApi = EmblaCarouselType | undefined
type CarouselOptions = EmblaOptionsType
type CarouselPlugin = EmblaPluginType
type CarouselViewportRef = ReturnType<typeof useEmblaCarousel>[0]

/* =========================
   Contexto do Carousel
   ========================= */

interface CarouselContextValue {
  carouselRef: CarouselViewportRef
  api: CarouselApi
  opts: CarouselOptions | undefined
  orientation: 'horizontal' | 'vertical'
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
}

const CarouselContext = React.createContext<CarouselContextValue | null>(null)

function useCarousel() {
  const ctx = React.useContext(CarouselContext)
  if (!ctx) throw new Error('useCarousel must be used within a <Carousel />')
  return ctx
}

/* =========================
   Componente raiz
   ========================= */

interface CarouselProps {
  opts?: CarouselOptions
  plugins?: CarouselPlugin[]
  orientation?: 'horizontal' | 'vertical'
  setApi?: (api: EmblaCarouselType) => void
  className?: string
  children: React.ReactNode
}

const Carousel = React.forwardRef<HTMLDivElement, CarouselProps>(
  ({ orientation = 'horizontal', opts, setApi, plugins, className, children, ...props }, ref) => {
    const [carouselRef, api] = useEmblaCarousel(
      { ...opts, axis: orientation === 'horizontal' ? 'x' : 'y' },
      plugins,
    )

    const [canScrollPrev, setCanScrollPrev] = React.useState(false)
    const [canScrollNext, setCanScrollNext] = React.useState(false)

    const onSelect = React.useCallback((embla: EmblaCarouselType | undefined) => {
      if (!embla) return
      setCanScrollPrev(embla.canScrollPrev())
      setCanScrollNext(embla.canScrollNext())
    }, [])

    const scrollPrev = React.useCallback(() => api?.scrollPrev(), [api])
    const scrollNext = React.useCallback(() => api?.scrollNext(), [api])

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent) => {
        if (orientation === 'horizontal') {
          if (event.key === 'ArrowLeft') {
            event.preventDefault()
            scrollPrev()
          } else if (event.key === 'ArrowRight') {
            event.preventDefault()
            scrollNext()
          }
        } else {
          if (event.key === 'ArrowUp') {
            event.preventDefault()
            scrollPrev()
          } else if (event.key === 'ArrowDown') {
            event.preventDefault()
            scrollNext()
          }
        }
      },
      [orientation, scrollPrev, scrollNext],
    )

    // Expor API para o pai se solicitado
    React.useEffect(() => {
      if (api && setApi) setApi(api)
    }, [api, setApi])

    // Atualizar botões ao iniciar/selecionar
    React.useEffect(() => {
      if (!api) return
      onSelect(api)
      api.on('reInit', onSelect)
      api.on('select', onSelect)
      return () => {
        api.off('reInit', onSelect)
        api.off('select', onSelect)
      }
    }, [api, onSelect])

    return (
      <CarouselContext.Provider
        value={{
          carouselRef,
          api,
          opts,
          orientation,
          scrollPrev,
          scrollNext,
          canScrollPrev,
          canScrollNext,
        }}
      >
        <div
          ref={ref}
          onKeyDownCapture={handleKeyDown}
          className={cn('relative', className)}
          role="region"
          aria-roledescription="carousel"
          {...props}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    )
  },
)
Carousel.displayName = 'Carousel'

/* =========================
   Componentes filhos
   ========================= */

const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { carouselRef, orientation } = useCarousel()
  return (
    <div ref={carouselRef} className="overflow-hidden">
      <div
        ref={ref}
        className={cn(
          'flex',
          orientation === 'horizontal' ? '-ml-4' : '-mt-4 flex-col',
          className,
        )}
        {...props}
      />
    </div>
  )
})
CarouselContent.displayName = 'CarouselContent'

const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { orientation } = useCarousel()
  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      className={cn(
        'min-w-0 shrink-0 grow-0 basis-full',
        orientation === 'horizontal' ? 'pl-4' : 'pt-4',
        className,
      )}
      {...props}
    />
  )
})
CarouselItem.displayName = 'CarouselItem'

type CarouselButtonProps = React.ComponentPropsWithoutRef<typeof Button> &
  VariantProps<typeof Button>

const CarouselPrevious = React.forwardRef<HTMLButtonElement, CarouselButtonProps>(
  ({ className, variant = 'outline', size = 'icon', ...props }, ref) => {
    const { orientation, scrollPrev, canScrollPrev } = useCarousel()
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn(
          'absolute h-8 w-8 rounded-full',
          orientation === 'horizontal'
            ? '-left-12 top-1/2 -translate-y-1/2'
            : '-top-12 left-1/2 -translate-x-1/2 rotate-90',
          className,
        )}
        disabled={!canScrollPrev}
        onClick={scrollPrev}
        {...props}
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="sr-only">Previous slide</span>
      </Button>
    )
  },
)
CarouselPrevious.displayName = 'CarouselPrevious'

const CarouselNext = React.forwardRef<HTMLButtonElement, CarouselButtonProps>(
  ({ className, variant = 'outline', size = 'icon', ...props }, ref) => {
    const { orientation, scrollNext, canScrollNext } = useCarousel()
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn(
          'absolute h-8 w-8 rounded-full',
          orientation === 'horizontal'
            ? '-right-12 top-1/2 -translate-y-1/2'
            : '-bottom-12 left-1/2 -translate-x-1/2 rotate-90',
          className,
        )}
        disabled={!canScrollNext}
        onClick={scrollNext}
        {...props}
      >
        <ArrowRight className="h-4 w-4" />
        <span className="sr-only">Next slide</span>
      </Button>
    )
  },
)
CarouselNext.displayName = 'CarouselNext'

export { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, useCarousel }
