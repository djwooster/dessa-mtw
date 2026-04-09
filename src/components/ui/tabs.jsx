import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '../../lib/utils'

const Tabs = TabsPrimitive.Root

function TabsList({ className, ...props }) {
  return (
    <TabsPrimitive.List
      className={cn(
        'inline-flex items-center justify-center rounded-lg p-1',
        'bg-brand-border/50',
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'inline-flex items-center justify-center rounded-md px-4 py-1.5',
        'text-sm font-medium text-brand-subtext transition-all',
        'hover:text-brand-text',
        'data-[state=active]:bg-white data-[state=active]:text-brand-text data-[state=active]:shadow-sm',
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }) {
  return (
    <TabsPrimitive.Content
      className={cn('mt-6', className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
