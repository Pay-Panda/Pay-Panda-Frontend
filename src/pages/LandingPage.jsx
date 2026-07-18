import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import {
  ArrowRight, BadgeCheck, KeyRound, QrCode, Globe, ShieldCheck, Timer, Wallet,
  LineChart, Lock, RefreshCw, CheckCircle2, Smartphone,
} from 'lucide-react';
import { useAuth } from '../state/auth-store';
import useSmoothScroll from '../hooks/useSmoothScroll';
import { gsap, REDUCED_MOTION_QUERY, EASE_ENTRANCE } from '../lib/motion';
import payLogo from '../assets/logo.png';

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
  useSmoothScroll();
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

  return <div className="landing" ref={rootRef}>
    <header className="landing-nav">
      <Link className="brand" to="/"><img className="brand-mark" src={payLogo} alt="Pay-Panda" /><strong>Pay-Panda</strong></Link>
      <nav>
        <a href="#features">Features</a>
        <a href="#how-it-works">How it works</a>
        <a href="#security">Security</a>
      </nav>
      <div className="landing-nav-actions">
        {token
          ? <Link className="primary-button compact" to="/dashboard">Go to dashboard<ArrowRight size={16} /></Link>
          : <><Link className="secondary-button" to="/login">Sign in</Link><Link className="primary-button compact" to="/signup">Get started<ArrowRight size={16} /></Link></>}
      </div>
    </header>

    <section className="landing-hero">
      <div className="hero-copy">
        <p className="eyebrow accent">UPI infrastructure for modern teams</p>
        <h1>Payments that confirm themselves.</h1>
        <p className="hero-lede">Connect your BharatPe UPI account once, create payment sessions through a single API or your dashboard, and let Pay-Panda verify every payment against the provider automatically — no manual reconciliation, no shared payment gateway fees.</p>
        <div className="hero-actions">
          <Link className="primary-button" to="/signup">Start free<ArrowRight size={18} /></Link>
          <a className="secondary-button" href="#how-it-works">See how it works</a>
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

    <section className="landing-section" id="features">
      <div className="landing-section-head">
        <p className="eyebrow accent">Everything included</p>
        <h2>Built for teams who accept UPI directly</h2>
        <p>Every payment flows through one system — from QR generation to bank-verified confirmation.</p>
      </div>
      <div className="feature-grid reveal-group">
        {features.map(feature => <article className="feature-card" key={feature.title}>
          <span className="feature-icon"><feature.icon /></span>
          <h3>{feature.title}</h3>
          <p>{feature.text}</p>
        </article>)}
      </div>
    </section>

    <section className="landing-section alt" id="how-it-works">
      <div className="landing-section-head">
        <p className="eyebrow accent">Four steps</p>
        <h2>From connection to confirmed payment</h2>
        <p>No new bank account, no new settlement flow — Pay-Panda sits on top of the BharatPe account you already use.</p>
      </div>
      <ol className="steps-grid reveal-group">
        {steps.map((step, index) => <li className="step-card" key={step.title}>
          <span className="step-number">{String(index + 1).padStart(2, '0')}</span>
          <span className="step-icon"><step.icon /></span>
          <strong>{step.title}</strong>
          <p>{step.text}</p>
        </li>)}
      </ol>
    </section>

    <section className="landing-section" id="security">
      <div className="landing-section-head">
        <p className="eyebrow accent">Security first</p>
        <h2>Your account, your payments, protected</h2>
      </div>
      <div className="security-grid reveal-group">
        {security.map(text => <div className="security-item" key={text}><ShieldCheck size={18} /><p>{text}</p></div>)}
      </div>
    </section>

    <section className="landing-cta reveal-group">
      <Wallet size={30} />
      <h2>Connect your BharatPe account and take your first payment today.</h2>
      <Link className="primary-button" to="/signup">Create your workspace<ArrowRight size={18} /></Link>
      <span className="landing-cta-note"><Timer size={13} />Set up in under two minutes</span>
    </section>

    <footer className="landing-footer">
      <div className="brand"><img className="brand-mark" src={payLogo} alt="Pay-Panda" /><strong>Pay-Panda</strong></div>
      <p>© {new Date().getFullYear()} Pay-Panda. UPI payment verification, not a payment aggregator.</p>
    </footer>
  </div>;
}
