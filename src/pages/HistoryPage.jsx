import { useCallback,useEffect,useRef,useState } from 'react';
import { useParams } from 'react-router-dom';
import { CalendarDays,Copy,ExternalLink,Flag,IndianRupee,QrCode,ReceiptText,RefreshCw,Search,Users,X } from 'lucide-react';
import api, { assetUrl } from '../lib/api';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { useUi } from '../state/ui-store';
import { copyToClipboard } from '../lib/clipboard';
import useStagger from '../hooks/useStagger';
import useModalEnter from '../hooks/useModalEnter';

const presets=['Today','This week','This month','This year','Custom'];
export default function HistoryPage(){
  const {toast}=useUi();
  const {status}=useParams();const [items,setItems]=useState([]);const [units,setUnits]=useState([]);const [unitId,setUnitId]=useState('');const [query,setQuery]=useState('');const [summary,setSummary]=useState({collectedAmount:0,successfulCount:0});const [preset,setPreset]=useState('This month');const initial=rangeFor('This month');const [range,setRange]=useState(initial);const [qrPayment,setQrPayment]=useState(null);const [loading,setLoading]=useState(true);
  const rootRef=useRef(null);const qrRef=useRef(null);const refundRef=useRef(null);const complaintRef=useRef(null);
  const [refundTarget,setRefundTarget]=useState(null);const [refundForm,setRefundForm]=useState({reason:'',reference:''});const [refundBusy,setRefundBusy]=useState(false);
  const [complaintTarget,setComplaintTarget]=useState(null);const [complaintMessage,setComplaintMessage]=useState('');const [complaintBusy,setComplaintBusy]=useState(false);
  const normalized=status?.toUpperCase();const filter=['SUCCESS','FAILED','PENDING','EXPIRED'].includes(normalized)?normalized:'';
  const load=useCallback(()=>{setLoading(true);const params=new URLSearchParams({limit:'100',from:new Date(`${range.from}T00:00:00`).toISOString(),to:new Date(`${range.to}T23:59:59.999`).toISOString()});if(filter)params.set('status',filter);if(unitId)params.set('business_unit_id',unitId);api.get(`/dashboard/payments?${params}`).then(({data})=>{setItems(data.payments);setSummary(data.summary)}).catch(()=>toast('Could not load payment history','error')).finally(()=>setLoading(false))},[filter,range.from,range.to,unitId,toast]);useEffect(()=>{load()},[load]);useEffect(()=>{api.get('/dashboard/business-units').then(({data})=>setUnits(data.units)).catch(()=>{})},[]);
  const choosePreset=value=>{setPreset(value);if(value!=='Custom')setRange(rangeFor(value))};
  const copyPaymentLink=async link=>{try{await copyToClipboard(link);toast('Payment link copied','success')}catch{toast('Could not copy payment link','error')}};
  const visible=items.filter(payment=>[payment.clientOrderId,payment.businessUnit?.name,payment.businessUnit?.code,payment.customerName,payment.customerMobile,payment.bankReferenceNo,payment.payerName,payment.payerHandle].some(value=>String(value||'').toLowerCase().includes(query.toLowerCase())));
  useStagger(rootRef, '.table-wrap tbody tr', { dependency: visible.length });
  useModalEnter(qrRef, '.history-qr-modal', Boolean(qrPayment));
  useModalEnter(refundRef, '.modal-card', Boolean(refundTarget));
  useModalEnter(complaintRef, '.modal-card', Boolean(complaintTarget));
  const openRefund=payment=>{setRefundForm({reason:'',reference:''});setRefundTarget(payment)};
  const openComplaint=payment=>{setComplaintMessage('');setComplaintTarget(payment)};
  const submitRefund=async event=>{
    event.preventDefault();setRefundBusy(true);
    try{
      if(refundTarget.refundStatus==='REQUESTED'){await api.post(`/dashboard/payments/${refundTarget.id}/refund-complete`,{reference:refundForm.reference});toast('Refund marked as completed','success')}
      else{await api.post(`/dashboard/payments/${refundTarget.id}/refund-request`,{reason:refundForm.reason});toast('Refund requested','success')}
      setRefundTarget(null);load();
    }catch(err){toast(err.response?.data?.message||'Could not update refund status','error')}
    finally{setRefundBusy(false)}
  };
  const submitComplaint=async event=>{
    event.preventDefault();setComplaintBusy(true);
    try{await api.post(`/dashboard/payments/${complaintTarget.id}/complaints`,{message:complaintMessage});toast('Complaint filed','success');setComplaintTarget(null)}
    catch(err){toast(err.response?.data?.message||'Could not file complaint','error')}
    finally{setComplaintBusy(false)}
  };
  return <div ref={rootRef}><PageHeader eyebrow="Payments" title={`${filter?filter[0]+filter.slice(1).toLowerCase()+' ':''}Payment history`} description="Only payments created through Pay-Panda links, QR sessions, dashboard, or API are shown here."/>
    <section className="history-summary grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4"><article><span><IndianRupee/></span><div><small>Filtered collection</small><strong>₹{summary.collectedAmount.toLocaleString('en-IN',{minimumFractionDigits:2})}</strong></div></article><article><span><Users/></span><div><small>Successful payments</small><strong>{summary.successfulCount}</strong></div></article><article className="range-card flex items-center gap-3 rounded-2xl border border-line bg-panel p-4 shadow-panel"><span><CalendarDays/></span><div><small>Date range</small><strong>{new Date(`${range.from}T00:00:00`).toLocaleDateString()} – {new Date(`${range.to}T00:00:00`).toLocaleDateString()}</strong></div></article></section>
    <section className="panel overflow-hidden rounded-[var(--radius-lg)] border border-line bg-panel shadow-panel"><div className="history-filters"><div className="preset-tabs">{presets.map(item=><button key={item} className={preset===item?'active':''} onClick={()=>choosePreset(item)}>{item}</button>)}</div><div className="date-inputs"><label>Sub-business<select value={unitId} onChange={e=>setUnitId(e.target.value)}><option value="">All</option>{units.map(unit=><option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></label><label>From<input type="date" value={range.from} onChange={e=>{setPreset('Custom');setRange({...range,from:e.target.value})}}/></label><label>To<input type="date" value={range.to} onChange={e=>{setPreset('Custom');setRange({...range,to:e.target.value})}}/></label></div></div><div className="table-tools flex flex-wrap items-center justify-between gap-4 px-5 py-4"><div className="search-box relative w-[min(400px,70%)] max-sm:w-full"><Search/><input placeholder="Search order, sub-business, payer, customer, mobile or RRN" value={query} onChange={e=>setQuery(e.target.value)}/></div><span>{visible.length} records</span></div><div className="table-wrap w-full overflow-auto"><table><thead><tr><th>Order</th><th>Sub-business</th><th>Customer / payer</th><th>Created</th><th>Paid</th><th>Connection</th><th>Amount</th><th>Status</th><th>Bank RRN</th><th>Actions</th></tr></thead><tbody>{loading?<tr><td colSpan="10" className="empty-cell px-5 py-12 text-center text-muted"><RefreshCw className="spin animate-spin"/> Loading payment history…</td></tr>:visible.length?visible.map(payment=>{const alive=payment.status==='PENDING'&&new Date(payment.expiresAt)>new Date();const succeeded=payment.status==='SUCCESS';const link=`${window.location.origin}/pay/${payment.publicId}`;return <tr key={payment.id}><td><strong>{payment.clientOrderId}</strong><small>{payment.source}</small></td><td><strong>{payment.businessUnit?.name||'Main'}</strong><small>{payment.businessUnit?.code||'—'}</small></td><td><strong>{payment.payerName||payment.customerName||'—'}</strong><small>{payment.payerHandle||payment.customerMobile||'—'}</small></td><td>{formatDate(payment.createdAt)}</td><td>{payment.paidAt?formatDate(payment.paidAt):'—'}</td><td><strong>{payment.connection?.provider||'BHARATPE'}</strong><small>{payment.connection?.legalBusinessName||payment.connection?.merchantId}</small></td><td><strong>₹{Number(payment.amount).toFixed(2)}</strong></td><td><StatusBadge status={payment.status}/>{payment.refundStatus&&payment.refundStatus!=='NONE'&&<small className="mt-1 block text-micro font-bold uppercase text-muted">{payment.refundStatus==='REQUESTED'?'Refund requested':'Refunded'}</small>}</td><td><code>{payment.bankReferenceNo||'—'}</code></td><td><div className="history-actions">{alive&&<><button title="Copy payment link" onClick={()=>copyPaymentLink(link)}><Copy/></button><button title="Show QR" onClick={()=>setQrPayment(payment)}><QrCode/></button><a title="Open checkout" href={link} target="_blank" rel="noreferrer"><ExternalLink/></a></>}{succeeded&&payment.refundStatus!=='REFUNDED'&&<button title={payment.refundStatus==='REQUESTED'?'Mark refunded':'Request refund'} onClick={()=>openRefund(payment)}><ReceiptText/></button>}{succeeded&&<button title="Report a problem" onClick={()=>openComplaint(payment)}><Flag/></button>}{!alive&&!succeeded&&<span className="muted-dash">—</span>}</div></td></tr>}):<tr><td colSpan="10" className="empty-cell px-5 py-12 text-center text-muted">No Pay-Panda payments match this filter.</td></tr>}</tbody></table></div></section>{qrPayment&&<div className="modal-backdrop fixed inset-0 z-[100] grid place-items-center bg-black/70 p-5 backdrop-blur-sm" ref={qrRef} onMouseDown={()=>setQrPayment(null)}><div className="history-qr-modal" onMouseDown={event=>event.stopPropagation()}><button onClick={()=>setQrPayment(null)}><X/></button><p className="eyebrow mb-1 text-[var(--font-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)] text-[var(--muted-2)] accent text-accent-contrast">Active payment</p><h3>₹{Number(qrPayment.amount).toFixed(2)}</h3><img src={assetUrl(`/api/public/payments/${qrPayment.publicId}/qr`)} alt="Payment QR"/><strong>{qrPayment.clientOrderId}</strong><small>{qrPayment.businessUnit?.name ? `${qrPayment.businessUnit.name} · ` : ''}Expires {new Date(qrPayment.expiresAt).toLocaleString()}</small></div></div>}
    {refundTarget&&<div className="modal-backdrop fixed inset-0 z-[100] grid place-items-center bg-black/70 p-5 backdrop-blur-sm" ref={refundRef} onMouseDown={()=>setRefundTarget(null)}>
      <div className="modal-card relative max-h-[90vh] w-[min(480px,100%)] overflow-auto rounded-[19px] border border-line bg-panel p-7 shadow-elevated" onMouseDown={e=>e.stopPropagation()}>
        <button className="modal-close absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-xl border border-line bg-transparent text-text transition hover:border-accent" onClick={()=>setRefundTarget(null)}><X/></button>
        <h2>{refundTarget.refundStatus==='REQUESTED'?'Mark refund as sent':'Request a refund'}</h2>
        <p>Pay-Panda never holds your customers' money, so this is a status record only — send the money back yourself via your own UPI app{refundTarget.refundStatus==='REQUESTED'?', then log the reference below.':'.'}</p>
        <form onSubmit={submitRefund}>
          {refundTarget.refundStatus==='REQUESTED'
            ? <label>UTR / reference number<input required minLength={3} value={refundForm.reference} onChange={e=>setRefundForm({...refundForm,reference:e.target.value})} placeholder="e.g. 402911223344"/></label>
            : <label>Reason<textarea className="admin-textarea w-full rounded-xl border border-line bg-panel-inset p-3 text-body text-text outline-none focus:border-accent" required minLength={3} maxLength={500} rows={4} value={refundForm.reason} onChange={e=>setRefundForm({...refundForm,reason:e.target.value})} placeholder="Why is this payment being refunded?"/></label>}
          <button className="primary-button inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border-0 bg-gradient-to-br from-violet-600 to-indigo-500 px-4 font-bold text-white shadow-[var(--shadow-glow-accent)] transition disabled:cursor-not-allowed disabled:opacity-60" disabled={refundBusy}>{refundBusy?'Saving…':refundTarget.refundStatus==='REQUESTED'?'Mark as refunded':'Request refund'}</button>
        </form>
      </div>
    </div>}
    {complaintTarget&&<div className="modal-backdrop fixed inset-0 z-[100] grid place-items-center bg-black/70 p-5 backdrop-blur-sm" ref={complaintRef} onMouseDown={()=>setComplaintTarget(null)}>
      <div className="modal-card relative max-h-[90vh] w-[min(480px,100%)] overflow-auto rounded-[19px] border border-line bg-panel p-7 shadow-elevated" onMouseDown={e=>e.stopPropagation()}>
        <button className="modal-close absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-xl border border-line bg-transparent text-text transition hover:border-accent" onClick={()=>setComplaintTarget(null)}><X/></button>
        <h2>Report a problem with this payment</h2>
        <p>Order <strong>{complaintTarget.clientOrderId}</strong> · ₹{Number(complaintTarget.amount).toFixed(2)}. This is logged for the Pay-Panda team to review alongside the business.</p>
        <form onSubmit={submitComplaint}>
          <label>What went wrong?<textarea className="admin-textarea w-full rounded-xl border border-line bg-panel-inset p-3 text-body text-text outline-none focus:border-accent" required minLength={5} maxLength={1000} rows={4} value={complaintMessage} onChange={e=>setComplaintMessage(e.target.value)} placeholder="Describe the issue…"/></label>
          <button className="primary-button inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border-0 bg-gradient-to-br from-violet-600 to-indigo-500 px-4 font-bold text-white shadow-[var(--shadow-glow-accent)] transition disabled:cursor-not-allowed disabled:opacity-60" disabled={complaintBusy}>{complaintBusy?'Filing…':'File complaint'}</button>
        </form>
      </div>
    </div>}
  </div>;
}

function formatDate(value){return new Date(value).toLocaleString([], {dateStyle:'medium',timeStyle:'short'})}
function rangeFor(preset){const now=new Date();let start=new Date(now);if(preset==='Today')start.setHours(0,0,0,0);if(preset==='This week'){const day=(now.getDay()+6)%7;start.setDate(now.getDate()-day);start.setHours(0,0,0,0)}if(preset==='This month')start=new Date(now.getFullYear(),now.getMonth(),1);if(preset==='This year')start=new Date(now.getFullYear(),0,1);return{from:localDate(start),to:localDate(now)}}
function localDate(value){const offset=value.getTimezoneOffset()*60000;return new Date(value-offset).toISOString().slice(0,10)}
