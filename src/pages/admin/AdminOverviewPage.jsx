import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ShieldOff, Users, IndianRupee, RefreshCw } from 'lucide-react';
import adminApi from '../../lib/adminApi';
import PageHeader from '../../components/PageHeader';
import AdminTrendChart from '../../components/admin/AdminTrendChart';
import { useUi } from '../../state/ui-store';
import useStagger from '../../hooks/useStagger';

export default function AdminOverviewPage() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const rootRef = useRef(null);
  const { toast } = useUi();
  useEffect(() => {
    adminApi.get('/admin/insights/overview').then(({ data }) => setOverview(data.overview))
      .catch(() => toast('Could not load platform insights', 'error')).finally(() => setLoading(false));
  }, [toast]);
  useStagger(rootRef, '.metric-card', { dependency: loading });
  const cards = [
    ['Total businesses', loading ? '—' : overview?.businesses.total ?? 0, Building2, 'violet'],
    ['Suspended', loading ? '—' : overview?.businesses.suspended ?? 0, ShieldOff, 'amber'],
    ['Registered users', loading ? '—' : overview?.users ?? 0, Users, 'blue'],
    ['Lifetime collected', loading ? '—' : `₹${(overview?.lifetimePayments.amount || 0).toLocaleString('en-IN')}`, IndianRupee, 'green'],
  ];
  return <div ref={rootRef}>
    <PageHeader eyebrow="Platform" title="Admin overview" description="Growth, activity, and health across every business on Pay-Panda." />
    <section className="metric-grid">{cards.map(([label, value, Icon, tone]) => <article className={`metric-card ${tone}`} key={label}><div className="metric-icon"><Icon/></div><p>{label}</p><strong>{value}</strong></article>)}</section>
    <section className="admin-grid">
      <article className="panel">
        <div className="panel-heading"><div><h3>Successful payment volume</h3><p>Last 30 days, platform-wide.</p></div></div>
        <div className="panel-body">
          {loading ? <div className="empty-cell"><RefreshCw className="spin"/> Loading trend…</div> : <AdminTrendChart data={overview?.trend || []} />}
        </div>
      </article>
      <article className="panel">
        <div className="panel-heading"><div><h3>Plan distribution</h3><p>Businesses grouped by subscription plan.</p></div><Link to="/admin/plans">Manage plans</Link></div>
        <div className="plan-distribution">
          {loading ? <div className="empty-cell">Loading…</div> : overview?.planDistribution.length ? overview.planDistribution.map(row => <div className="plan-distribution-row" key={row.planId || 'none'}><span>{row.planName}</span><strong>{row.count}</strong></div>) : <div className="empty-cell">No businesses yet.</div>}
        </div>
      </article>
    </section>
    <article className="panel">
      <div className="panel-heading"><div><h3>Recently onboarded businesses</h3><p>Latest five sign-ups.</p></div><Link to="/admin/businesses">View all</Link></div>
      <div className="table-wrap"><table><thead><tr><th>Business</th><th>Joined</th><th>Status</th></tr></thead><tbody>
        {loading ? <tr><td colSpan="3" className="empty-cell"><RefreshCw className="spin"/> Loading…</td></tr> : overview?.recentBusinesses.length ? overview.recentBusinesses.map(b => <tr key={b.id}><td><Link to={`/admin/businesses/${b.id}`}><strong>{b.name}</strong></Link></td><td>{new Date(b.createdAt).toLocaleDateString()}</td><td><span className={`status ${b.suspendedAt ? 'status-failed' : 'status-active'}`}><i/>{b.suspendedAt ? 'Suspended' : 'Active'}</span></td></tr>) : <tr><td colSpan="3" className="empty-cell">No businesses yet.</td></tr>}
      </tbody></table></div>
    </article>
  </div>;
}
