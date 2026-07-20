import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Clock3, Copy, KeyRound, RefreshCw, Save, SendHorizontal, ShieldCheck, Trash2, Webhook, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import PageHeader from '../components/PageHeader';
import PasswordInput from '../components/PasswordInput';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../state/auth-store';
import { useUi } from '../state/ui-store';
import { copyToClipboard } from '../lib/clipboard';
import useModalEnter from '../hooks/useModalEnter';

export default function SettingsPage(){
  const [expiry,setExpiry]=useState(10);const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);const [passwords,setPasswords]=useState({currentPassword:'',newPassword:'',confirmPassword:''});const [passwordState,setPasswordState]=useState({busy:false,error:'',success:''});const {logout}=useAuth();const navigate=useNavigate();const {toast}=useUi();
  const [hasPassword,setHasPassword]=useState(true);
  useEffect(()=>{api.get('/auth/me').then(({data})=>{setExpiry(data.user.business.paymentExpiryMins||10);setHasPassword(Boolean(data.user.hasPassword))})},[]);
  const save=async()=>{setBusy(true);try{await api.patch('/dashboard/settings',{paymentExpiryMins:Number(expiry)});setMessage('Default payment expiry updated.');toast('Default payment expiry updated','success');setTimeout(()=>setMessage(''),2500)}catch(err){toast(err.response?.data?.message||'Could not save default expiry','error')}finally{setBusy(false)}};
  const changePassword=async event=>{event.preventDefault();setPasswordState({busy:true,error:'',success:''});try{const {data}=await api.post('/auth/change-password',passwords);setPasswordState({busy:false,error:'',success:data.message});toast('Password changed. Please sign in again.','success');setTimeout(()=>{logout();navigate('/login',{replace:true})},1800)}catch(err){const message=err.response?.data?.message||'Password change failed.';setPasswordState({busy:false,error:message,success:''});toast(message,'error')}};
  const strength=passwordStrength(passwords.newPassword);
  const [showDelete,setShowDelete]=useState(false);
  const [deleteForm,setDeleteForm]=useState({password:'',confirm:''});
  const [deleteState,setDeleteState]=useState({busy:false,error:''});
  const modalRef=useRef(null);
  useModalEnter(modalRef,'.modal-card',showDelete);
  const openDelete=()=>{setDeleteForm({password:'',confirm:''});setDeleteState({busy:false,error:''});setShowDelete(true)};
  const deleteAccount=async event=>{
    event.preventDefault();
    setDeleteState({busy:true,error:''});
    try{
      await api.delete('/auth/account',{data:{confirm:deleteForm.confirm,...(hasPassword?{password:deleteForm.password}:{})}});
      toast('Your account has been deleted.','success');
      logout();navigate('/',{replace:true});
    }catch(err){
      const errMessage=err.response?.data?.message||'Could not delete account.';
      setDeleteState({busy:false,error:errMessage});
    }
  };
  return <><PageHeader eyebrow="Settings" title="Workspace and security" description="Configure payment defaults and protect access to your Pay-Panda account."/><div className="settings-stack">
    <section className="panel overflow-hidden rounded-[var(--radius-lg)] border border-line bg-panel shadow-panel settings-card"><div className="settings-icon"><Clock3/></div><div><h3>Default payment expiry</h3><p>Pending payment sessions automatically expire after this duration. Existing sessions keep their original expiry.</p><select value={expiry} onChange={e=>setExpiry(e.target.value)}><option value="5">5 minutes</option><option value="10">10 minutes</option><option value="15">15 minutes</option><option value="30">30 minutes</option><option value="60">60 minutes</option></select>{message&&<span className="saved-message">{message}</span>}</div><button className="primary-button inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border-0 bg-gradient-to-br from-violet-600 to-indigo-500 px-4 font-bold text-white shadow-[var(--shadow-glow-accent)] transition disabled:cursor-not-allowed disabled:opacity-60" onClick={save} disabled={busy}>{busy?<RefreshCw className="spin animate-spin"/>:<Save/>}{busy?'Saving…':'Save default'}</button></section>
    <section className="panel overflow-hidden rounded-[var(--radius-lg)] border border-line bg-panel shadow-panel password-settings"><div className="password-settings-head"><div className="settings-icon"><KeyRound/></div><div><h3>Change password</h3><p>Changing your password signs out every active Pay-Panda session.</p></div><span><ShieldCheck/>Session protection</span></div><form onSubmit={changePassword}><label>Current password<PasswordInput required value={passwords.currentPassword} onChange={e=>setPasswords({...passwords,currentPassword:e.target.value})}/></label><label>New password<PasswordInput minLength="6" required value={passwords.newPassword} onChange={e=>setPasswords({...passwords,newPassword:e.target.value})}/><div className="password-strength mt-2"><div className="strength-track h-1.5 overflow-hidden rounded-full bg-line"><i style={{width:`${strength.score*25}%`}} className={`strength-${strength.score}`}/></div><div><span>{strength.label}</span><small>Minimum 6 characters</small></div></div></label><label>Confirm new password<PasswordInput minLength="6" required value={passwords.confirmPassword} onChange={e=>setPasswords({...passwords,confirmPassword:e.target.value})}/>{passwords.confirmPassword&&passwords.newPassword!==passwords.confirmPassword&&<span className="field-error mt-1 block text-small text-red">Passwords do not match.</span>}</label>{passwordState.error&&<div className="alert mt-4 rounded-xl px-4 py-3 text-small error border border-red/25 bg-red/10 text-red">{passwordState.error}</div>}{passwordState.success&&<div className="alert mt-4 rounded-xl px-4 py-3 text-small success border border-green/25 bg-green/10 text-green">{passwordState.success}</div>}<button className="primary-button inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border-0 bg-gradient-to-br from-violet-600 to-indigo-500 px-4 font-bold text-white shadow-[var(--shadow-glow-accent)] transition disabled:cursor-not-allowed disabled:opacity-60" disabled={passwordState.busy||Boolean(passwords.confirmPassword&&passwords.newPassword!==passwords.confirmPassword)}>{passwordState.busy&&<RefreshCw className="spin animate-spin"/>}{passwordState.busy?'Changing…':'Change password'}</button></form></section>
    <WebhookSettings/>
    <section className="panel overflow-hidden rounded-[var(--radius-lg)] border border-line bg-panel shadow-panel settings-card danger-zone"><div className="settings-icon danger"><AlertTriangle/></div><div><h3>Delete account</h3><p>Permanently deletes your account. If you're the only user on this business, the entire workspace — connections, payments, and history — is deleted too. This cannot be undone.</p></div><button className="risk-button inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] border border-red/25 bg-red/10 px-3 text-small text-red transition hover:bg-red/15" onClick={openDelete}><Trash2 size={16}/>Delete my account</button></section>
  </div>
  {showDelete&&<div className="modal-backdrop fixed inset-0 z-[100] grid place-items-center bg-black/70 p-5 backdrop-blur-sm" ref={modalRef} onMouseDown={()=>setShowDelete(false)}>
    <div className="modal-card relative max-h-[90vh] w-[min(520px,100%)] overflow-auto rounded-[19px] border border-line bg-panel p-7 shadow-elevated" onMouseDown={e=>e.stopPropagation()}>
      <button className="modal-close absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-xl border border-line bg-transparent text-text transition hover:border-accent" onClick={()=>setShowDelete(false)}><X/></button>
      <h2>Delete your account</h2>
      <form onSubmit={deleteAccount}>
        <p>This permanently deletes your Pay-Panda account and cannot be undone. Type <strong>DELETE</strong> to confirm.</p>
        {hasPassword&&<label>Current password<PasswordInput required value={deleteForm.password} onChange={e=>setDeleteForm({...deleteForm,password:e.target.value})}/></label>}
        <label>Type DELETE to confirm<input required value={deleteForm.confirm} onChange={e=>setDeleteForm({...deleteForm,confirm:e.target.value})} placeholder="DELETE"/></label>
        {deleteState.error&&<div className="alert mt-4 rounded-xl px-4 py-3 text-small error border border-red/25 bg-red/10 text-red">{deleteState.error}</div>}
        <button className="primary-button inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border-0 bg-gradient-to-br from-violet-600 to-indigo-500 px-4 font-bold text-white shadow-[var(--shadow-glow-accent)] transition disabled:cursor-not-allowed disabled:opacity-60 danger-confirm" disabled={deleteState.busy||deleteForm.confirm!=='DELETE'}>{deleteState.busy?<RefreshCw className="spin animate-spin"/>:<Trash2/>}{deleteState.busy?'Deleting…':'Permanently delete my account'}</button>
      </form>
    </div>
  </div>}</>;
}

function WebhookSettings(){
  const { toast } = useUi();
  const [webhook,setWebhook]=useState({url:'',secretConfigured:false,secret:''});
  const [url,setUrl]=useState('');
  const [busy,setBusy]=useState(false);
  const [testing,setTesting]=useState(false);
  const [deliveries,setDeliveries]=useState([]);
  const load=()=>{
    api.get('/dashboard/webhook').then(({data})=>{setWebhook(data.webhook);setUrl(data.webhook.url||'')}).catch(()=>toast('Could not load webhook settings','error'));
    api.get('/dashboard/webhook/deliveries',{params:{limit:5}}).then(({data})=>setDeliveries(data.deliveries)).catch(()=>{});
  };
  useEffect(()=>{load()},[]); // eslint-disable-line react-hooks/exhaustive-deps
  const save=async()=>{
    setBusy(true);
    try{const {data}=await api.patch('/dashboard/webhook',{url:url||null});setWebhook(data.webhook);toast('Webhook URL saved','success');load()}
    catch(err){toast(err.response?.data?.message||'Could not save webhook URL','error')}
    finally{setBusy(false)}
  };
  const regenerate=async()=>{
    setBusy(true);
    try{const {data}=await api.post('/dashboard/webhook/regenerate-secret');setWebhook(data.webhook);toast('Webhook secret regenerated','success')}
    catch(err){toast(err.response?.data?.message||'Could not regenerate secret','error')}
    finally{setBusy(false)}
  };
  const sendTest=async()=>{
    setTesting(true);
    try{const {data}=await api.post('/dashboard/webhook/test');toast(data.result.ok?`Test webhook delivered (HTTP ${data.result.status})`:`Endpoint responded with HTTP ${data.result.status}`,data.result.ok?'success':'error');load()}
    catch(err){toast(err.response?.data?.message||'Test webhook failed','error')}
    finally{setTesting(false)}
  };
  const copySecret=async()=>{try{await copyToClipboard(webhook.secret);toast('Webhook secret copied','success')}catch{toast('Could not copy secret','error')}};
  return <section className="panel overflow-hidden rounded-[var(--radius-lg)] border border-line bg-panel shadow-panel settings-card webhook-settings">
    <div className="settings-icon"><Webhook/></div>
    <div>
      <h3>Webhooks</h3>
      <p>Get an HMAC-signed HTTP callback the moment a payment succeeds or expires, instead of polling. Failed deliveries retry with backoff for up to 12 hours.</p>
      <label>Endpoint URL<input type="url" placeholder="https://your-server.example.com/webhooks/pay-panda" value={url} onChange={e=>setUrl(e.target.value)}/></label>
      {webhook.secretConfigured&&<div className="webhook-secret-row flex items-center gap-2 mt-2"><code className="flex-1 truncate rounded-lg border border-line bg-panel-inset px-3 py-2 text-small">{webhook.secret}</code><button className="icon-button grid h-10 w-10 place-items-center rounded-xl border border-line bg-panel text-text transition hover:border-accent" title="Copy secret" onClick={copySecret}><Copy size={16}/></button></div>}
      {deliveries.length>0&&<div className="webhook-deliveries mt-4"><small className="text-muted">Recent deliveries</small><ul className="mt-2 space-y-1.5">{deliveries.map(d=><li key={d.id} className="flex items-center justify-between gap-3 text-small"><span>{d.event}</span><StatusBadge status={d.status}/><small className="text-muted">{new Date(d.lastAttemptAt||d.createdAt).toLocaleString()}</small></li>)}</ul></div>}
    </div>
    <div className="webhook-actions flex flex-wrap gap-2">
      <button className="primary-button inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border-0 bg-gradient-to-br from-violet-600 to-indigo-500 px-4 font-bold text-white shadow-[var(--shadow-glow-accent)] transition disabled:cursor-not-allowed disabled:opacity-60" onClick={save} disabled={busy}>{busy?<RefreshCw className="spin animate-spin"/>:<Save/>}Save</button>
      {webhook.secretConfigured&&<button className="secondary-button inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-line bg-transparent px-4 text-small font-bold text-text transition hover:border-accent" onClick={regenerate} disabled={busy}><RefreshCw size={16}/>Regenerate secret</button>}
      {webhook.secretConfigured&&<button className="secondary-button inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-line bg-transparent px-4 text-small font-bold text-text transition hover:border-accent" onClick={sendTest} disabled={testing}><SendHorizontal size={16}/>{testing?'Sending…':'Send test'}</button>}
    </div>
  </section>;
}

function passwordStrength(value){if(!value)return{score:0,label:'Enter a secure password'};let score=0;if(value.length>=6)score++;if(/[a-z]/.test(value)&&/[A-Z]/.test(value))score++;if(/\d/.test(value))score++;if(/[^A-Za-z\d]/.test(value)&&!/\s/.test(value))score++;return{score,label:['Very weak','Weak','Fair','Good','Strong'][score]}}
