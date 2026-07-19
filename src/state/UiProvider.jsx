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
  return <UiStore.Provider value={{confirm,toast}}>{children}{dialog&&<div className="global-dialog-backdrop fixed inset-0 z-[300] grid place-items-center bg-black/70 p-5 backdrop-blur-sm" ref={dialogRef} onMouseDown={()=>close(false)}><div className={`global-dialog relative w-[min(420px,100%)] rounded-2xl border border-line bg-panel p-6 text-center shadow-elevated ${dialog.tone}`} onMouseDown={event=>event.stopPropagation()}><button className="dialog-x absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-xl border border-line bg-transparent text-text" onClick={()=>close(false)}><X/></button><div className="dialog-symbol mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-amber/10 text-amber"><AlertTriangle/></div><h3>{dialog.title}</h3><p>{dialog.message}</p><div className="dialog-actions mt-4 grid w-full grid-cols-2 gap-3"><button className="dialog-cancel h-10 rounded-xl border border-line bg-transparent px-4 text-small font-bold text-text" onClick={()=>close(false)}>{dialog.cancelLabel||'Cancel'}</button><button className="dialog-confirm h-10 rounded-xl border-0 bg-accent-contrast px-4 text-small font-bold text-white" onClick={()=>close(true)}>{dialog.confirmLabel}</button></div></div></div>}<div className="toast-stack fixed right-5 top-5 z-[400] grid w-[min(390px,calc(100vw-40px))] gap-2 pointer-events-none" aria-live="polite" aria-atomic="true">{toasts.map(item=><div className={`app-toast pointer-events-auto grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-2xl border border-line border-l-4 border-l-accent bg-panel px-4 py-3 text-small font-extrabold shadow-elevated ${item.type}`} key={item.id}>{item.type==='success'?<CheckCircle2/>:item.type==='error'?<XCircle/>:<Info/>}<span>{item.message}</span><button aria-label="Dismiss notification" onClick={()=>setToasts(current=>current.filter(entry=>entry.id!==item.id))}><X/></button></div>)}</div></UiStore.Provider>;
}
