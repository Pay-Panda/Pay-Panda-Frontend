import { useEffect, useRef, useState } from 'react';
import { IndianRupee, ReceiptIndianRupee, TrendingUp, Percent, RefreshCw } from 'lucide-react';
import api from '../lib/api';
import PageHeader from '../components/PageHeader';
import TrendChart from '../components/charts/TrendChart';
import RankedBars from '../components/charts/RankedBars';
import { useUi } from '../state/ui-store';
import useStagger from '../hooks/useStagger';

const presets = ['Today', 'This week', 'This month', 'This year', 'Custom'];
const statusOrder = ['SUCCESS', 'PENDING', 'FAILED', 'EXPIRED'];

export default function InsightsPage() {
  const { toast } = useUi();
  const [units, setUnits] = useState([]);
  const [unitId, setUnitId] = useState('');
  const [preset, setPreset] = useState('This month');
  const [range, setRange] = useState(() => rangeFor('This month'));
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const rootRef = useRef(null);
  useStagger(rootRef, '.metric-card', { dependency: loading });

  useEffect(() => { api.get('/dashboard/business-units').then(({ data }) => setUnits(data.units)).catch(() => {}); }, []);

  const load = () => {
    setLoading(true);
    api.get('/dashboard/insights', { params: { from: range.from, to: range.to, business_unit_id: unitId || undefined } })
      .then(({ data }) => setInsights(data))
      .catch(() => toast('Could not load insights', 'error')).finally(() => setLoading(false));
  };
  useEffect(load, [range.from, range.to, unitId]); // eslint-disable-line react-hooks/exhaustive-deps

  const choosePreset = value => { setPreset(value); if (value !== 'Custom') setRange(rangeFor(value)); };

  const cards = [
    ['Collected', loading ? '—' : `₹${(insights?.summary.amount || 0).toLocaleString('en-IN')}`, IndianRupee, 'green'],
    ['Successful payments', loading ? '—' : insights?.summary.successCount ?? 0, ReceiptIndianRupee, 'violet'],
    ['Success rate', loading ? '—' : `${Math.round((insights?.summary.successRate || 0) * 100)}%`, Percent, 'blue'],
    ['Average payment', loading ? '—' : `₹${(insights?.summary.avgAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, TrendingUp, 'amber'],
  ];
  const unitBars = (insights?.byUnit || []).map(u => ({ id: u.id ?? '__general__', label: u.name, amount: u.amount, count: u.successCount, successRate: u.successRate }));

  return <div ref={rootRef}>
    <PageHeader eyebrow="Payments" title="Insights" description="Track performance, transactions, and collected amounts across your whole business and each sub-business." />
    <article className="panel">
      <div className="range-filter">
        <div className="preset-tabs">{presets.map(item => <button key={item} className={preset === item ? 'active' : ''} onClick={() => choosePreset(item)}>{item}</button>)}</div>
        <select value={unitId} onChange={e => setUnitId(e.target.value)}><option value="">All sub-businesses</option>{units.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select>
        <div className="date-inputs"><label>From<input type="date" value={range.from} onChange={e => { setPreset('Custom'); setRange({ ...range, from: e.target.value }); }}/></label><label>To<input type="date" value={range.to} onChange={e => { setPreset('Custom'); setRange({ ...range, to: e.target.value }); }}/></label></div>
      </div>
    </article>
    <section className="metric-grid">{cards.map(([label, value, Icon, tone]) => <article className={`metric-card ${tone}`} key={label}><div className="metric-icon"><Icon/></div><p>{label}</p><strong>{value}</strong></article>)}</section>
    <section className="admin-grid">
      <article className="panel">
        <div className="panel-heading"><div><h3>Collection trend</h3><p>{insights ? `${new Date(insights.range.from).toLocaleDateString()} – ${new Date(insights.range.to).toLocaleDateString()}` : 'Selected range'}.</p></div></div>
        <div className="panel-body">{loading ? <div className="empty-cell"><RefreshCw className="spin"/> Loading trend…</div> : <TrendChart data={insights?.trend || []} ariaLabel="Successful payment volume over the selected range" emptyMessage="No payments in this range yet." />}</div>
      </article>
      <article className="panel">
        <div className="panel-heading"><div><h3>Payment status</h3><p>All sessions in the selected range.</p></div></div>
        <div className="admin-status-stack">
          {statusOrder.map(status => <div key={status}><span className={`status status-${status.toLowerCase()}`}><i/>{status}</span><strong>{insights?.byStatus?.[status]?.count || 0}</strong><small>₹{Number(insights?.byStatus?.[status]?.amount || 0).toLocaleString('en-IN')}</small></div>)}
        </div>
      </article>
    </section>
    {!unitId && <article className="panel">
      <div className="panel-heading"><div><h3>Sub-business performance</h3><p>Compare collected amount and success rate across every sub-business, including unassigned payments.</p></div></div>
      {loading ? <div className="empty-cell"><RefreshCw className="spin"/> Loading…</div> : <RankedBars items={unitBars} emptyMessage="No successful payments in this range yet." />}
    </article>}
  </div>;
}

function rangeFor(preset) {
  const now = new Date(); let start = new Date(now);
  if (preset === 'Today') start.setHours(0, 0, 0, 0);
  if (preset === 'This week') { const day = (now.getDay() + 6) % 7; start.setDate(now.getDate() - day); start.setHours(0, 0, 0, 0); }
  if (preset === 'This month') start = new Date(now.getFullYear(), now.getMonth(), 1);
  if (preset === 'This year') start = new Date(now.getFullYear(), 0, 1);
  return { from: localDate(start), to: localDate(now) };
}
function localDate(value) { const offset = value.getTimezoneOffset() * 60000; return new Date(value - offset).toISOString().slice(0, 10); }
