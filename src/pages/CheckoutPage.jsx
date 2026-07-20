import { useCallback,useEffect,useRef,useState } from 'react';
import { useNavigate,useParams } from 'react-router-dom';
import { ArrowLeft,Check,Clock3,ExternalLink,Flag,ShieldCheck,Smartphone,X } from 'lucide-react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import api, { assetUrl } from '../lib/api';
import { useUi } from '../state/ui-store';
gsap.registerPlugin(useGSAP);

const colors=['#7c3aed','#22c55e','#38bdf8','#f59e0b','#ec4899','#1e293b'];

export default function CheckoutPage(){
  const {publicId}=useParams();const navigate=useNavigate();const root=useRef(null);const [payment,setPayment]=useState(null);const [error,setError]=useState('');const [left,setLeft]=useState('');const [redirecting,setRedirecting]=useState(false);
  const load=useCallback(()=>api.get(`/public/payments/${publicId}`).then(({data})=>setPayment(data.payment)).catch(err=>setError(err.response?.data?.message||'Payment not found')),[publicId]);
  useEffect(()=>{load()},[load]);
  useEffect(()=>{if(payment?.status!=='PENDING')return;const poll=setInterval(load,3000);return()=>clearInterval(poll)},[load,payment?.status]);
  const expiresAt=payment?.expiresAt;
  useEffect(()=>{if(!expiresAt||payment?.status!=='PENDING')return;const tick=()=>{const ms=Math.max(0,new Date(expiresAt)-Date.now());setLeft(`${String(Math.floor(ms/60000)).padStart(2,'0')}:${String(Math.floor(ms%60000/1000)).padStart(2,'0')}`);if(ms<=0)load()};tick();const timer=setInterval(tick,1000);return()=>clearInterval(timer)},[expiresAt,load,payment?.status]);
  const redirectTarget=buildRedirectUrl(payment);
  useEffect(()=>{if(payment?.status!=='SUCCESS'||!redirectTarget)return;setRedirecting(true);const timer=setTimeout(()=>window.location.assign(redirectTarget),4000);return()=>clearTimeout(timer)},[payment?.status,redirectTarget]);
  useGSAP(()=>{const mm=gsap.matchMedia();mm.add({normal:'(prefers-reduced-motion: no-preference)'},({conditions})=>{if(!conditions.normal)return;gsap.from('.pay-card',{autoAlpha:0,y:24,duration:.55,ease:'power2.out'});if(payment?.status==='SUCCESS'){gsap.fromTo('.paid-check',{scale:.4,rotation:-30},{scale:1,rotation:0,duration:.65,ease:'back.out(1.8)'});gsap.to('.confetti-piece',{x:()=>gsap.utils.random(-210,210),y:()=>gsap.utils.random(210,520),rotation:()=>gsap.utils.random(-540,540),autoAlpha:0,duration:()=>gsap.utils.random(1.4,2.4),stagger:.015,ease:'power2.out'})}});return()=>mm.revert()},{scope:root,dependencies:[payment?.status],revertOnUpdate:true});
  if(error)return <div className="checkout grid min-h-screen place-items-center overflow-hidden bg-bg p-5 text-text" ref={root}><div className="pay-card relative w-[min(520px,100%)] overflow-hidden rounded-[28px] border border-line bg-panel p-7 shadow-elevated"><div className="empty-state grid place-items-center px-5 py-12 text-center text-muted"><Clock3/><h2>{error}</h2></div></div></div>;
  if(!payment)return <div className="checkout grid min-h-screen place-items-center overflow-hidden bg-bg p-5 text-text"><div className="checkout-loader">Preparing secure QR…</div></div>;
  const done=payment.status==='SUCCESS';const expired=payment.status==='EXPIRED';
  const theme=payment.business.theme||'midnight';
  const goBack=()=>redirectTarget?window.location.assign(redirectTarget):(window.history.length>1?navigate(-1):navigate('/'));
  return <div className={`checkout grid min-h-screen place-items-center overflow-hidden bg-bg p-5 text-text theme-${theme}`} ref={root}><div className="checkout-orb one"/><div className="checkout-orb two"/><main className={`pay-card relative w-[min(520px,100%)] overflow-hidden rounded-[28px] border border-line bg-panel p-7 shadow-elevated layout-${theme}`}>{done?<div className="paid-state"><div className="confetti-layer">{Array.from({length:52},(_,i)=><i className="confetti-piece" key={i} style={{background:colors[i%colors.length],left:`${35+(i%11)*3}%`}}/>)}</div><div className="paid-check"><Check/></div><p className="eyebrow mb-1 text-[var(--font-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)] text-[var(--muted-2)] accent text-accent-contrast">Payment confirmed</p><h1>₹{Number(payment.amount).toFixed(2)}</h1><p>Received from {payment.payerName||payment.customerName||'customer'} {payment.payerHandle?`via ${payment.payerHandle}`:''}</p><div className="receipt-row flex justify-between border-t border-line py-3 text-small"><span>Order</span><strong>{payment.orderId}</strong></div><div className="receipt-row flex justify-between border-t border-line py-3 text-small"><span>Payment ID</span><strong>{payment.id}</strong></div><div className="receipt-row flex justify-between border-t border-line py-3 text-small"><span>Paid at</span><strong>{payment.paidAt?new Date(payment.paidAt).toLocaleString():'Confirmed'}</strong></div><div className="receipt-row flex justify-between border-t border-line py-3 text-small"><span>Bank RRN</span><strong>{payment.bankReferenceNo||'Confirmed'}</strong></div><button className="primary-button inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border-0 bg-gradient-to-br from-violet-600 to-indigo-500 px-4 font-bold text-white shadow-[var(--shadow-glow-accent)] transition disabled:cursor-not-allowed disabled:opacity-60 return-button" onClick={goBack}>{redirecting?<><ExternalLink/>Redirecting in 4 seconds…</>:<><ArrowLeft/>Return to previous page</>}</button></div>:expired?<div className="expired-state"><Clock3/><p className="eyebrow mb-1 text-[var(--font-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)] text-[var(--muted-2)]">Payment link expired</p><h2>This QR is no longer active</h2><p>No payment was matched within the configured payment window.</p><button className="primary-button inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border-0 bg-gradient-to-br from-violet-600 to-indigo-500 px-4 font-bold text-white shadow-[var(--shadow-glow-accent)] transition disabled:cursor-not-allowed disabled:opacity-60" onClick={goBack}><ArrowLeft/>Go back</button></div>:<PendingContent payment={payment} publicId={publicId} left={left} theme={theme}/>}<footer><ShieldCheck/>Secured and verified by Pay-Panda</footer><ReportProblem publicId={publicId}/></main></div>;
}

function QrBlock({publicId}){return <div className="qr-shell"><img src={assetUrl(`/api/public/payments/${publicId}/qr`)} alt="Payment QR"/></div>;}
function UpiButton({payment,publicId}){
  const {toast}=useUi();
  const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
  const shareQr=async()=>{setBusy(true);setMessage('');const qrUrl=assetUrl(`/api/public/payments/${publicId}/qr`);try{const response=await fetch(qrUrl,{cache:'no-store'});if(!response.ok)throw new Error('Could not load QR');const blob=await response.blob();const file=new File([blob],`pay-panda-${payment.orderId||publicId}.png`,{type:'image/png'});if(navigator.canShare?.({files:[file]})&&navigator.share){await navigator.share({title:`Pay ₹${Number(payment.amount).toFixed(2)}`,text:`Scan this Pay-Panda QR for ${payment.orderId}`,files:[file]});setMessage('QR shared. Select a UPI app that can scan/import QR.');toast('Payment QR shared','success');}else{const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=file.name;link.target='_blank';link.rel='noreferrer';link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);setMessage('QR downloaded. Open it from your UPI app scanner.');toast('Payment QR downloaded','info');}}catch{window.open(qrUrl,'_blank','noopener,noreferrer');setMessage('QR opened. Use your UPI app scanner to scan/import it.');toast('QR opened in a new tab','info');}finally{setBusy(false)}};
  return <div className="upi-share-wrap"><button className="upi-pay-button mx-auto inline-flex h-11 w-[248px] items-center justify-center gap-2 rounded-[var(--radius-md)] border border-accent/25 bg-accent/10 text-small font-bold text-accent-contrast" type="button" disabled={busy} onClick={shareQr}><Smartphone/>{busy?'Preparing QR…':'Pay with a UPI app'}</button>{message&&<small>{message}</small>}</div>;
}
function PayElements({payment,publicId}){
  const layout=payment.business.checkoutLayout||'both';
  return <>{layout!=='button'&&<><QrBlock publicId={publicId}/><p className="scan-copy">Scan with any UPI app</p></>}{layout!=='qr'&&<UpiButton payment={payment} publicId={publicId}/>}</>;
}

function PendingContent({payment,publicId,left,theme}){
  const head=<div className="checkout-head"><div className="checkout-brand">{payment.business.name[0]}</div><div><p>Paying</p><strong>{payment.business.name}</strong></div><span>₹{Number(payment.amount).toFixed(2)}</span></div>;
  const person=<div className="checkout-person"><div><span>Payee</span><strong>{payment.payee?.name||payment.business.name}</strong><small>{payment.payee?.upiId}</small></div><div><span>Customer</span><strong>{payment.customerName||'Guest'}</strong><small>{payment.customerMobile||'No mobile provided'}</small></div></div>;
  const detail=<div className="payment-detail flex justify-between border-t border-line py-3 text-small"><span>For</span><strong>{payment.reason||payment.orderId}</strong></div>;
  const description=(payment.remark1||payment.remark2)&&<div className="payment-description"><span>Payment description</span><p>{[payment.remark1,payment.remark2].filter(Boolean).join(' · ')}</p></div>;
  const status=<div className="checkout-status"><i/><span>Waiting for payment</span><strong>{left}</strong></div>;

  if(theme==='daylight')return <div className="checkout-split"><div className="checkout-split-info">{head}{person}{detail}{description}{status}</div><div className="checkout-split-pay"><PayElements payment={payment} publicId={publicId}/></div></div>;
  if(theme==='emerald')return <><PayElements payment={payment} publicId={publicId}/><strong className="checkout-minimal-amount">₹{Number(payment.amount).toFixed(2)}</strong><p className="checkout-minimal-name">{payment.business.name}</p>{status}</>;
  if(theme==='sunrise')return <>{head}<div className="checkout-banner-body"><PayElements payment={payment} publicId={publicId}/>{person}{detail}{description}{status}</div></>;
  return <>{head}<PayElements payment={payment} publicId={publicId}/>{person}{detail}{description}{status}</>;
}

function ReportProblem({publicId}){
  const {toast}=useUi();
  const [open,setOpen]=useState(false);const [message,setMessage]=useState('');const [contact,setContact]=useState('');const [busy,setBusy]=useState(false);const [sent,setSent]=useState(false);
  const submit=async event=>{
    event.preventDefault();setBusy(true);
    try{await api.post(`/public/payments/${publicId}/complaints`,{message,filerContact:contact||undefined});setSent(true);toast('Complaint filed — the business and Pay-Panda have been notified','success')}
    catch(err){toast(err.response?.data?.message||'Could not file complaint','error')}
    finally{setBusy(false)}
  };
  return <>
    <button className="report-problem-link" type="button" onClick={()=>setOpen(true)}><Flag size={13}/>Report a problem with this payment</button>
    {open&&<div className="modal-backdrop fixed inset-0 z-[100] grid place-items-center bg-black/70 p-5 backdrop-blur-sm" onMouseDown={()=>setOpen(false)}>
      <div className="modal-card relative max-h-[90vh] w-[min(460px,100%)] overflow-auto rounded-[19px] border border-line bg-panel p-7 shadow-elevated" onMouseDown={e=>e.stopPropagation()}>
        <button className="modal-close absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-xl border border-line bg-transparent text-text transition hover:border-accent" onClick={()=>setOpen(false)}><X/></button>
        {sent?<div className="paid-check"><Check/></div>:null}
        {sent?<><h2>Complaint filed</h2><p>The business and Pay-Panda can now see this on their end. No login was needed — your payment ID was enough.</p></>:<>
          <h2>Report a problem</h2>
          <p>No account needed — this is tied to payment <strong>{publicId}</strong>.</p>
          <form onSubmit={submit}>
            <label>What went wrong?<textarea className="admin-textarea w-full rounded-xl border border-line bg-panel-inset p-3 text-body text-text outline-none focus:border-accent" required minLength={5} maxLength={1000} rows={4} value={message} onChange={e=>setMessage(e.target.value)} placeholder="Describe the issue…"/></label>
            <label>Your email or mobile (optional, so the business can reach you)<input value={contact} onChange={e=>setContact(e.target.value)} placeholder="you@example.com"/></label>
            <button className="primary-button inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border-0 bg-gradient-to-br from-violet-600 to-indigo-500 px-4 font-bold text-white shadow-[var(--shadow-glow-accent)] transition disabled:cursor-not-allowed disabled:opacity-60" disabled={busy}>{busy?'Filing…':'File complaint'}</button>
          </form>
        </>}
      </div>
    </div>}
  </>;
}

function buildRedirectUrl(payment){if(!payment?.redirectUrl||payment.status!=='SUCCESS')return'';try{const url=new URL(payment.redirectUrl);url.searchParams.set('pay_panda_payment_id',payment.id);url.searchParams.set('order_id',payment.orderId);url.searchParams.set('status',payment.status);if(payment.bankReferenceNo)url.searchParams.set('bank_rrn',payment.bankReferenceNo);return url.toString()}catch{return payment.redirectUrl}}
