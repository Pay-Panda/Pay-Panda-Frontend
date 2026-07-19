import { useEffect,useRef,useState } from 'react';
import { Check,Copy,KeyRound,Plus,RefreshCw,ShieldAlert,Trash2,X } from 'lucide-react';
import api from '../lib/api';
import PageHeader from '../components/PageHeader';
import { useUi } from '../state/ui-store';
import { copyToClipboard } from '../lib/clipboard';
import useStagger from '../hooks/useStagger';
import useModalEnter from '../hooks/useModalEnter';

export default function ApiKeysPage(){
  const {confirm,toast}=useUi();
  const [clients,setClients]=useState([]);const [name,setName]=useState('Production');const [secret,setSecret]=useState(null);const [copied,setCopied]=useState('');
  const [units,setUnits]=useState([]);const [businessUnitId,setBusinessUnitId]=useState('');
  const [loading,setLoading]=useState(true);const [creating,setCreating]=useState(false);const [busyId,setBusyId]=useState('');
  const [showCreate,setShowCreate]=useState(false);
  const rootRef=useRef(null);const secretRef=useRef(null);const createRef=useRef(null);
  const load=()=>api.get('/clients').then(({data})=>setClients(data.clients)).finally(()=>setLoading(false));
  useEffect(()=>{load();api.get('/dashboard/business-units').then(({data})=>setUnits(data.units.filter(unit=>unit.active))).catch(()=>{})},[]);
  useStagger(rootRef, '.client-list article', { dependency: clients.length });
  useModalEnter(secretRef, '.credential-modal', Boolean(secret));
  useModalEnter(createRef, '.credential-create-modal', showCreate);
  const openCreate=()=>{setName('Production');setBusinessUnitId('');setShowCreate(true)};
  const create=async event=>{
    event?.preventDefault();
    const credentialName=name.trim();
    if(!credentialName){toast('Enter a credential name before continuing.','error');return}
    const selectedUnit=units.find(unit=>unit.id===businessUnitId);
    const ok=await confirm({
      title:'Create app credentials?',
      message:selectedUnit
        ?`Create "${credentialName}" restricted to sub-business "${selectedUnit.name}"? Every payment made with this credential will be attributed to it, and this cannot be changed later — you'd need to revoke it and create a new one.`
        :`Create "${credentialName}" with no sub-business restriction? It will be able to create and manage payments across the whole business.`,
      confirmLabel:'Create credentials',tone:'warning',
    });
    if(!ok)return;
    setCreating(true);
    try{const {data}=await api.post('/clients',{name:credentialName,businessUnitId:businessUnitId||undefined});setSecret(data.client);setShowCreate(false);setName('Production');setBusinessUnitId('');toast('App credentials created','success');await load()}catch(err){toast(err.response?.data?.message||'Could not create credentials','error')}finally{setCreating(false)}
  };
  const rotate=async client=>{if(!await confirm({title:'Rotate App Secret?',message:`The previous secret for ${client.name} will stop working immediately.`,confirmLabel:'Rotate secret',tone:'danger'}))return;setBusyId(client.id);try{const {data}=await api.post(`/clients/${client.id}/rotate`);setSecret({...client,...data.client});toast('App Secret rotated');await load()}catch(err){toast(err.response?.data?.message||'Could not rotate secret','error')}finally{setBusyId('')}};
  const revoke=async client=>{if(!await confirm({title:'Revoke credentials?',message:`${client.name} will immediately lose API access.`,confirmLabel:'Revoke',tone:'danger'}))return;setBusyId(client.id);try{await api.post(`/clients/${client.id}/revoke`);toast('App credentials revoked','info');await load()}catch(err){toast(err.response?.data?.message||'Could not revoke credentials','error')}finally{setBusyId('')}};
  const copy=async(value,type)=>{try{await copyToClipboard(value);setCopied(type);toast(type==='secret'?'App Secret copied securely':'App ID copied','success');setTimeout(()=>setCopied(''),1800)}catch{toast('Could not copy. Please copy manually.','error')}};
  const activeCount=clients.filter(client=>client.active).length;
  return <div ref={rootRef}><PageHeader eyebrow="API setup" title="App credentials" description="Issue, rotate, and revoke OAuth credentials for server-to-server integrations." action={<div className="credential-limit"><span>{activeCount}/5 active</span><button className="primary-button compact" onClick={openCreate} disabled={activeCount>=5||creating}>{creating?<RefreshCw className="spin"/>:<Plus/>}{creating?'Creating…':'Create credentials'}</button></div>}/>
    {showCreate&&<div className="modal-backdrop" ref={createRef} onMouseDown={()=>!creating&&setShowCreate(false)}><form className="modal-card credential-create-modal" onSubmit={create} onMouseDown={event=>event.stopPropagation()}><button type="button" className="modal-close" onClick={()=>setShowCreate(false)} disabled={creating}><X/></button><div className="modal-kicker"><KeyRound/></div><p className="eyebrow accent">OAuth application</p><h2>Create app credentials</h2><p className="modal-subcopy">Give this integration a clear name and optionally lock it to one sub-business. The App Secret is shown only once after creation.</p><label>Credential name<input autoFocus required maxLength="80" value={name} onChange={e=>setName(e.target.value)} placeholder="Production, Shopify store, Mobile app"/></label>{units.length>0&&<label>Restrict to sub-business (optional)<select value={businessUnitId} onChange={e=>setBusinessUnitId(e.target.value)}><option value="">No restriction — whole business</option>{units.map(unit=><option key={unit.id} value={unit.id}>{unit.name} ({unit.code})</option>)}</select><small>Use this when one app should create and verify payments only for a specific branch or sub-business.</small></label>}<div className="credential-create-note"><ShieldAlert/><span>Store the App Secret in your backend only. Never paste it into frontend JavaScript or mobile app code.</span></div><div className="dialog-actions credential-form-actions"><button type="button" className="dialog-cancel" onClick={()=>setShowCreate(false)} disabled={creating}>Cancel</button><button type="submit" className="dialog-confirm" disabled={creating}>{creating?<RefreshCw className="spin"/>:<Plus/>}Continue</button></div></form></div>}
    {secret&&<div className="modal-backdrop" ref={secretRef}><section className="secret-vault credential-modal"><div className="vault-icon"><ShieldAlert/></div><div className="vault-copy"><p className="eyebrow">One-time secret</p><h3>{secret.name||'Application'} credentials created</h3><p>This is the only time the App Secret will be available. Store it in your backend secret manager. Never put it in frontend code.</p>{secret.businessUnit&&<p className="credential-scope-note">Scoped to sub-business <strong>{secret.businessUnit.name}</strong> — every payment created with this credential will be attributed to it, and it cannot read or create payments for any other sub-business.</p>}<div className="vault-fields"><div><small>App ID</small><code>{secret.appId}</code><button onClick={()=>copy(secret.appId,'id')}>{copied==='id'?<Check/>:<Copy/>}<span>{copied==='id'?'Copied':'Copy ID'}</span></button></div><div className="secret-field"><small>App Secret</small><code>••••••••••••••••••••••••••••••••</code><button className="copy-secret-button" onClick={()=>copy(secret.appSecret,'secret')}>{copied==='secret'?<Check/>:<Copy/>}<span>{copied==='secret'?'Copied':'Copy secret'}</span></button></div></div></div><button className="vault-dismiss" onClick={()=>setSecret(null)}>I saved it safely</button></section></div>}
    <section className="panel"><div className="panel-heading"><div><h3>OAuth applications</h3><p>Use a separate credential pair for each integration.</p></div></div><div className="client-list">{loading?<div className="empty-state"><RefreshCw className="spin"/><p>Loading credentials…</p></div>:clients.length?clients.map(client=><article className={!client.active?'revoked':''} key={client.id}><div className="client-icon"><KeyRound/></div><div><strong>{client.name}</strong><code>{client.appId}</code>{client.businessUnit&&<small className="credential-scope-tag">Scoped to {client.businessUnit.name}</small>}</div><span className={`status ${client.active?'status-active':'status-expired'}`}><i/>{client.active?'Active':'Revoked'}</span><small>{client.lastUsedAt?`Last used ${new Date(client.lastUsedAt).toLocaleString()}`:'Never used'}</small><div className="credential-actions">{client.active&&<button onClick={()=>rotate(client)} disabled={busyId===client.id}>{busyId===client.id?<RefreshCw className="spin"/>:<RefreshCw/>}Rotate</button>}<button className="danger-text" onClick={()=>revoke(client)} disabled={!client.active||busyId===client.id}><Trash2/>Revoke</button></div></article>):<div className="empty-state"><KeyRound/><h4>No app credentials</h4><p>Create a credential pair to use the payment API.</p></div>}</div></section>
  </div>;
}
