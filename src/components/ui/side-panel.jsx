import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

export function SidePanel({ open, onClose, title, children }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-x-0 top-14 bottom-0 z-20 bg-black/20"
          />
          <motion.aside
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed right-0 top-14 bottom-0 w-[380px] bg-white border-l border-brand-border z-30 flex flex-col shadow-xl"
          >
            <div className="flex items-center justify-between px-8 py-6 border-b border-brand-border">
              <h2 className="text-lg font-bold text-brand-text">{title}</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-brand-subtext hover:text-brand-text hover:bg-brand-bg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-8 py-6">{children}</div>
            <div className="px-8 py-5 border-t border-brand-border shrink-0">
              <button
                onClick={onClose}
                className="w-full h-9 rounded-lg border border-brand-border text-sm font-medium text-brand-subtext hover:bg-brand-bg transition-colors"
              >
                Close
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
