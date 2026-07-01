interface Props {
  query: string
  onQueryChange: (q: string) => void
  section: 'food' | 'drinks'
  onSectionChange: (s: 'food' | 'drinks') => void
  category: string
  onCategoryChange: (c: string) => void
  viewMode: 'grid' | 'list'
  onViewModeToggle: () => void
  visibleCats: string[]
  selectable?: boolean
}

export function MenuSearchBar({
  query, onQueryChange,
  section, onSectionChange,
  category, onCategoryChange,
  viewMode, onViewModeToggle,
  visibleCats,
  selectable,
}: Props) {
  return (
    <div
      className="shrink-0 z-30 space-y-2.5 px-4 pt-2 pb-3 border-b border-[var(--border)]"
      style={{ background: 'var(--glass-header)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
    >
      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: 'var(--muted)' }}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
        >
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
        </svg>
        <input
          value={query}
          onChange={(e) => { onQueryChange(e.target.value); onCategoryChange('all') }}
          placeholder="Поиск блюд, состава, аллергенов…"
          className="search-input"
        />
        {query && (
          <button
            type="button"
            onClick={() => { onQueryChange(''); onCategoryChange('all') }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full text-sm"
            style={{ background: 'var(--surface-3s)', color: 'var(--muted)' }}
          >✕</button>
        )}
      </div>

      {/* Section toggle + view mode */}
      {!query && (
        <div className="flex gap-2 items-center">
          <div className="flex flex-1 gap-1 p-1 rounded-2xl" style={{ background: 'var(--surface-2s)' }}>
            {(['food', 'drinks'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { onSectionChange(s); onCategoryChange('all') }}
                className="flex-1 py-2 rounded-xl text-sm font-bold transition-all duration-200"
                style={section === s
                  ? { background: 'var(--accent)', color: '#0a0806' }
                  : { color: 'var(--muted)' }
                }
              >
                {s === 'food' ? '🍽 Кухня' : '🍷 Бар'}
              </button>
            ))}
          </div>
          {!selectable && (
            <button
              type="button"
              onClick={onViewModeToggle}
              className="w-10 h-10 flex items-center justify-center rounded-xl shrink-0"
              style={{ background: 'var(--surface-2s)', color: 'var(--muted)' }}
            >
              {viewMode === 'grid'
                ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round"/></svg>
                : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
              }
            </button>
          )}
        </div>
      )}

      {/* Category pills */}
      {!query && (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          <button
            type="button"
            onClick={() => onCategoryChange('all')}
            className={`cat-pill shrink-0 ${category === 'all' ? 'cat-pill-active' : 'cat-pill-inactive'}`}
          >
            Все
          </button>
          {visibleCats.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onCategoryChange(cat)}
              className={`cat-pill shrink-0 ${category === cat ? 'cat-pill-active' : 'cat-pill-inactive'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
