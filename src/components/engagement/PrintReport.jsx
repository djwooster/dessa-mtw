import { createPortal } from 'react-dom'

// Print layout for the Engagement report (2026-10-08), shaped like a bank
// statement: a letterhead, a key-figures strip, the graph, then a ruled table
// that can run onto more pages. It lives off-screen at the printed width (so
// the SVG chart sizes correctly) and is the only thing the browser prints
// (see the .print-report rules in index.css). Saving the print dialog as a PDF
// gives a real, selectable-text file.
export default function PrintReport({ title, rangeText, goalText, generated, stats, chartTitle, chart, columns, rows }) {
  return createPortal(
    <div className="print-report text-brand-text">
      <header className="flex items-end justify-between border-b-2 border-dessa-teal pb-4 mb-6">
        <div>
          <img src="/dessa-mtw-logo.svg" alt="DESSA x Move This World" className="h-6 w-auto mb-4" />
          <h1 className="text-3xl font-semibold leading-tight">{title}</h1>
        </div>
        <div className="text-right text-xs text-brand-subtext leading-5">
          <p><span className="font-semibold text-brand-text">{rangeText}</span></p>
          <p>{goalText}</p>
          <p>Generated {generated}</p>
        </div>
      </header>

      <section className="grid grid-cols-3 gap-4 mb-8 print-avoid-break">
        {stats.map(s => (
          <div key={s.label} className="rounded-lg border border-brand-border px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-subtext">{s.label}</p>
            <p className="text-2xl font-semibold mt-1 leading-tight">{s.value}</p>
            {s.note && <p className="text-xs text-brand-subtext mt-0.5">{s.note}</p>}
          </div>
        ))}
      </section>

      <section className="mb-8 print-avoid-break">
        <h2 className="text-base font-semibold mb-3">{chartTitle}</h2>
        {chart}
      </section>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-brand-text">
            {columns.map((c, i) => (
              <th key={c} className={`py-2 text-[13px] font-semibold ${i === 0 ? 'text-left' : 'text-right'}`}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.name} className="border-b border-brand-border print-avoid-break">
              <td className="py-2.5 font-medium">{r.name}</td>
              <td className="py-2.5 text-right tabular-nums">{r.value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <footer className="print-footer text-[11px] text-brand-subtext">
        <span>Move This World and DESSA, Riverside Insights</span>
        <span>{title}, {rangeText}</span>
      </footer>
    </div>,
    document.body
  )
}
