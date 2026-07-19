import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ShieldOff, Users, IndianRupee, RefreshCw } from 'lucide-react';
import adminApi from '../../lib/adminApi';
import PageHeader from '../../components/PageHeader';
import TrendChart from '../../components/charts/TrendChart';
import RankedBars from '../../components/charts/RankedBars';
import { useUi } from '../../state/ui-store';
import useStagger from '../../hooks/useStagger';

const presets = ['Today', 'This week', 'This month', 'This year', 'Custom'];

export default function AdminOverviewPage() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState('This month');
  const [range, setRange] = useState(() => rangeFor('This month'));
  const rootRef = useRef(null);
  const { toast } = useUi();

  const load = () => {
    setLoading(true);
    adminApi.get('/admin/insights/overview', { params: { from: range.from, to: range.to } }).then(({ data }) => setOverview(data.overview))
      .catch(() => toast('Could not load platform insights', 'error')).finally(() => setLoading(false));
  };
  useEffect(load, [range.from, range.to]); // eslint-disable-line react-hooks/exhaustive-deps
  useStagger(rootRef, '.metric-card', { dependency: loading });

  const choosePreset = value => { setPreset(value); if (value !== 'Custom') setRange(rangeFor(value)); };

  const cards = [
    ['Total businesses', loading ? '—' : overview?.businesses.total ?? 0, Building2, 'violet'],
    ['Suspended', loading ? '—' : overview?.businesses.suspended ?? 0, ShieldOff, 'amber'],
    ['Registered users', loading ? '—' : overview?.users ?? 0, Users, 'blue'],
    ['Collected in range', loading ? '—' : `₹${(overview?.rangePayments.amount || 0).toLocaleString('en-IN')}`, IndianRupee, 'green'],
  ];
  const topBusinessBars = (overview?.topBusinesses || []).map(b => ({ id: b.id, label: b.label, amount: b.amount, count: b.count, successRate: null }));

  return <div ref={rootRef}>
    <PageHeader eyebrow="Platform" title="Admin overview" description="Growth, activity, and health across every business on Pay-Panda." />
    <section className="metric-grid grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">{cards.map(([label, value, Icon, tone]) => <article className={`metric-card relative overflow-hidden rounded-[var(--radius-lg)] border border-line bg-panel p-5 shadow-panel ${tone}`} key={label}><div className="metric-icon grid h-10 w-10 place-items-center rounded-2xl bg-accent/10 text-accent-contrast"><Icon/></div><p>{label}</p><strong>{value}</strong></article>)}</section>
    <article className="panel overflow-hidden rounded-[var(--radius-lg)] border border-line bg-panel shadow-panel">
      <div className="range-filter">
        <div className="preset-tabs">{presets.map(item => <button key={item} className={preset === item ? 'active' : ''} onClick={() => choosePreset(item)}>{item}</button>)}</div>
        <div className="date-inputs"><label>From<input type="date" value={range.from} onChange={e => { setPreset('Custom'); setRange({ ...range, from: e.target.value }); }}/></label><label>To<input type="date" value={range.to} onChange={e => { setPreset('Custom'); setRange({ ...range, to: e.target.value }); }}/></label></div>
      </div>
    </article>
    <section className="admin-grid grid grid-cols-2 gap-5 max-lg:grid-cols-1">
      <article className="panel overflow-hidden rounded-[var(--radius-lg)] border border-line bg-panel shadow-panel">
        <div className="panel-heading flex items-center justify-between gap-4 border-b border-line px-6 py-5"><div><h3>Successful payment volume</h3><p>{overview ? `${new Date(overview.range.from).toLocaleDateString()} – ${new Date(overview.range.to).toLocaleDateString()}` : 'Selected range'}, platform-wide.</p></div></div>
        <div className="panel-body p-6">
          {loading ? <div className="empty-cell px-5 py-12 text-center text-muted"><RefreshCw className="spin animate-spin"/> Loading trend…</div> : <TrendChart data={overview?.trend || []} ariaLabel="Platform-wide successful payment volume" emptyMessage="No payment activity in this range." />}
        </div>
      </article>
      <article className="panel overflow-hidden rounded-[var(--radius-lg)] border border-line bg-panel shadow-panel">
        <div className="panel-heading flex items-center justify-between gap-4 border-b border-line px-6 py-5"><div><h3>Plan distribution</h3><p>Businesses grouped by subscription plan.</p></div><Link to="/admin/plans">Manage plans</Link></div>
        <div className="plan-distribution">
          {loading ? <div className="empty-cell px-5 py-12 text-center text-muted">Loading…</div> : overview?.planDistribution.length ? overview.planDistribution.map(row => <div className="plan-distribution-row" key={row.planId || 'none'}><span>{row.planName}</span><strong>{row.count}</strong></div>) : <div className="empty-cell px-5 py-12 text-center text-muted">No businesses yet.</div>}
        </div>
      </article>
    </section>
    <article className="panel overflow-hidden rounded-[var(--radius-lg)] border border-line bg-panel shadow-panel">
      <div className="panel-heading flex items-center justify-between gap-4 border-b border-line px-6 py-5"><div><h3>Top businesses by volume</h3><p>Ranked by successful payment amount in the selected range.</p></div></div>
      {loading ? <div className="empty-cell px-5 py-12 text-center text-muted"><RefreshCw className="spin animate-spin"/> Loading…</div> : <RankedBars items={topBusinessBars} emptyMessage="No successful payments in this range yet." />}
    </article>
    <article className="panel overflow-hidden rounded-[var(--radius-lg)] border border-line bg-panel shadow-panel">
      <div className="panel-heading flex items-center justify-between gap-4 border-b border-line px-6 py-5"><div><h3>Recently onboarded businesses</h3><p>Latest five sign-ups.</p></div><Link to="/admin/businesses">View all</Link></div>
      <div className="table-wrap w-full overflow-auto"><table><thead><tr><th>Business</th><th>Joined</th><th>Status</th></tr></thead><tbody>
        {loading ? <tr><td colSpan="3" className="empty-cell px-5 py-12 text-center text-muted"><RefreshCw className="spin animate-spin"/> Loading…</td></tr> : overview?.recentBusinesses.length ? overview.recentBusinesses.map(b => <tr key={b.id}><td><Link to={`/admin/businesses/${b.id}`}><strong>{b.name}</strong></Link></td><td>{new Date(b.createdAt).toLocaleDateString()}</td><td><span className={`status inline-flex items-center gap-1.5 rounded-full bg-text/5 px-2 py-1 text-micro font-extrabold uppercase tracking-wide ${b.suspendedAt ? 'status-failed' : 'status-active'}`}><i/>{b.suspendedAt ? 'Suspended' : 'Active'}</span></td></tr>) : <tr><td colSpan="3" className="empty-cell px-5 py-12 text-center text-muted">No businesses yet.</td></tr>}
      </tbody></table></div>
    </article>
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
