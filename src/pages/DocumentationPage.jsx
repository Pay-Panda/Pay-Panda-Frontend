import { useRef, useState } from 'react';
import { BookOpen } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import useStagger from '../hooks/useStagger';

const sections = [
  { id: 'auth', title: 'Authentication', body: 'Exchange your App ID and App Secret for a short-lived bearer token at POST /api/oauth/token, then send it as an Authorization: Bearer header on every request.', code: 'POST /api/oauth/token\n{\n  "grant_type": "client_credentials",\n  "app_id": "app_xxx",\n  "app_secret": "secret_xxx"\n}' },
  { id: 'create', title: 'Create a payment', body: 'Create a hosted checkout session and amount-specific UPI QR for an order.', code: 'POST /api/v1/payments\n{\n  "order_id": "ORDER-1001",\n  "amount": 499.00\n}' },
  { id: 'status', title: 'Check status', body: 'Poll a payment by order id, or by the public payment id returned in a checkout redirect.', code: 'GET /api/v1/payments/:orderId\nGET /api/v1/payments/id/:paymentId' },
  { id: 'verify', title: 'Verify a payment', body: 'Look up a payment by payment_id or order_id and get a simple verified boolean, useful for server-side confirmation.', code: 'POST /api/v1/payments/verify\n{\n  "order_id": "ORDER-1001"\n}' },
  { id: 'default-link', title: 'Default payment link', body: 'A reusable, amount-optional link for a business, created from the dashboard. Customers open the link, enter their own amount, and pay.', code: 'GET  /api/public/link/:slug\nPOST /api/public/link/:slug/pay\n{\n  "amount": 250\n}' },
  { id: 'webhooks', title: 'Webhooks', body: 'Webhook delivery for payment status changes is planned for a future release.', code: '// Coming soon' },
  { id: 'errors', title: 'Errors', body: 'Validation failures return a 400 with a readable message and a per-field errors array.', code: '{\n  "success": false,\n  "message": "amount: Amount must be positive",\n  "errors": [ /* ... */ ]\n}' },
];

export default function DocumentationPage() {
  const rootRef = useRef(null);
  const [active, setActive] = useState('auth');
  useStagger(rootRef, '.docs-nav li');
  const section = sections.find(item => item.id === active);
  return <div ref={rootRef}>
    <PageHeader eyebrow="API setup" title="Developer documentation" description="OAuth, payment creation, status, webhooks, and integration examples." />
    <section className="panel docs-layout">
      <nav className="docs-nav"><ul>{sections.map(item => <li key={item.id}><button type="button" className={active === item.id ? 'active' : ''} onClick={() => setActive(item.id)}><BookOpen size={14} />{item.title}</button></li>)}</ul></nav>
      <div className="docs-content">
        <h3>{section.title}</h3>
        <p>{section.body}</p>
        <pre><code>{section.code}</code></pre>
      </div>
    </section>
  </div>;
}
