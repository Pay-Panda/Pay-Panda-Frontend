import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../state/auth-store';
import api from '../lib/api';
import usePageTransition from '../hooks/usePageTransition';
import useSmoothScroll from '../hooks/useSmoothScroll';
import SidebarTooltip from '../components/SidebarTooltip';
import {
  LayoutDashboard, QrCode, SlidersHorizontal, Palette, BadgeIndianRupee, KeyRound,
  Code2, BookOpen, Link2, History, ReceiptIndianRupee, Settings, Headphones,
  LogOut, Menu, X, Moon, Sun, ChevronLeft, ChevronRight, PlusCircle, Building2,
} from 'lucide-react';
import payLogo from '../assets/logo.png';

const sections = [
  { label: 'Overview', items: [{ to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' }] },
  { label: 'Payments', items: [
    { to: '/payments/create', icon: PlusCircle, label: 'Create payment' },
    { to: '/payments/history', icon: History, label: 'Payment history' },
    { to: '/default-link', icon: Link2, label: 'Default link' },
    { to: '/business-units', icon: Building2, label: 'Sub-businesses' },
    { to: '/subscription-history', icon: ReceiptIndianRupee, label: 'Subscription history' },
  ]},
  { label: 'Gateway setup', items: [
    { to: '/connect', icon: QrCode, label: 'Connect UPI QR' },
    { to: '/payment-options', icon: SlidersHorizontal, label: 'Payment options' },
    { to: '/themes', icon: Palette, label: 'Payment page theme' },
    { to: '/subscription', icon: BadgeIndianRupee, label: 'Subscription' },
  ]},
  { label: 'API setup', items: [
    { to: '/api-keys', icon: KeyRound, label: 'App credentials' },
    { to: '/sdk', icon: Code2, label: 'SDK' },
    { to: '/documentation', icon: BookOpen, label: 'Documentation' },
  ]},
];

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('pay_panda_sidebar_collapsed') === 'true');
  const [theme, setTheme] = useState(() => localStorage.getItem('pay_panda_theme') || 'dark');
  const [setupReady, setSetupReady] = useState(false);
  const [tooltip, setTooltip] = useState(null);
  const { user, logout } = useAuth();
  const location = useLocation();
  const pageRef = useRef(null);
  usePageTransition(pageRef, location.pathname);
  useSmoothScroll();
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('pay_panda_theme', theme);
  }, [theme]);
  useEffect(() => {
    localStorage.setItem('pay_panda_sidebar_collapsed', String(collapsed));
    setTooltip(null);
  }, [collapsed]);
  useEffect(() => { setTooltip(null); }, [location.pathname]);
  useEffect(() => {
    api.get('/connections').then(({ data }) => {
      setSetupReady(data.connections.some(item => item.status === 'ACTIVE'));
    }).catch(() => {});
  }, [location.pathname]);
  const title = sections.flatMap(s => s.items).find(i => location.pathname.startsWith(i.to))?.label || 'Pay-Panda';
  const showTooltip = (event, label) => {
    if (!collapsed) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({ label, top: rect.top + rect.height / 2, left: rect.right + 14 });
  };
  const hideTooltip = () => setTooltip(null);
  return <div className={`shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
    {open && <button className="sidebar-backdrop" aria-label="Close menu" onClick={() => setOpen(false)} />}
    <aside className={`sidebar ${open ? 'is-open' : ''}`}>
      <div className="brand"><img className="brand-mark" src={payLogo} alt="Pay-Panda" /><div className="brand-copy"><strong>Pay-Panda</strong><span>Payments, verified.</span></div><button className="sidebar-toggle" title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={() => setCollapsed(!collapsed)}>{collapsed ? <ChevronRight/> : <ChevronLeft/>}</button><button className="mobile-close" onClick={() => setOpen(false)}><X /></button></div>
      <nav className="nav-scroll">
        {sections.map(section => <div className="nav-section" key={section.label}>
          <p>{section.label}</p>
          {section.items.filter(item => item.to !== '/payments/create' || setupReady).map(({ to, icon: Icon, label }) => <NavLink to={to} key={to} aria-label={label} onClick={() => setOpen(false)} onMouseEnter={event => showTooltip(event, label)} onMouseLeave={hideTooltip} onFocus={event => showTooltip(event, label)} onBlur={hideTooltip} className={({ isActive }) => isActive ? 'active' : ''}>
            <Icon size={18}/><span>{label}</span><ChevronRight className="nav-arrow" size={14}/>
          </NavLink>)}
        </div>)}
      </nav>
      <div className="sidebar-bottom">
        <NavLink to="/settings" aria-label="Settings" onMouseEnter={event => showTooltip(event, 'Settings')} onMouseLeave={hideTooltip} onFocus={event => showTooltip(event, 'Settings')} onBlur={hideTooltip}><Settings size={18}/></NavLink>
        <a href="mailto:support@paypanda.local" aria-label="Support" onMouseEnter={event => showTooltip(event, 'Support')} onMouseLeave={hideTooltip} onFocus={event => showTooltip(event, 'Support')} onBlur={hideTooltip}><Headphones size={18}/></a>
        <button className="logout-btn" onClick={logout} aria-label="Logout" onMouseEnter={event => showTooltip(event, 'Logout')} onMouseLeave={hideTooltip} onFocus={event => showTooltip(event, 'Logout')} onBlur={hideTooltip}><LogOut size={18}/></button>
      </div>
    </aside>
    <SidebarTooltip tooltip={tooltip} />
    <main className="main">
      <header className="topbar">
        <div><button className="menu-button" onClick={() => setOpen(true)}><Menu /></button><p className="eyebrow">Workspace</p><h1>{user?.business?.name || 'Console'}</h1></div>
        <div className="top-actions"><button className="icon-button" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}</button><div className="user-chip"><span>{user?.name?.[0] || 'P'}</span><div><strong>{user?.name}</strong><small>{user?.business?.name}</small></div></div></div>
      </header>
      <div className="page" ref={pageRef}><Outlet /></div>
    </main>
  </div>;
}
