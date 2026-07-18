import { useRef, useState } from 'react';
import { Copy, Server } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useUi } from '../state/ui-store';
import { copyToClipboard } from '../lib/clipboard';
import useStagger from '../hooks/useStagger';

const API_BASE = 'https://metatronhost.in/pay-panda/api';

const languages = [
  { id: 'node', name: 'Node.js', version: 'Native fetch' },
  { id: 'php', name: 'PHP', version: 'cURL' },
  { id: 'python', name: 'Python', version: 'requests' },
  { id: 'curl', name: 'cURL', version: 'Shell' },
];

const samples = {
  node: `const PAY_PANDA_API = "${API_BASE}";

async function getToken() {
  const res = await fetch(\`\${PAY_PANDA_API}/oauth/token\`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      app_id: process.env.PAY_PANDA_APP_ID,
      app_secret: process.env.PAY_PANDA_APP_SECRET,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()).access_token;
}

async function createPayPandaPayment(order) {
  const token = await getToken();
  const res = await fetch(\`\${PAY_PANDA_API}/v1/payments\`, {
    method: "POST",
    headers: {
      "Authorization": \`Bearer \${token}\`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      order_id: order.id,
      amount: order.amount,
      customer_name: order.customerName,
      customer_mobile: order.customerMobile,
      reason: "Order payment",
      remark1: order.note,
      redirect_url: "https://yourapp.com/payment/callback",
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return {
    orderId: data.payment.order_id,
    paymentId: data.payment.payment_id,
    checkoutUrl: data.payment.checkout_url,
  };
}

async function verifyPayPandaPayment(paymentId) {
  const token = await getToken();
  const res = await fetch(\`\${PAY_PANDA_API}/v1/payments/verify\`, {
    method: "POST",
    headers: {
      "Authorization": \`Bearer \${token}\`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ payment_id: paymentId }),
  });
  const data = await res.json();
  return data.verified && data.payment.status === "SUCCESS";
}`,
  php: `<?php
$api = "${API_BASE}";

function payPandaRequest($path, $payload, $token = null) {
  global $api;
  $headers = ["Content-Type: application/json"];
  if ($token) $headers[] = "Authorization: Bearer " . $token;
  $ch = curl_init($api . $path);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_POSTFIELDS => json_encode($payload),
  ]);
  $body = curl_exec($ch);
  $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  if ($status >= 400) throw new Exception($body);
  return json_decode($body, true);
}

$tokenResponse = payPandaRequest("/oauth/token", [
  "grant_type" => "client_credentials",
  "app_id" => getenv("PAY_PANDA_APP_ID"),
  "app_secret" => getenv("PAY_PANDA_APP_SECRET"),
]);

$payment = payPandaRequest("/v1/payments", [
  "order_id" => "ORDER-1001",
  "amount" => 499,
  "customer_name" => "Vishnu B",
  "reason" => "Order payment",
  "redirect_url" => "https://yourapp.com/payment/callback",
], $tokenResponse["access_token"]);

header("Location: " . $payment["payment"]["checkout_url"]);
exit;`,
  python: `import os
import requests

API = "${API_BASE}"

def get_token():
    r = requests.post(f"{API}/oauth/token", json={
        "grant_type": "client_credentials",
        "app_id": os.environ["PAY_PANDA_APP_ID"],
        "app_secret": os.environ["PAY_PANDA_APP_SECRET"],
    })
    r.raise_for_status()
    return r.json()["access_token"]

def create_payment(order_id, amount):
    token = get_token()
    r = requests.post(f"{API}/v1/payments", headers={
        "Authorization": f"Bearer {token}",
    }, json={
        "order_id": order_id,
        "amount": amount,
        "reason": "Order payment",
        "redirect_url": "https://yourapp.com/payment/callback",
    })
    r.raise_for_status()
    return r.json()["payment"]

def verify_payment(payment_id):
    token = get_token()
    r = requests.post(f"{API}/v1/payments/verify", headers={
        "Authorization": f"Bearer {token}",
    }, json={"payment_id": payment_id})
    r.raise_for_status()
    data = r.json()
    return data["verified"] and data["payment"]["status"] == "SUCCESS"`,
  curl: `curl -X POST ${API_BASE}/oauth/token \\
  -H "Content-Type: application/json" \\
  -d '{
    "grant_type": "client_credentials",
    "app_id": "app_xxx",
    "app_secret": "secret_xxx"
  }'

curl -X POST ${API_BASE}/v1/payments \\
  -H "Authorization: Bearer ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "order_id": "ORDER-1001",
    "amount": 499,
    "customer_name": "Vishnu B",
    "reason": "Order payment",
    "redirect_url": "https://yourapp.com/payment/callback"
  }'

curl -X POST ${API_BASE}/v1/payments/verify \\
  -H "Authorization: Bearer ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"payment_id":"pay_xxxxx"}'`,
};

export default function SdkPage() {
  const rootRef = useRef(null);
  const { toast } = useUi();
  const [active, setActive] = useState('node');
  useStagger(rootRef, '.sdk-card');
  const copy = async () => { try { await copyToClipboard(samples[active]); toast('Integration sample copied', 'success'); } catch { toast('Could not copy sample', 'error'); } };
  return <div ref={rootRef}>
    <PageHeader eyebrow="API setup" title="SDK and integration samples" description="Copy-paste backend examples for creating Pay-Panda checkouts and verifying payment redirects." action={<button className="primary-button compact" onClick={copy}><Copy/>Copy sample</button>} />
    <section className="sdk-grid">
      {languages.map(lang => <button type="button" className={`panel sdk-card ${active === lang.id ? 'active' : ''}`} key={lang.id} onClick={() => setActive(lang.id)}>
        <strong>{lang.name}</strong><small>{lang.version}</small>
        <span className="sdk-download"><Server size={14} />Backend sample</span>
      </button>)}
    </section>
    <section className="panel code-panel">
      <div><p className="eyebrow accent">Quick start</p><h3>{languages.find(l => l.id === active)?.name} integration</h3><p>Keep App Secret on your server. Create a checkout, redirect the customer to checkout_url, then verify the redirect using /v1/payments/verify.</p></div>
      <pre><code>{samples[active]}</code></pre>
    </section>
  </div>;
}
