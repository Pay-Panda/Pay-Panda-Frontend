const MAX_DIRECT_SLOTS = 4;

/** Horizontal bar comparison (sub-businesses, top businesses, etc). Colors are assigned by a
 * stable identity order (sorted by id), never by the current amount ranking, so re-sorting or
 * filtering never repaints the bars that stay on screen. Direct labels replace a legend. */
export default function RankedBars({ items, unit = '₹', emptyMessage = 'No data in this range yet.' }) {
  if (!items?.length) return <div className="empty-state"><p>{emptyMessage}</p></div>;
  const stableOrder = [...items].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const colorIndexById = new Map(stableOrder.map((item, i) => [item.id, i]));
  const sorted = [...items].sort((a, b) => b.amount - a.amount);
  const max = Math.max(...items.map(i => i.amount), 1);

  return <div className="ranked-bars">
    {sorted.map(item => {
      const idx = colorIndexById.get(item.id);
      const colorClass = idx < MAX_DIRECT_SLOTS ? `series-${idx + 1}` : 'series-other';
      const pct = Math.max(2, (item.amount / max) * 100);
      return <div className="ranked-bar-row" key={item.id ?? 'none'}>
        <div className="ranked-bar-label">
          <span className={`series-dot ${colorClass}`} />
          <strong>{item.label}</strong>
          {item.successRate != null && <small>{Math.round(item.successRate * 100)}% success · {item.count} payment{item.count === 1 ? '' : 's'}</small>}
        </div>
        <div className="ranked-bar-track"><div className={`ranked-bar-fill ${colorClass}`} style={{ width: `${pct}%` }} /></div>
        <div className="ranked-bar-value">{unit}{item.amount.toLocaleString('en-IN')}</div>
      </div>;
    })}
  </div>;
}
