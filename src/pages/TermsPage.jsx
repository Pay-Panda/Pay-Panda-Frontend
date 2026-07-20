import { Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import payLogo from '../assets/logo.png';

const sections = [
  {
    title: '1. What Pay-Panda is',
    body: `Pay-Panda is a UPI payment verification and checkout layer. It generates order-specific
UPI QR codes and payment links against a business's own connected BharatPe merchant account,
and verifies incoming payments against that account's real transactions. Pay-Panda is not a
payment aggregator, a bank, or a wallet: it never receives, holds, or moves customer funds.
Every rupee a customer pays goes directly from their UPI app into the business's own bank
account via their own BharatPe/UPI connection — Pay-Panda only observes and confirms that
transfer.`,
  },
  {
    title: '2. No custody of funds, no automated refunds',
    body: `Because Pay-Panda never holds customer money, it has no technical ability to pull a
payment back once it is complete. Refunds are a manual, off-platform action: a business
marks a payment "refund requested" and then "refunded" once it has sent the money back itself
through its own UPI app, recording the reference (UTR) it used. Pay-Panda's refund status is
an audit trail only, not a money-movement guarantee. Customers should confirm receipt of any
refund directly with the business.`,
  },
  {
    title: '3. Businesses are responsible for their own transactions',
    body: `Each business is solely responsible for the goods, services, pricing, fulfillment,
customer service, and any regulatory or tax obligations connected to payments it collects
through Pay-Panda. Disputes about the underlying order (quality, delivery, cancellation
policy, etc.) are between the customer and the business. Pay-Panda's complaint system exists
to route and track these disputes, and to give Pay-Panda visibility into recurring problems —
it does not itself adjudicate, guarantee, or reverse a transaction.`,
  },
  {
    title: '4. Accounts and security',
    body: `You are responsible for keeping your account credentials, API app secrets, and
webhook signing secret confidential. Pay-Panda enforces email OTP on every dashboard sign-in
and encrypts connected provider tokens at rest, but you must not share credentials, and must
revoke and rotate any credential you believe may be compromised immediately from your
dashboard.`,
  },
  {
    title: '5. Fees and subscription',
    body: `Pay-Panda charges a small per-transaction platform fee on successful payments,
according to the tiered schedule shown in your dashboard's Subscription page, which decreases
as your monthly payment volume grows. Fees are billed periodically as a subscription invoice
payable through the platform.`,
  },
  {
    title: '6. Service availability',
    body: `Payment verification depends on connectivity to your chosen UPI provider (currently
BharatPe). Pay-Panda makes reasonable efforts to verify payments promptly but does not
guarantee a specific verification latency, and is not liable for delays or failures caused by
the upstream provider, banking networks, or events outside its control.`,
  },
  {
    title: '7. Changes to these terms',
    body: `These terms may be updated as the product evolves. Continued use of Pay-Panda after
an update constitutes acceptance of the revised terms. Material changes will be reflected here
with an updated effective date.`,
  },
];

export default function TermsPage() {
  return <div className="min-h-screen bg-bg text-text">
    <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-8">
      <Link className="brand flex items-center gap-3" to="/"><img className="brand-mark h-10 w-10 rounded-xl object-contain" src={payLogo} alt="Pay-Panda" /><strong>Pay-Panda</strong></Link>
      <Link className="secondary-button inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-line bg-transparent px-4 text-small font-bold text-text transition hover:border-accent" to="/"><ArrowLeft size={16}/>Back home</Link>
    </header>
    <main className="mx-auto max-w-3xl px-6 pb-24">
      <p className="eyebrow mb-1 text-[var(--font-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)] text-[var(--muted-2)]">Legal</p>
      <h1 className="mt-1 text-[2rem] font-extrabold">Terms &amp; Conditions</h1>
      <p className="mt-2 text-muted">Effective {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      <div className="mt-6 flex gap-3 rounded-2xl border border-amber/25 bg-amber/10 p-4 text-small text-amber">
        <AlertTriangle className="shrink-0" size={18}/>
        <span>This is a working draft describing Pay-Panda's actual product behavior. It has not been reviewed by a lawyer and should be replaced with counsel-reviewed terms before being relied on for legal protection.</span>
      </div>
      <div className="mt-10 space-y-8">
        {sections.map(section => <section key={section.title}>
          <h2 className="text-[1.15rem] font-bold">{section.title}</h2>
          <p className="mt-2 whitespace-pre-line leading-relaxed text-muted">{section.body}</p>
        </section>)}
      </div>
      <p className="mt-12 text-small text-muted">Questions about these terms? Contact your Pay-Panda business's support email, or reach Pay-Panda directly through the dashboard.</p>
    </main>
  </div>;
}
