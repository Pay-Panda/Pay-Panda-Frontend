import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Clock3, KeyRound, RefreshCw, Save, ShieldCheck, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import PageHeader from '../components/PageHeader';
import PasswordInput from '../components/PasswordInput';
import { useAuth } from '../state/auth-store';
import { useUi } from '../state/ui-store';
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
    <section className="panel settings-card"><div className="settings-icon"><Clock3/></div><div><h3>Default payment expiry</h3><p>Pending payment sessions automatically expire after this duration. Existing sessions keep their original expiry.</p><select value={expiry} onChange={e=>setExpiry(e.target.value)}><option value="5">5 minutes</option><option value="10">10 minutes</option><option value="15">15 minutes</option><option value="30">30 minutes</option><option value="60">60 minutes</option></select>{message&&<span className="saved-message">{message}</span>}</div><button className="primary-button" onClick={save} disabled={busy}>{busy?<RefreshCw className="spin"/>:<Save/>}{busy?'Saving…':'Save default'}</button></section>
    <section className="panel password-settings"><div className="password-settings-head"><div className="settings-icon"><KeyRound/></div><div><h3>Change password</h3><p>Changing your password signs out every active Pay-Panda session.</p></div><span><ShieldCheck/>Session protection</span></div><form onSubmit={changePassword}><label>Current password<PasswordInput required value={passwords.currentPassword} onChange={e=>setPasswords({...passwords,currentPassword:e.target.value})}/></label><label>New password<PasswordInput minLength="6" required value={passwords.newPassword} onChange={e=>setPasswords({...passwords,newPassword:e.target.value})}/><div className="password-strength"><div className="strength-track"><i style={{width:`${strength.score*25}%`}} className={`strength-${strength.score}`}/></div><div><span>{strength.label}</span><small>Minimum 6 characters</small></div></div></label><label>Confirm new password<PasswordInput minLength="6" required value={passwords.confirmPassword} onChange={e=>setPasswords({...passwords,confirmPassword:e.target.value})}/>{passwords.confirmPassword&&passwords.newPassword!==passwords.confirmPassword&&<span className="field-error">Passwords do not match.</span>}</label>{passwordState.error&&<div className="alert error">{passwordState.error}</div>}{passwordState.success&&<div className="alert success">{passwordState.success}</div>}<button className="primary-button" disabled={passwordState.busy||Boolean(passwords.confirmPassword&&passwords.newPassword!==passwords.confirmPassword)}>{passwordState.busy&&<RefreshCw className="spin"/>}{passwordState.busy?'Changing…':'Change password'}</button></form></section>
    <section className="panel settings-card danger-zone"><div className="settings-icon danger"><AlertTriangle/></div><div><h3>Delete account</h3><p>Permanently deletes your account. If you're the only user on this business, the entire workspace — connections, payments, and history — is deleted too. This cannot be undone.</p></div><button className="risk-button" onClick={openDelete}><Trash2 size={16}/>Delete my account</button></section>
  </div>
  {showDelete&&<div className="modal-backdrop" ref={modalRef} onMouseDown={()=>setShowDelete(false)}>
    <div className="modal-card" onMouseDown={e=>e.stopPropagation()}>
      <button className="modal-close" onClick={()=>setShowDelete(false)}><X/></button>
      <h2>Delete your account</h2>
      <form onSubmit={deleteAccount}>
        <p>This permanently deletes your Pay-Panda account and cannot be undone. Type <strong>DELETE</strong> to confirm.</p>
        {hasPassword&&<label>Current password<PasswordInput required value={deleteForm.password} onChange={e=>setDeleteForm({...deleteForm,password:e.target.value})}/></label>}
        <label>Type DELETE to confirm<input required value={deleteForm.confirm} onChange={e=>setDeleteForm({...deleteForm,confirm:e.target.value})} placeholder="DELETE"/></label>
        {deleteState.error&&<div className="alert error">{deleteState.error}</div>}
        <button className="primary-button danger-confirm" disabled={deleteState.busy||deleteForm.confirm!=='DELETE'}>{deleteState.busy?<RefreshCw className="spin"/>:<Trash2/>}{deleteState.busy?'Deleting…':'Permanently delete my account'}</button>
      </form>
    </div>
  </div>}</>;
}

function passwordStrength(value){if(!value)return{score:0,label:'Enter a secure password'};let score=0;if(value.length>=6)score++;if(/[a-z]/.test(value)&&/[A-Z]/.test(value))score++;if(/\d/.test(value))score++;if(/[^A-Za-z\d]/.test(value)&&!/\s/.test(value))score++;return{score,label:['Very weak','Weak','Fair','Good','Strong'][score]}}
