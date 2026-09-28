// Opened in a new tab from every Resource Library row (2026-09-28), in
// place of the detail modal that used to live there. Deliberately generic
// and not resource-specific, per explicit request ("nothing should be on
// the new tab, except for an explanation").
export default function ResourcePreview() {
  return (
    <div className="px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold text-brand-text mb-2">Opening a resource</h1>
      <p className="text-brand-subtext text-sm max-w-md mx-auto">
        This prototype does not have real resource files wired up yet. In the finished product, this tab would show or download the actual file.
      </p>
    </div>
  )
}
