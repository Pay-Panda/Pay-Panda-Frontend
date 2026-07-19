import { useId, useState } from 'react';

const WIDTH = 720;
const HEIGHT = 220;
const PAD_X = 12;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;

export default function TrendChart({ data, emptyMessage = 'No activity in this range.', ariaLabel = 'Payment volume over time' }) {
  const gradientId = useId();
  const [hoverIndex, setHoverIndex] = useState(null);
  if (!data?.length) {
    return <div className="empty-state grid place-items-center px-5 py-12 text-center text-muted"><p>{emptyMessage}</p></div>;
  }
  const values = data.map(d => d.amount);
  const max = Math.max(...values, 1);
  const plotWidth = WIDTH - PAD_X * 2;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const stepX = data.length > 1 ? plotWidth / (data.length - 1) : 0;
  const points = data.map((d, i) => ({
    x: PAD_X + (data.length > 1 ? stepX * i : plotWidth / 2),
    y: PAD_TOP + plotHeight - (d.amount / max) * plotHeight,
    ...d,
  }));
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${PAD_TOP + plotHeight} L${points[0].x.toFixed(1)},${PAD_TOP + plotHeight} Z`;
  const active = hoverIndex !== null ? points[hoverIndex] : null;
  const labelEvery = Math.max(1, Math.ceil(data.length / 6));

  const handleMove = event => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const index = Math.round(ratio * (data.length - 1));
    setHoverIndex(Math.min(data.length - 1, Math.max(0, index)));
  };

  return <div className="admin-chart">
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={ariaLabel}
      onMouseMove={handleMove} onMouseLeave={() => setHoverIndex(null)}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1={PAD_X} y1={PAD_TOP + plotHeight} x2={WIDTH - PAD_X} y2={PAD_TOP + plotHeight} stroke="var(--line)" strokeWidth="1" />
      <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
      <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (i % labelEvery === 0) && <text key={p.day} x={p.x} y={HEIGHT - 8} fontSize="9" textAnchor="middle" fill="var(--muted-2)">{formatDay(p.day)}</text>)}
      {active && <>
        <line x1={active.x} y1={PAD_TOP} x2={active.x} y2={PAD_TOP + plotHeight} stroke="var(--line-strong)" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx={active.x} cy={active.y} r="4" fill="var(--accent)" stroke="var(--panel)" strokeWidth="2" />
      </>}
    </svg>
    {active && <div className="admin-chart-tooltip" style={{ left: `${(active.x / WIDTH) * 100}%` }}>
      <strong>₹{active.amount.toLocaleString('en-IN')}</strong>
      <span>{formatDay(active.day)} · {active.count} payment{active.count === 1 ? '' : 's'}</span>
    </div>}
  </div>;
}

function formatDay(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
