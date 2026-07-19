import { useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { Building2, Copy, ExternalLink, QrCode, RefreshCw, Settings2 } from 'lucide-react';
import api, { assetUrl } from '../lib/api';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../state/auth-store';
import { useUi } from '../state/ui-store';
import { gsap, REDUCED_MOTION_QUERY, EASE_POP } from '../lib/motion';
import { copyToClipboard } from '../lib/clipboard';

export default function CreatePaymentPage(){
  const {user}=useAuth();
  const {confirm,toast}=useUi();
  const [units,setUnits]=useState([]);
  const [form,setForm]=useState({order_id:`ORDER-${Date.now()}`,amount:'',customer_name:'',customer_mobile:'',customer_email:'',reason:'',remark1:'',redirect_url:'',business_unit_id:'',expires_in_minutes:user?.business?.paymentExpiryMins||10});
  const [result,setResult]=useState(null);const [error,setError]=useState('');const [busy,setBusy]=useState(false);
  const resultRef=useRef(null);
  useEffect(()=>{api.get('/dashboard/business-units').then(({data})=>setUnits(data.units.filter(unit=>unit.active))).catch(()=>{})},[]);
  useGSAP(() => {
    if (!result) return;
    const mm = gsap.matchMedia();
    mm.add(REDUCED_MOTION_QUERY, () => { gsap.from(resultRef.current, { autoAlpha: 0, y: 16, scale: .97, duration: .4, ease: EASE_POP }); });
    return () => mm.revert();
  }, { scope: resultRef, dependencies: [result?.id], revertOnUpdate: true });
  useEffect(() => {
    if (result && window.innerWidth <= 800) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [result]);
  const submit=async event=>{event.preventDefault();const mobile=form.customer_mobile.trim();if(mobile&&mobile.length!==10){const message='Enter a valid 10-digit customer mobile number.';setError(message);toast(message,'error');return}const selected=units.find(unit=>unit.id===form.business_unit_id);const approved=await confirm({title:'Create payment link?',message:`Create a ₹${Number(form.amount).toFixed(2)} payment${selected?` for ${selected.name}`:''} for ${form.customer_name||'this customer'}? The link will expire after ${form.expires_in_minutes} minutes.`,confirmLabel:'Create payment',tone:'warning'});if(!approved)return;setBusy(true);setError('');setResult(null);try{const payload={...form,amount:Number(form.amount),expires_in_minutes:Number(form.expires_in_minutes),customer_mobile:mobile};if(!payload.customer_mobile)delete payload.customer_mobile;if(!payload.customer_email)delete payload.customer_email;if(!payload.redirect_url)delete payload.redirect_url;if(!payload.business_unit_id)delete payload.business_unit_id;const {data}=await api.post('/dashboard/payments',payload);setResult(data.payment);toast('Payment link and QR created');setForm(current=>({...current,order_id:`ORDER-${Date.now()}`}))}catch(err){setError(err.response?.data?.message||'Could not create payment');toast(err.response?.data?.message||'Could not create payment','error')}finally{setBusy(false)}};
  const copyCheckout=async()=>{try{await copyToClipboard(result.checkoutUrl);toast('Checkout link copied','success')}catch{toast('Could not copy checkout link','error')}};
  return <><PageHeader eyebrow="Payments" title="Create a payment" description="Generate a hosted Pay-Panda checkout and amount-specific UPI QR."/><div className="create-grid">
    <form className="panel form-panel" onSubmit={submit}>
      <div className="form-grid">
        <label>Order ID<input required value={form.order_id} onChange={e=>setForm({...form,order_id:e.target.value})}/></label>
        <label>Amount (₹)
          <div className="input-prefix-wrapper">
            <span className="input-prefix">₹</span>
            <input required type="number" min="1" step="0.01" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/>
          </div>
        </label>
      </div>
      <div className="form-grid">
        <label>Sub-business / branch
          <div className="select-wrap">
            <Building2/>
            <select value={form.business_unit_id} onChange={e=>setForm({...form,business_unit_id:e.target.value})}>
              <option value="">Main business summary</option>
              {units.map(unit=><option key={unit.id} value={unit.id}>{unit.name} ({unit.code})</option>)}
            </select>
          </div>
          <small className="field-help">Separate dashboard totals & history.</small>
        </label>
        <label>Payment expiry
          <div className="select-wrap">
            <Settings2/>
            <select value={form.expires_in_minutes} onChange={e=>setForm({...form,expires_in_minutes:e.target.value})}>
              <option value="5">5 minutes</option>
              <option value="10">10 minutes</option>
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">60 minutes</option>
            </select>
          </div>
          <small className="field-help">Expires automatically if unpaid.</small>
        </label>
      </div>
      <div className="form-grid">
        <label>Customer name<input value={form.customer_name} onChange={e=>setForm({...form,customer_name:e.target.value.replace(/(^\w|\s\w)/g,m=>m.toUpperCase())})}/></label>
        <label>Customer mobile
          <div className="input-prefix-wrapper phone-prefix">
            <span className="input-prefix">+91</span>
            <input inputMode="numeric" maxLength="10" placeholder="10-digit mobile" value={form.customer_mobile} onChange={e=>setForm({...form,customer_mobile:e.target.value.replace(/\D/g,'').slice(0,10)})}/>
          </div>
        </label>
      </div>
      <div className="form-grid">
        <label>Customer email<input type="email" placeholder="customer@example.com" value={form.customer_email} onChange={e=>setForm({...form,customer_email:e.target.value})}/><small className="field-help">Sends an automatic payment receipt once paid.</small></label>
      </div>
      <div className="form-grid">
        <label>Payment reason
          <div className="reason-input-container">
            <input placeholder="Invoice, deposit, order…" value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})}/>
            <div className="reason-pills">
              {['Invoice', 'Deposit', 'Order'].map(sample => (
                <button
                  type="button"
                  key={sample}
                  className={`reason-pill ${form.reason === sample ? 'active' : ''}`}
                  onClick={() => setForm({ ...form, reason: sample })}
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>
        </label>
        <label>Redirect URL<input type="url" placeholder="https://your-site.com/payment-return" value={form.redirect_url} onChange={e=>setForm({...form,redirect_url:e.target.value})}/></label>
      </div>
      <label>Payment description<input placeholder="Add customer-facing comments or payment details" value={form.remark1} onChange={e=>setForm({...form,remark1:e.target.value})}/></label>
      {error&&<div className="alert error">{error}</div>}
      <button className="primary-button" disabled={busy}>{busy?<RefreshCw className="spin"/>:<QrCode/>}{busy?'Creating secure QR…':'Create payment QR'}</button>
    </form>
    <aside className="panel result-panel" ref={resultRef}>{result?<><div className="result-check">✓</div><p className="eyebrow accent">Payment ready</p><img className="result-qr" src={assetUrl(result.qrPath)} alt="Generated payment QR"/><h3>₹{Number(result.amount).toFixed(2)}</h3><span>{result.businessUnit?`${result.businessUnit.name} · `:''}{result.orderId} · expires {new Date(result.expiresAt).toLocaleTimeString()}</span><div className="link-box"><code>{result.checkoutUrl}</code><button type="button" title="Copy checkout link" onClick={copyCheckout}><Copy/></button></div><a className="primary-button" href={result.checkoutUrl} target="_blank" rel="noreferrer">Open checkout<ExternalLink/></a></>:<div className="empty-state"><QrCode/><h4>Your checkout appears here</h4><p>Complete the form to generate a secure payment page.</p></div>}</aside>
  </div></>;
}
