'use client'

import * as CollapsiblePrimitive from '@radix-ui/react-collapsible'

// Como estes são apenas re-exports dos componentes do Radix UI,
// não precisamos adicionar nenhuma tipagem adicional aqui.
// O TypeScript inferirá os tipos corretos diretamente do pacote @radix-ui/react-collapsible.
const Collapsible = CollapsiblePrimitive.Root

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger

const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent

export { Collapsible, CollapsibleTrigger, CollapsibleContent }