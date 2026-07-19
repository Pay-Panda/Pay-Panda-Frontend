import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Gift, IndianRupee, ReceiptIndianRupee, RefreshCw, ShieldCheck } from 'lucide-react';
import api from '../lib/api';
import PageHeader from '../components/PageHeader';
import { useUi } from '../state/ui-store';
import useStagger from '../hooks/useStagger';

export default function SubscriptionPage() {
  const rootRef = useRef(null);
  const { toast } = useUi();
  const [usage, setUsage] = useState(null);
  const [feeTiers, setFeeTiers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trialBusy, setTrialBusy] = useState(false);
  useStagger(rootRef, '.pricing-tier, .metric-card', { dependency: loading });

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/dashboard/subscription'), api.get('/dashboard/plans')])
      .then(([sub, plansRes]) => { setUsage(sub.data.usage); setFeeTiers(sub.data.feeTiers); setPlans(plansRes.data.plans); })
      .catch(() => toast('Could not load subscription details', 'error')).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const activateTrial = async () => {
    setTrialBusy(true);
    try {
      const { data } = await api.post('/dashboard/subscription/trial/activate');
      setUsage(data.usage);
      toast('Free trial activated: 14 days and 100 payments are now free', 'success');
    } catch (err) { toast(err.response?.data?.message || 'Could not activate free trial', 'error'); }
    finally { setTrialBusy(false); }
  };

  if (loading) return <div className="empty-cell px-5 py-12 text-center text-muted"><RefreshCw className="spin animate-spin"/> Loading subscription…</div>;

  const limit = usage.monthlyPaymentLimit;
  const usedPct = limit ? Math.min(100, Math.round((usage.paymentCount / limit) * 100)) : 0;
  const currentTier = feeTiers.find(t => usage.paymentCount + 1 <= t.upTo) || feeTiers[feeTiers.length - 1];
  const trial = usage.trial || {};
  const displayFee = trial.active ? 0 : currentTier.feeAmount;

  return <div ref={rootRef}>
    <PageHeader eyebrow="Billing" title="Subscription and usage" description="Pay-Panda charges a small per-payment fee that decreases as your volume grows — no flat monthly subscription." action={<Link className="secondary-button inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-line bg-transparent px-4 text-small font-bold text-text transition hover:border-accent" to="/subscription-history">View invoices</Link>} />

    <section className={`panel overflow-hidden rounded-[var(--radius-lg)] border border-line bg-panel shadow-panel trial-panel ${trial.active ? 'active' : trial.activated ? 'ended' : ''}`}>
      <div className="trial-copy">
        <span className="trial-icon">{trial.active ? <ShieldCheck/> : <Gift/>}</span>
        <div>
          <p className="eyebrow mb-1 text-[var(--font-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)] text-[var(--muted-2)] accent text-accent-contrast">{trial.active ? 'Free trial active' : trial.activated ? 'Free trial used' : 'Starter free trial'}</p>
          <h3>{trial.active ? 'Your first Pay-Panda payments are free' : trial.activated ? 'Your free trial has already been activated' : 'Activate 14 days free + 100 free payments'}</h3>
          <p>{trial.active ? `${trial.remainingPayments} free payments remaining until ${new Date(trial.endsAt).toLocaleString()}. Fees are not counted for free trial payments.` : trial.activated ? `Activated on ${new Date(trial.activatedAt).toLocaleDateString()}. Normal per-payment billing now applies after the free limit or expiry.` : 'The trial starts only when you activate it. Signup alone will not consume the trial period.'}</p>
        </div>
      </div>
      <div className="trial-actions">
        <strong>{trial.active ? `${trial.freePaymentCount}/${trial.freePaymentLimit}` : trial.activated ? `${trial.freePaymentCount || 0} free payments used` : '100 free payments'}</strong>
        {!trial.activated && <button className="primary-button inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border-0 bg-gradient-to-br from-violet-600 to-indigo-500 px-4 font-bold text-white shadow-[var(--shadow-glow-accent)] transition disabled:cursor-not-allowed disabled:opacity-60 compact min-h-10 px-3 text-small" disabled={trialBusy} onClick={activateTrial}>{trialBusy ? <RefreshCw className="spin animate-spin"/> : <Gift/>}{trialBusy ? 'Activating…' : 'Activate free trial'}</button>}
      </div>
    </section>

    <section className="metric-grid grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
      <article className="metric-card relative overflow-hidden rounded-[var(--radius-lg)] border border-line bg-panel p-5 shadow-panel violet"><p>Current plan</p><strong>{usage.plan?.name || 'No plan assigned'}</strong></article>
      <article className="metric-card relative overflow-hidden rounded-[var(--radius-lg)] border border-line bg-panel p-5 shadow-panel blue"><p>Payments this month</p><strong>{usage.paymentCount}{limit ? ` / ${limit}` : ''}</strong></article>
      <article className="metric-card relative overflow-hidden rounded-[var(--radius-lg)] border border-line bg-panel p-5 shadow-panel amber"><p>Current fee per payment</p><strong>₹{displayFee.toFixed(2)}</strong><span>{trial.active ? 'Trial payment fee' : 'Billable payment fee'}</span></article>
      <article className="metric-card relative overflow-hidden rounded-[var(--radius-lg)] border border-line bg-panel p-5 shadow-panel green"><p>Accrued fee this month</p><strong>₹{usage.accruedFeeAmount.toFixed(2)}</strong></article>
    </section>

    <section className="panel overflow-hidden rounded-[var(--radius-lg)] border border-line bg-panel shadow-panel usage-panel">
      <div className="panel-heading flex items-center justify-between gap-4 border-b border-line px-6 py-5"><div><h3>This month's usage</h3><p>Successful payments created against your plan's monthly limit.</p></div></div>
      <div className="usage-meter">
        <div className="strength-track h-1.5 overflow-hidden rounded-full bg-line"><i className={limit ? `strength-${usedPct >= 90 ? 4 : usedPct >= 60 ? 3 : usedPct >= 30 ? 2 : 1}` : 'strength-2'} style={{ width: `${limit ? usedPct : 100}%` }} /></div>
        <div className="usage-meter-labels"><span>{usage.paymentCount.toLocaleString('en-IN')} payments used</span><small>{trial.active ? `${trial.remainingPayments} trial payments left` : limit ? `${limit.toLocaleString('en-IN')} / month limit` : 'No limit on current plan'}</small></div>
      </div>
    </section>

    <section className="admin-grid grid grid-cols-2 gap-5 max-lg:grid-cols-1 subscription-detail-grid">
      <article className="panel overflow-hidden rounded-[var(--radius-lg)] border border-line bg-panel shadow-panel">
        <div className="panel-heading flex items-center justify-between gap-4 border-b border-line px-6 py-5"><div><h3>Per-payment fee schedule</h3><p>The fee steps down automatically as your monthly volume grows.</p></div></div>
        <div className="table-wrap w-full overflow-auto"><table><thead><tr><th>Payments this month</th><th>Fee per payment</th></tr></thead><tbody>
          {feeTiers.map((tier, index) => {
            const lower = index === 0 ? 1 : feeTiers[index - 1].upTo + 1;
            const active = currentTier === tier;
            return <tr key={tier.upTo} style={active ? { background: 'var(--accent-soft)' } : undefined}>
              <td>{lower}{Number.isFinite(tier.upTo) ? `–${tier.upTo}` : '+'}</td>
              <td><strong>₹{tier.feeAmount.toFixed(2)}</strong>{active && !trial.active && <span className="status inline-flex items-center gap-1.5 rounded-full bg-text/5 px-2 py-1 text-micro font-extrabold uppercase tracking-wide status-active bg-green/10 text-green" style={{ marginLeft: 8 }}><i/>Current</span>}{active && trial.active && <span className="status inline-flex items-center gap-1.5 rounded-full bg-text/5 px-2 py-1 text-micro font-extrabold uppercase tracking-wide status-pending bg-amber/10 text-amber" style={{ marginLeft: 8 }}><i/>After trial</span>}</td>
            </tr>;
          })}
        </tbody></table></div>
      </article>
      <aside className="panel overflow-hidden rounded-[var(--radius-lg)] border border-line bg-panel shadow-panel">
        <div className="panel-heading flex items-center justify-between gap-4 border-b border-line px-6 py-5"><div><h3>How billing works</h3></div></div>
        <div className="billing-explainer">
          <p><ReceiptIndianRupee size={14}/>Every successful billable payment accrues a small platform fee based on how many billable payments you've processed so far this month. Trial payments have ₹0 fee.</p>
          <p><IndianRupee size={14}/>At the end of each month, Pay-Panda generates one invoice for the total accrued fee, payable via UPI from your <Link to="/subscription-history">subscription history</Link> page.</p>
        </div>
      </aside>
    </section>

    {plans.length > 0 && <section className="pricing-grid grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-5">
      {plans.map(plan => <article className={`panel overflow-hidden rounded-[var(--radius-lg)] border border-line bg-panel shadow-panel pricing-tier ${usage.plan?.id === plan.id ? 'current' : ''}`} key={plan.id}>
        {usage.plan?.id === plan.id && <span className="pricing-badge">Current plan</span>}
        <h3>{plan.name}</h3>
        <div className="pricing-amount"><strong>{plan.monthlyPaymentLimit ? plan.monthlyPaymentLimit.toLocaleString('en-IN') : 'Unlimited'}</strong><span>payments / mo</span></div>
        <ul className="pricing-features">{(plan.features || []).map(feature => <li key={feature}><Check size={14} />{feature}</li>)}</ul>
      </article>)}
    </section>}
  </div>;
}
