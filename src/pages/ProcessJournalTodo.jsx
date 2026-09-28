import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Square, CheckSquare } from 'lucide-react'
import { TODO_SECTIONS } from '../lib/todoData'
import { reveal, Kicker } from './ProcessJournal'

// ─── Process Journal — Todo tab ─────────────────────────────────────────────
// Sibling to ProcessJournal.jsx (2026-09-25) — same editorial palette and
// masthead treatment, reached via the subnav in ProcessJournalLayout.jsx.
// Deliberately a plain checklist, not a log: the reasoning behind finished
// work belongs in the Journal tab, not duplicated here.
//
// Checked state (2026-09-25) is real, click-to-toggle, and persisted to
// localStorage keyed by each item's stable id — there's no backend, so this
// is the only way "checking something off" actually sticks across reloads.

const STORAGE_KEY = 'process-journal-todo-checked'

function loadChecked() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function TodoItem({ id, text, note, checked, onToggle }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onToggle(id)}
        aria-pressed={checked}
        className="w-full flex items-start gap-3 text-left group"
      >
        {checked
          ? <CheckSquare size={15} className="text-research-accent shrink-0 mt-0.5" />
          : <Square size={15} className="text-gray-300 shrink-0 mt-0.5 group-hover:text-gray-400 transition-colors" />}
        <div>
          <p className={`font-sans text-sm leading-relaxed transition-colors ${checked ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
            {text}
          </p>
          {note && <p className="font-sans text-xs text-gray-400 mt-1 leading-relaxed">{note}</p>}
        </div>
      </button>
    </li>
  )
}

function TodoSection({ section, index, checkedIds, onToggle }) {
  return (
    <motion.div {...reveal(index)} className="mb-12 max-w-2xl">
      <h2 className="font-sans text-xl font-semibold text-black mb-2">{section.title}</h2>
      {section.note && (
        <p className="font-sans text-sm text-gray-500 leading-relaxed mb-5">{section.note}</p>
      )}
      <ul className="space-y-4">
        {section.items.map((item) => (
          <TodoItem key={item.id} {...item} checked={checkedIds.has(item.id)} onToggle={onToggle} />
        ))}
      </ul>
    </motion.div>
  )
}

export default function ProcessJournalTodo() {
  const [checkedIds, setCheckedIds] = useState(loadChecked)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...checkedIds]))
  }, [checkedIds])

  function handleToggle(id) {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="px-6 md:px-[88px] py-16">
      <motion.div {...reveal(0)}>
        <Kicker>Process Journal</Kicker>
        <h1 className="font-sans text-[34px] font-semibold text-black leading-[1.2] max-w-2xl">
          What's still open
        </h1>
        <p className="font-sans text-lg text-gray-500 mt-5 max-w-2xl">
          A running checklist of what's left to decide or build. The reasoning behind
          finished work lives in the Journal tab, not here.
        </p>
      </motion.div>

      <div className="mt-16">
        {TODO_SECTIONS.map((section, i) => (
          <TodoSection
            key={section.title}
            section={section}
            index={i + 1}
            checkedIds={checkedIds}
            onToggle={handleToggle}
          />
        ))}
      </div>
    </div>
  )
}
