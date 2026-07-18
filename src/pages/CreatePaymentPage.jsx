import { useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { Copy, ExternalLink, QrCode, RefreshCw, Settings2 } from 'lucide-react';
import api, { assetUrl } from '../lib/api';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../state/auth-store';
import { useUi } from '../state/ui-store';
import { gsap, REDUCED_MOTION_QUERY, EASE_POP } from '../lib/motion';

export default function CreatePaymentPage(){
  const {user}=useAuth();
  const {confirm,toast}=useUi();
  const [units,setUnits]=useState([]);
  const [form,setForm]=useState({order_id:`ORDER-${Date.now()}`,amount:'',customer_name:'',customer_mobile:'',reason:'',remark1:'',redirect_url:'',business_unit_id:'',expires_in_minutes:user?.business?.paymentExpiryMins||10});
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
  const submit=async event=>{event.preventDefault();const selected=units.find(unit=>unit.id===form.business_unit_id);const approved=await confirm({title:'Create payment link?',message:`Create a ₹${Number(form.amount).toFixed(2)} payment${selected?` for ${selected.name}`:''} for ${form.customer_name||'this customer'}? The link will expire after ${form.expires_in_minutes} minutes.`,confirmLabel:'Create payment',tone:'warning'});if(!approved)return;setBusy(true);setError('');setResult(null);try{const payload={...form,amount:Number(form.amount),expires_in_minutes:Number(form.expires_in_minutes)};if(!payload.redirect_url)delete payload.redirect_url;if(!payload.business_unit_id)delete payload.business_unit_id;const {data}=await api.post('/dashboard/payments',payload);setResult(data.payment);toast('Payment link and QR created');setForm(current=>({...current,order_id:`ORDER-${Date.now()}`}))}catch(err){setError(err.response?.data?.message||'Could not create payment');toast(err.response?.data?.message||'Could not create payment','error')}finally{setBusy(false)}};
  return <><PageHeader eyebrow="Payments" title="Create a payment" description="Generate a hosted Pay-Panda checkout and amount-specific UPI QR."/><div className="create-grid">
    <form className="panel form-panel" onSubmit={submit}>
      <div className="form-grid">
        <label>Order ID<input required value={form.order_id} onChange={e=>setForm({...form,order_id:e.target.value})}/></label>
        <label>Amount (₹)<input required type="number" min="1" step="0.01" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></label>
      </div>
      <div className="form-grid">
        <label>Sub-business / branch
          <select value={form.business_unit_id} onChange={e=>setForm({...form,business_unit_id:e.target.value})}>
            <option value="">Main business summary</option>
            {units.map(unit=><option key={unit.id} value={unit.id}>{unit.name} ({unit.code})</option>)}
          </select>
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
        <label>Customer name<input value={form.customer_name} onChange={e=>setForm({...form,customer_name:e.target.value})}/></label>
        <label>Customer mobile<input inputMode="numeric" maxLength="15" value={form.customer_mobile} onChange={e=>setForm({...form,customer_mobile:e.target.value.replace(/\D/g,'').slice(0,15)})}/></label>
      </div>
      <div className="form-grid">
        <label>Payment reason<input placeholder="Invoice, deposit, order…" value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})}/></label>
        <label>Redirect URL<input type="url" placeholder="https://your-site.com/payment-return" value={form.redirect_url} onChange={e=>setForm({...form,redirect_url:e.target.value})}/></label>
      </div>
      <label>Payment description<input placeholder="Add customer-facing comments or payment details" value={form.remark1} onChange={e=>setForm({...form,remark1:e.target.value})}/></label>
      {error&&<div className="alert error">{error}</div>}
      <button className="primary-button" disabled={busy}>{busy?<RefreshCw className="spin"/>:<QrCode/>}{busy?'Creating secure QR…':'Create payment QR'}</button>
    </form>
    <aside className="panel result-panel" ref={resultRef}>{result?<><div className="result-check">✓</div><p className="eyebrow accent">Payment ready</p><img className="result-qr" src={assetUrl(result.qrPath)} alt="Generated payment QR"/><h3>₹{Number(result.amount).toFixed(2)}</h3><span>{result.businessUnit?`${result.businessUnit.name} · `:''}{result.orderId} · expires {new Date(result.expiresAt).toLocaleTimeString()}</span><div className="link-box"><code>{result.checkoutUrl}</code><button onClick={()=>navigator.clipboard.writeText(result.checkoutUrl)}><Copy/></button></div><a className="primary-button" href={result.checkoutUrl} target="_blank" rel="noreferrer">Open checkout<ExternalLink/></a></>:<div className="empty-state"><QrCode/><h4>Your checkout appears here</h4><p>Complete the form to generate a secure payment page.</p></div>}</aside>
  </div></>;
}
