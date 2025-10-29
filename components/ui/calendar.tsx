'use client'

import * as React from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { DayPicker } from 'react-day-picker'

import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { type VariantProps } from 'class-variance-authority'

/**
 * ✅ Calendar – Compatível com react-day-picker v8
 * - Usa apenas chaves válidas de classNames (v8)
 * - captionLayout: 'buttons' | 'dropdown'
 * - Sem getDefaultClassNames / Components / Modifiers (incompatíveis)
 * - Estilos de "outside" e "disabled" via data-attributes no seletor de "day"
 * - Corrigido: 'vhidden' (não 'hidden')
 */

type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  className?: string
  buttonVariant?: VariantProps<typeof buttonVariants>['variant']
  captionLayout?: 'buttons' | 'dropdown'
}

export function Calendar({
  className,
  buttonVariant = 'ghost',
  captionLayout = 'buttons',
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      captionLayout={captionLayout}
      className={cn(
        'group/calendar bg-background p-3 [--cell-size:2rem] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent',
        String.raw`rtl:**:[.rdp-button_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button_previous>svg]:rotate-180`,
        className,
      )}
      classNames={{
        root: cn('w-fit'),
        months: cn('relative flex flex-col gap-4 md:flex-row'),
        month: cn('flex w-full flex-col gap-4'),
        caption: cn('flex h-[--cell-size] w-full items-center justify-center px-[--cell-size]'),
        caption_label: cn(
          'select-none font-medium text-sm',
          captionLayout === 'dropdown' &&
            '[&>svg]:text-muted-foreground flex h-8 items-center gap-1 rounded-md pl-2 pr-1 text-sm [&>svg]:size-3.5',
        ),
        nav: cn('absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1'),
        nav_button: cn(
          buttonVariants({ variant: buttonVariant }),
          'h-[--cell-size] w-[--cell-size] select-none p-0 aria-disabled:opacity-50',
        ),
        nav_button_previous: cn(''),
        nav_button_next: cn(''),
        table: cn('w-full border-collapse'),
        head_row: cn('flex'),
        head_cell: cn(
          'text-muted-foreground flex-1 select-none rounded-md text-[0.8rem] font-normal',
        ),
        row: cn('mt-2 flex w-full'),
        weeknumber: cn('w-[--cell-size] select-none'),
        day: cn(
          // botão do dia (v8 aplica data-attrs no próprio elemento de dia)
          'group/day relative aspect-square h-auto w-full min-w-[--cell-size] select-none p-0 text-center ' +
            'flex flex-col gap-1 font-normal leading-none ' +
            // selecionado
            'data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground ' +
            // foco pelo teclado
            'group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 ' +
            'group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:ring-ring/50 ' +
            // legenda menor
            '[&>span]:text-xs [&>span]:opacity-70 ' +
            // dias fora do mês e desabilitados
            '[data-outside=true]:text-muted-foreground [data-disabled=true]:opacity-50',
        ),
        // ⚠️ v8 usa 'vhidden' (não 'hidden')
        vhidden: cn('invisible'),
      }}
      components={{
        IconLeft: () => <ChevronLeftIcon className="size-4" />,
        IconRight: () => <ChevronRightIcon className="size-4" />,
      }}
      {...props}
    />
  )
}
