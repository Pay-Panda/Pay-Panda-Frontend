import { useCallback,useRef,useState } from 'react';
import { AlertTriangle,CheckCircle2,Info,X,XCircle } from 'lucide-react';
import { UiStore } from './ui-store';
import useModalEnter from '../hooks/useModalEnter';

const MAX_TOASTS = 3;
const TOAST_DURATION_MS = 3500;

export function UiProvider({children}){
  const [dialog,setDialog]=useState(null);const [toasts,setToasts]=useState([]);
  const dialogRef=useRef(null);
  useModalEnter(dialogRef,'.global-dialog',Boolean(dialog));
  const confirm=useCallback(options=>new Promise(resolve=>setDialog({title:'Confirm action',message:'Are you sure?',tone:'warning',confirmLabel:'Confirm',...options,resolve})),[]);
  const toast=useCallback((message,type='success')=>{const id=Date.now()+Math.random();setToasts(current=>[...current,{id,message,type}].slice(-MAX_TOASTS));setTimeout(()=>setToasts(current=>current.filter(item=>item.id!==id)),TOAST_DURATION_MS)},[]);
  const close=value=>{dialog?.resolve(value);setDialog(null)};
  return <UiStore.Provider value={{confirm,toast}}>{children}{dialog&&<div className="global-dialog-backdrop" ref={dialogRef} onMouseDown={()=>close(false)}><div className={`global-dialog ${dialog.tone}`} onMouseDown={event=>event.stopPropagation()}><button className="dialog-x" onClick={()=>close(false)}><X/></button><div className="dialog-symbol"><AlertTriangle/></div><h3>{dialog.title}</h3><p>{dialog.message}</p><div className="dialog-actions"><button className="dialog-cancel" onClick={()=>close(false)}>{dialog.cancelLabel||'Cancel'}</button><button className="dialog-confirm" onClick={()=>close(true)}>{dialog.confirmLabel}</button></div></div></div>}<div className="toast-stack" aria-live="polite" aria-atomic="true">{toasts.map(item=><div className={`app-toast ${item.type}`} key={item.id}>{item.type==='success'?<CheckCircle2/>:item.type==='error'?<XCircle/>:<Info/>}<span>{item.message}</span><button aria-label="Dismiss notification" onClick={()=>setToasts(current=>current.filter(entry=>entry.id!==item.id))}><X/></button></div>)}</div></UiStore.Provider>;
}
