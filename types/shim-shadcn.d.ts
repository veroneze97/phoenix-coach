// types/shim-shadcn.d.ts
// Shims de tipagem para componentes shadcn/ui usados no projeto.
// Evitam erros do tipo “Property 'children' does not exist…” em TSX.

import * as React from "react";

type WithChildren<P = {}> = P & { children?: React.ReactNode };

// ---------- Button ----------
declare module "@/components/ui/button" {
  export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    asChild?: boolean;
    className?: string;
  }
  export const Button: React.ForwardRefExoticComponent<
    ButtonProps & React.RefAttributes<HTMLButtonElement>
  >;
}

// ---------- Card ----------
declare module "@/components/ui/card" {
  export interface BaseProps {
    className?: string;
  }
  export const Card: React.FC<WithChildren<BaseProps>>;
  export const CardHeader: React.FC<WithChildren<BaseProps>>;
  export const CardContent: React.FC<WithChildren<BaseProps>>;
  export const CardTitle: React.FC<WithChildren<BaseProps>>;
  export const CardDescription: React.FC<WithChildren<BaseProps>>;
}

// ---------- Dialog ----------
declare module "@/components/ui/dialog" {
  export interface DialogProps {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    children?: React.ReactNode;
  }
  export const Dialog: React.FC<DialogProps>;

  export interface DialogContentProps {
    className?: string;
    children?: React.ReactNode;
  }
  export const DialogContent: React.FC<DialogContentProps>;

  export interface SimpleProps {
    className?: string;
    children?: React.ReactNode;
  }
  export const DialogHeader: React.FC<SimpleProps>;
  export const DialogTitle: React.FC<SimpleProps>;
  export const DialogDescription: React.FC<SimpleProps>;
}

// ---------- Label ----------
declare module "@/components/ui/label" {
  export interface LabelProps
    extends React.LabelHTMLAttributes<HTMLLabelElement> {
    className?: string;
  }
  export const Label: React.ForwardRefExoticComponent<
    LabelProps & React.RefAttributes<HTMLLabelElement>
  >;
}

// ---------- Input ----------
declare module "@/components/ui/input" {
  export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    className?: string;
  }
  export const Input: React.ForwardRefExoticComponent<
    InputProps & React.RefAttributes<HTMLInputElement>
  >;
}

// ---------- ScrollArea ----------
declare module "@/components/ui/scroll-area" {
  export interface ScrollAreaProps
    extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
  }
  export const ScrollArea: React.FC<WithChildren<ScrollAreaProps>>;
}

// ---------- Progress ----------
declare module "@/components/ui/progress" {
  export interface ProgressProps
    extends React.HTMLAttributes<HTMLDivElement> {
    value?: number;
    className?: string;
    children?: React.ReactNode;
  }
  export const Progress: React.FC<ProgressProps>;
}

// ---------- Slider ----------
declare module "@/components/ui/slider" {
  export interface SliderProps {
    value?: number[];
    defaultValue?: number[];
    min?: number;
    max?: number;
    step?: number;
    className?: string;
    onValueChange?: (value: number[]) => void;
  }
  export const Slider: React.ForwardRefExoticComponent<
    SliderProps & React.RefAttributes<HTMLSpanElement>
  >;
}

// ---------- Tooltip (opcional, caso você use) ----------
declare module "@/components/ui/tooltip" {
  export const Tooltip: React.FC<WithChildren<{ className?: string }>>;
  export const TooltipTrigger: React.FC<WithChildren<{ className?: string }>>;
  export const TooltipContent: React.FC<WithChildren<{ className?: string }>>;
}
