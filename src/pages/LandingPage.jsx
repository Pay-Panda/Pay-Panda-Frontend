import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import {
  ArrowRight, BadgeCheck, KeyRound, QrCode, Globe, ShieldCheck, Timer, Wallet,
  LineChart, Lock, RefreshCw, CheckCircle2, Smartphone, Check,
} from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../state/auth-store';
import useSmoothScroll from '../hooks/useSmoothScroll';
import { gsap, REDUCED_MOTION_QUERY, EASE_ENTRANCE } from '../lib/motion';
import payLogo from '../assets/logo.png';
import HeroGeometric from '../components/ui/HeroGeometric';

const features = [
  { icon: KeyRound, title: 'OAuth-secured payment API', text: 'Server-to-server integration with client-credential app_id / app_secret pairs and short-lived bearer tokens — no long-lived keys sitting in your code.' },
  { icon: QrCode, title: 'BharatPe QR, connected once', text: 'Verify your registered mobile and merchant, then Pay-Panda imports and decodes your official UPI QR so every order gets an amount-specific code automatically.' },
  { icon: Globe, title: 'Hosted, branded checkout', text: 'Every payment gets its own secure checkout page and QR, with a live countdown and automatic redirect back to your site on success.' },
  { icon: RefreshCw, title: 'Verification that respects the provider', text: 'No constant background polling. Pay-Panda checks BharatPe only while a customer is actively on checkout, plus a 30-minute reconciliation sweep for anything missed.' },
  { icon: LineChart, title: 'Dashboard, metrics and history', text: 'Track collections, pending amounts and connection health at a glance, then search and filter the full payment ledger by status, date or payer.' },
  { icon: Lock, title: 'Encrypted by default', text: 'BharatPe session tokens are encrypted at rest with AES-256-GCM. Passwords and provider tokens are never written to logs, ever.' },
];

const steps = [
  { icon: QrCode, title: 'Connect your BharatPe account', text: 'Verify your registered mobile and import your merchant QR once. Pay-Panda decodes it to build the base UPI intent.' },
  { icon: KeyRound, title: 'Create app credentials', text: 'Generate an App ID and one-time App Secret, then exchange them for a bearer token from your backend.' },
  { icon: Smartphone, title: 'Create a payment', text: 'Call the payments API (or use the dashboard) with an order id and amount — get back a hosted checkout URL and QR.' },
  { icon: BadgeCheck, title: 'Get verified automatically', text: 'Your customer pays by scanning the QR or tapping a UPI app; Pay-Panda confirms the match and your order updates in real time.' },
];

const security = [
  'Never collects or stores a BharatPe password or OTP — only an encrypted session token.',
  'Dashboard sessions expire after 30 minutes; OAuth access tokens expire after 15. No long-lived refresh tokens are issued.',
  'Every dashboard sign-in requires a mandatory one-time email code, in addition to your password.',
  'Provider access is isolated behind one module, since it depends on an unofficial BharatPe surface — never exposed as a public contract.',
];

export default function LandingPage() {
  const { token } = useAuth();
  const rootRef = useRef(null);
  const [plans, setPlans] = useState([]);
  useSmoothScroll();
  useEffect(() => { api.get('/public/plans').then(({ data }) => setPlans(data.plans)).catch(() => {}); }, []);
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(REDUCED_MOTION_QUERY, () => {
      gsap.from('.hero-copy > *', { autoAlpha: 0, y: 22, duration: .6, ease: EASE_ENTRANCE, stagger: .08 });
      gsap.from('.hero-preview', { autoAlpha: 0, y: 30, scale: .97, duration: .7, ease: EASE_ENTRANCE, delay: .15 });
      gsap.utils.toArray('.reveal-group').forEach(group => {
        gsap.from(group.children, {
          autoAlpha: 0, y: 24, duration: .5, ease: EASE_ENTRANCE, stagger: .08,
          scrollTrigger: { trigger: group, start: 'top 82%' },
        });
      });
    });
    return () => mm.revert();
  }, { scope: rootRef, dependencies: [] });

  return <div className="landing min-h-screen overflow-hidden bg-bg text-text" data-theme="light" ref={rootRef}>
    <HeroGeometric className="hero-background-canvas" color1="#0044ff" color2="#ffffff" bgColor="#ffffff" speed={1.5} />
    <header className="landing-nav landing-content relative z-10 mx-auto max-w-6xl px-6">
      <Link className="brand flex items-center gap-3" to="/"><img className="brand-mark h-10 w-10 rounded-xl object-contain" src={payLogo} alt="Pay-Panda" /><strong>Pay-Panda</strong></Link>
      <nav>
        <a href="#features">Features</a>
        <a href="#how-it-works">How it works</a>
        {plans.length > 0 && <a href="#pricing">Pricing</a>}
        <a href="#security">Security</a>
      </nav>
      <div className="landing-nav-actions">
        {token
          ? <Link className="primary-button inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border-0 bg-gradient-to-br from-violet-600 to-indigo-500 px-4 font-bold text-white shadow-[var(--shadow-glow-accent)] transition disabled:cursor-not-allowed disabled:opacity-60 compact min-h-10 px-3 text-small" to="/dashboard">Go to dashboard<ArrowRight size={16} /></Link>
          : <><Link className="secondary-button inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-line bg-transparent px-4 text-small font-bold text-text transition hover:border-accent" to="/login">Sign in</Link><Link className="primary-button inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border-0 bg-gradient-to-br from-violet-600 to-indigo-500 px-4 font-bold text-white shadow-[var(--shadow-glow-accent)] transition disabled:cursor-not-allowed disabled:opacity-60 compact min-h-10 px-3 text-small" to="/signup">Get started<ArrowRight size={16} /></Link></>}
      </div>
    </header>

    <section className="landing-hero landing-content relative z-10 mx-auto max-w-6xl px-6">
      <div className="hero-copy">
        <p className="eyebrow mb-1 text-[var(--font-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)] text-[var(--muted-2)] accent text-accent-contrast">UPI infrastructure for modern teams</p>
        <h1>Payments that confirm themselves.</h1>
        <p className="hero-lede">Connect your BharatPe UPI account once, create payment sessions through a single API or your dashboard, and let Pay-Panda verify every payment against the provider automatically — no manual reconciliation, no shared payment gateway fees.</p>
        <div className="hero-actions">
          <Link className="primary-button inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border-0 bg-gradient-to-br from-violet-600 to-indigo-500 px-4 font-bold text-white shadow-[var(--shadow-glow-accent)] transition disabled:cursor-not-allowed disabled:opacity-60" to="/signup">Start free<ArrowRight size={18} /></Link>
          <a className="secondary-button inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-line bg-transparent px-4 text-small font-bold text-text transition hover:border-accent" href="#how-it-works">See how it works</a>
        </div>
        <ul className="hero-trust">
          <li><CheckCircle2 size={15} />No shared settlement</li>
          <li><CheckCircle2 size={15} />Your own BharatPe account</li>
          <li><CheckCircle2 size={15} />Encrypted token storage</li>
        </ul>
      </div>
      <div className="hero-preview">
        <div className="hero-card">
          <div className="hero-card-head"><span>P</span><div><small>Paying</small><strong>Riverside Coffee Co.</strong></div><em>₹499.00</em></div>
          <div className="hero-card-qr" />
          <div className="hero-card-status"><i />Waiting for payment<b>04:32</b></div>
        </div>
        <div className="hero-orb one" /><div className="hero-orb two" />
      </div>
    </section>

    <section className="landing-section relative mx-auto max-w-6xl px-6 py-20 landing-content relative z-10 mx-auto max-w-6xl px-6" id="features">
      <div className="landing-section-head mx-auto mb-10 max-w-2xl text-center">
        <p className="eyebrow mb-1 text-[var(--font-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)] text-[var(--muted-2)] accent text-accent-contrast">Everything included</p>
        <h2>Built for teams who accept UPI directly</h2>
        <p>Every payment flows through one system — from QR generation to bank-verified confirmation.</p>
      </div>
      <div className="feature-grid grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5 reveal-group">
        {features.map(feature => <article className="feature-card rounded-3xl border border-line bg-panel/80 p-6 shadow-panel backdrop-blur" key={feature.title}>
          <span className="feature-icon"><feature.icon /></span>
          <h3>{feature.title}</h3>
          <p>{feature.text}</p>
        </article>)}
      </div>
    </section>

    <section className="landing-section relative mx-auto max-w-6xl px-6 py-20 alt landing-content relative z-10 mx-auto max-w-6xl px-6" id="how-it-works">
      <div className="landing-section-head mx-auto mb-10 max-w-2xl text-center">
        <p className="eyebrow mb-1 text-[var(--font-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)] text-[var(--muted-2)] accent text-accent-contrast">Four steps</p>
        <h2>From connection to confirmed payment</h2>
        <p>No new bank account, no new settlement flow — Pay-Panda sits on top of the BharatPe account you already use.</p>
      </div>
      <ol className="steps-grid grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5 reveal-group">
        {steps.map((step, index) => <li className="step-card relative rounded-3xl border border-line bg-panel p-6 shadow-panel" key={step.title}>
          <span className="step-number">{String(index + 1).padStart(2, '0')}</span>
          <span className="step-icon"><step.icon /></span>
          <strong>{step.title}</strong>
          <p>{step.text}</p>
        </li>)}
      </ol>
    </section>

    {plans.length > 0 && <section className="landing-section relative mx-auto max-w-6xl px-6 py-20 alt landing-content relative z-10 mx-auto max-w-6xl px-6" id="pricing">
      <div className="landing-section-head mx-auto mb-10 max-w-2xl text-center">
        <p className="eyebrow mb-1 text-[var(--font-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)] text-[var(--muted-2)] accent text-accent-contrast">Simple pricing</p>
        <h2>Pick the plan that matches your volume</h2>
        <p>No shared settlement fees — just a monthly plan for your payment volume. Upgrade any time from your dashboard.</p>
      </div>
      <div className="pricing-grid grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-5 reveal-group">
        {plans.map(plan => <article className="panel overflow-hidden rounded-[var(--radius-lg)] border border-line bg-panel shadow-panel pricing-tier" key={plan.id}>
          <h3>{plan.name}</h3>
          <div className="pricing-amount"><strong>₹{plan.price.toLocaleString('en-IN')}</strong><span>/month</span></div>
          <p className="pricing-limit">{plan.monthlyPaymentLimit ? `${plan.monthlyPaymentLimit.toLocaleString('en-IN')} payments / month` : 'Unlimited payments'}</p>
          {Array.isArray(plan.features) && plan.features.length > 0 && <ul className="pricing-features">
            {plan.features.map(feature => <li key={feature}><Check size={14} />{feature}</li>)}
          </ul>}
          <Link className="primary-button inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border-0 bg-gradient-to-br from-violet-600 to-indigo-500 px-4 font-bold text-white shadow-[var(--shadow-glow-accent)] transition disabled:cursor-not-allowed disabled:opacity-60" to="/signup">Get started<ArrowRight size={16}/></Link>
        </article>)}
      </div>
    </section>}

    <section className="landing-section relative mx-auto max-w-6xl px-6 py-20 landing-content relative z-10 mx-auto max-w-6xl px-6" id="security">
      <div className="landing-section-head mx-auto mb-10 max-w-2xl text-center">
        <p className="eyebrow mb-1 text-[var(--font-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)] text-[var(--muted-2)] accent text-accent-contrast">Security first</p>
        <h2>Your account, your payments, protected</h2>
      </div>
      <div className="security-grid reveal-group">
        {security.map(text => <div className="security-item" key={text}><ShieldCheck size={18} /><p>{text}</p></div>)}
      </div>
    </section>

    <section className="landing-cta landing-content relative z-10 mx-auto max-w-6xl px-6 reveal-group">
      <Wallet size={30} />
      <h2>Connect your BharatPe account and take your first payment today.</h2>
      <Link className="primary-button inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border-0 bg-gradient-to-br from-violet-600 to-indigo-500 px-4 font-bold text-white shadow-[var(--shadow-glow-accent)] transition disabled:cursor-not-allowed disabled:opacity-60" to="/signup">Create your workspace<ArrowRight size={18} /></Link>
      <span className="landing-cta-note"><Timer size={13} />Set up in under two minutes</span>
    </section>

    <footer className="landing-footer landing-content relative z-10 mx-auto max-w-6xl px-6">
      <div className="brand flex items-center gap-3"><img className="brand-mark h-10 w-10 rounded-xl object-contain" src={payLogo} alt="Pay-Panda" /><strong>Pay-Panda</strong></div>
      <p>© {new Date().getFullYear()} Pay-Panda. UPI payment verification, not a payment aggregator.</p>
      <Link to="/terms">Terms &amp; Conditions</Link>
    </footer>
  </div>;
}
