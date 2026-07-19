import { useRef, useState } from 'react';
import { BookOpen, CheckCircle2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import useStagger from '../hooks/useStagger';

const API_BASE = 'https://metatronhost.in/pay-panda/api';

const sections = [
  {
    id: 'overview',
    title: 'Integration flow',
    body: 'Your backend creates a Pay-Panda checkout, sends the checkout_url to your customer, receives redirect params after payment, then verifies the payment again from your server using OAuth.',
    code: `1. Create App ID / App Secret from Pay-Panda dashboard
2. Your backend calls POST ${API_BASE}/oauth/token
3. Your backend calls POST ${API_BASE}/v1/payments
4. Send payment.checkout_url to your customer
5. Customer pays on Pay-Panda hosted checkout
6. Pay-Panda redirects to your redirect_url with payment_id/order_id/status
7. Your backend calls POST ${API_BASE}/v1/payments/verify
8. Mark order paid only if verified=true and status=SUCCESS`,
  },
  {
    id: 'oauth',
    title: '1. Get OAuth access token',
    body: 'App Secret must stay only on your backend. Never expose it in frontend JavaScript, mobile apps, or browser code. Access tokens are short-lived; request a fresh token when needed.',
    code: `POST ${API_BASE}/oauth/token
Content-Type: application/json

{
  "grant_type": "client_credentials",
  "app_id": "app_xxxxxxxxxxxxxxx",
  "app_secret": "secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}

Response 200
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 900
}`,
  },
  {
    id: 'headers',
    title: '2. Required headers',
    body: 'All /v1 API calls require the OAuth access token in the Authorization header.',
    code: `Authorization: Bearer <access_token>
Content-Type: application/json
Accept: application/json`,
  },
  {
    id: 'create',
    title: '3. Create payment checkout',
    body: 'Create one payment session for one order. Pay-Panda returns both the hosted checkout URL and your original order_id. Store payment_id and order_id in your database.',
    code: `POST ${API_BASE}/v1/payments
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "order_id": "ORDER-1001",
  "amount": 499.00,
  "customer_name": "Vishnu B",
  "customer_mobile": "9788116632",
  "reason": "Invoice payment",
  "remark1": "T-shirt order #1001",
  "remark2": "Blue XL",
  "redirect_url": "https://yourapp.com/payment/callback",
  "business_unit_code": "branch-a",
  "expires_in_minutes": 10
}

Response 201
{
  "success": true,
  "payment": {
    "payment_id": "pay_xxxxx",
    "order_id": "ORDER-1001",
    "amount": 499,
    "status": "PENDING",
    "checkout_url": "https://www.pay-panda.app/pay/pay_xxxxx",
    "qr_path": "/api/public/payments/pay_xxxxx/qr",
    "expires_at": "2026-07-17T10:30:00.000Z"
  }
}`,
  },
  {
    id: 'fields',
    title: 'Create payment fields',
    body: 'Use order_id as your unique order reference. remark1/remark2 are added to the UPI transaction note in the generated QR.',
    code: `Required:
order_id              string, max 100, unique per business
amount                number, > 0, max 1000000

Optional:
customer_name         string, max 100
customer_mobile       digits only, 6 to 15
reason                string, max 180
remark1               string, max 200, added into UPI note
remark2               string, max 200, added into UPI note
redirect_url          valid https/http URL
business_unit_id      Pay-Panda sub-business id
business_unit_code    Pay-Panda sub-business code
expires_in_minutes    integer, 1 to 60`,
  },
  {
    id: 'redirect',
    title: '4. Redirect params after payment',
    body: 'After payment success, Pay-Panda redirects the browser to your redirect_url with query params. Treat these params as a hint only. Always verify from your backend before fulfilling the order.',
    code: `Your redirect URL:
https://yourapp.com/payment/callback

Pay-Panda redirects to:
https://yourapp.com/payment/callback
  ?pay_panda_payment_id=pay_xxxxx
  &order_id=ORDER-1001
  &status=SUCCESS
  &bank_rrn=618587140937

Do not trust only the browser redirect.
Your backend must verify payment_id or order_id using /v1/payments/verify.`,
  },
  {
    id: 'verify',
    title: '5. Server-side verify',
    body: 'Use this endpoint after redirect or from your backend order worker. A payment is truly paid only when verified is true and payment.status is SUCCESS.',
    code: `POST ${API_BASE}/v1/payments/verify
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "payment_id": "pay_xxxxx"
}

// or
{
  "order_id": "ORDER-1001"
}

Response 200
{
  "success": true,
  "verified": true,
  "payment": {
    "payment_id": "pay_xxxxx",
    "order_id": "ORDER-1001",
    "status": "SUCCESS",
    "amount": 499,
    "bank_rrn": "618587140937",
    "payer_name": "Vishnu B",
    "payer_handle": "BHIM",
    "paid_at": "2026-07-17T10:24:12.000Z"
  }
}`,
  },
  {
    id: 'status',
    title: '6. Fetch payment status',
    body: 'Use GET endpoints when you only need current state. These are also OAuth protected and scoped to your business.',
    code: `GET ${API_BASE}/v1/payments/ORDER-1001
Authorization: Bearer <access_token>

GET ${API_BASE}/v1/payments/id/pay_xxxxx
Authorization: Bearer <access_token>

Statuses:
PENDING  - checkout created, payment not matched yet
SUCCESS  - payment matched and confirmed
FAILED   - reserved for failed state
EXPIRED  - payment window ended without match`,
  },
  {
    id: 'subbusiness',
    title: 'Sub-business reporting',
    body: 'If your customer has multiple branches/stores under one Pay-Panda account, pass business_unit_code during create payment. Money still settles to the same connected BharatPe account, but dashboard/history reports are split.',
    code: `{
  "order_id": "BRANCH-A-1001",
  "amount": 250,
  "business_unit_code": "branch-a"
}`,
  },
  {
    id: 'curl',
    title: 'Complete cURL example',
    body: 'Minimal end-to-end server-side flow.',
    code: `TOKEN=$(curl -s -X POST ${API_BASE}/oauth/token \\
  -H "Content-Type: application/json" \\
  -d '{"grant_type":"client_credentials","app_id":"app_xxx","app_secret":"secret_xxx"}' \\
  | jq -r .access_token)

curl -X POST ${API_BASE}/v1/payments \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "order_id": "ORDER-1001",
    "amount": 499,
    "customer_name": "Vishnu B",
    "reason": "Invoice payment",
    "redirect_url": "https://yourapp.com/payment/callback"
  }'

curl -X POST ${API_BASE}/v1/payments/verify \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"order_id":"ORDER-1001"}'`,
  },
  {
    id: 'errors',
    title: 'Errors',
    body: 'Validation and auth errors are JSON. Show the message in logs, not to public users unless safe.',
    code: `400 Validation failed
{
  "success": false,
  "message": "amount: Expected number, received string",
  "errors": [...]
}

401 Invalid OAuth token
{
  "success": false,
  "message": "Valid OAuth access token required"
}

404 Payment not found
409 Connect an active BharatPe account first`,
  },
];

export default function DocumentationPage() {
  const rootRef = useRef(null);
  const [active, setActive] = useState('overview');
  useStagger(rootRef, '.docs-nav li');
  const section = sections.find(item => item.id === active);
  return <div ref={rootRef}>
    <PageHeader eyebrow="API setup" title="Developer documentation" description="Production API contract for OAuth, payment creation, hosted checkout redirects, and server-side verification." />
    <section className="docs-checklist">
      {['Create credentials', 'Get OAuth token', 'Create checkout', 'Verify after redirect'].map(item => <article className="panel overflow-hidden rounded-[var(--radius-lg)] border border-line bg-panel shadow-panel" key={item}><CheckCircle2/><span>{item}</span></article>)}
    </section>
    <section className="panel overflow-hidden rounded-[var(--radius-lg)] border border-line bg-panel shadow-panel docs-layout">
      <nav className="docs-nav"><ul>{sections.map(item => <li key={item.id}><button type="button" className={active === item.id ? 'active' : ''} onClick={() => setActive(item.id)}><BookOpen size={14} />{item.title}</button></li>)}</ul></nav>
      <div className="docs-content">
        <h3>{section.title}</h3>
        <p>{section.body}</p>
        <pre><code>{section.code}</code></pre>
      </div>
    </section>
  </div>;
}
