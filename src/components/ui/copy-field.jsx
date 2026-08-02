import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '../../lib/utils'

export function CopyField({ value, className }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      // clipboard API unavailable — still show feedback for demo purposes
    }
    setCopied(true)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div
      className={cn(
        'inline-flex items-stretch rounded-md border border-brand-border bg-white overflow-hidden',
        className
      )}
    >
      <div className="px-2 py-2 text-sm font-mono text-brand-text whitespace-nowrap">
        {value}
      </div>
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-brand-text border-l border-brand-border hover:bg-brand-bg transition-colors flex-shrink-0"
      >
        {copied ? <Check size={14} className="text-dessa-teal" /> : <Copy size={14} />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}
