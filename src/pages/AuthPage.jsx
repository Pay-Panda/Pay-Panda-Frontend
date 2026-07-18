import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import { GoogleLogin } from '@react-oauth/google';
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../state/auth-store';
import { useUi } from '../state/ui-store';
import PasswordInput from '../components/PasswordInput';
import AuthLoader from '../components/AuthLoader';
import OtpInput from '../components/OtpInput';
import { gsap, REDUCED_MOTION_QUERY, EASE_ENTRANCE } from '../lib/motion';
import payLogo from '../assets/logo.png';

const OTP_RESEND_SECONDS = 60;

const countryCodes = [
  ['91', 'India +91'], ['1', 'US/Canada +1'], ['44', 'UK +44'], ['61', 'Australia +61'],
  ['971', 'UAE +971'], ['65', 'Singapore +65'], ['60', 'Malaysia +60'], ['49', 'Germany +49'],
];

export default function AuthPage({ mode }) {
  const signup = mode === 'signup';
  const [form, setForm] = useState({ name: '', businessName: '', email: '', mobile: '', countryCode: '91', password: '' });
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const [activation, setActivation] = useState(null);
  const [needsActivation,setNeedsActivation]=useState(false);
  const [otpState,setOtpState]=useState(null);const [otp,setOtp]=useState('');
  const { authenticate } = useAuth(); const navigate = useNavigate(); const { toast } = useUi();
  const submit = async event => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const signupPayload={...form,mobile:form.mobile?`+${form.countryCode}${form.mobile}`:undefined,countryCode:undefined};
      const { data } = await api.post(`/auth/${signup ? 'register' : 'login'}`, signup ? signupPayload : { email: form.email, password: form.password });
      if (signup) {
        setActivation({ message: data.message, url: data.developmentActivationUrl });
      } else {
        if(data.requiresOtp)setOtpState(data);else{authenticate(data.token,data.user);navigate('/dashboard')}
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to continue. Please try again.';
      setNeedsActivation(err.response?.data?.code==='ACCOUNT_NOT_ACTIVATED');setError(message);toast(message,'error');
    }
    finally { setBusy(false); }
  };
  const [resendCooldown,setResendCooldown]=useState(0);
  const verifyOtp=async(event,codeOverride)=>{event?.preventDefault();const code=codeOverride??otp;if(busy||code.length!==6)return;setBusy(true);setError('');try{const {data}=await api.post('/auth/verify-login-otp',{challenge:otpState.challenge,otp:code});authenticate(data.token,data.user);navigate('/dashboard')}catch(err){const message=err.response?.data?.message||'Could not verify login code';setError(message);toast(message,'error');setOtp('')}finally{setBusy(false)}};
  const resendOtp=async()=>{if(resendCooldown>0)return;setBusy(true);setError('');try{const {data}=await api.post('/auth/login',{email:form.email,password:form.password});setOtpState(data);setOtp('')}catch(err){const message=err.response?.data?.message||'Could not resend code';setError(message);toast(message,'error')}finally{setBusy(false)}};
  const googleSignIn=async credentialResponse=>{setBusy(true);setError('');try{const {data}=await api.post('/auth/google',{credential:credentialResponse.credential});authenticate(data.token,data.user);navigate('/dashboard')}catch(err){const message=err.response?.data?.message||'Could not sign in with Google.';setError(message);toast(message,'error')}finally{setBusy(false)}};
  const googleWrapRef=useRef(null);const [googleBtnWidth,setGoogleBtnWidth]=useState(320);
  useEffect(()=>{
    const el=googleWrapRef.current;if(!el)return;
    const update=()=>setGoogleBtnWidth(Math.max(200,Math.round(el.getBoundingClientRect().width)));
    update();
    const observer=new ResizeObserver(update);observer.observe(el);
    return ()=>observer.disconnect();
  },[]);
  useEffect(()=>{
    if(!otpState)return;
    setResendCooldown(OTP_RESEND_SECONDS);
    const timer=setInterval(()=>setResendCooldown(current=>current<=1?(clearInterval(timer),0):current-1),1000);
    return ()=>clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only restart the cooldown when a new OTP challenge is issued
  },[otpState?.challenge]);
  useEffect(()=>{
    if(otp.length===6&&!busy)verifyOtp(null,otp);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only auto-verify when the typed code itself changes
  },[otp]);
  const strength = passwordStrength(form.password);
  const storyRef = useRef(null);
  const panelRef = useRef(null);
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(REDUCED_MOTION_QUERY, () => {
      gsap.from(storyRef.current, { autoAlpha: 0, y: 22, duration: 0.5, ease: EASE_ENTRANCE });
    });
    return () => mm.revert();
  }, { scope: storyRef, dependencies: [] });
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(REDUCED_MOTION_QUERY, () => {
      gsap.from(panelRef.current, { autoAlpha: 0, x: 20, duration: 0.4, ease: EASE_ENTRANCE });
    });
    return () => mm.revert();
  }, { scope: panelRef, dependencies: [Boolean(otpState)], revertOnUpdate: true });
  return <div className="auth-layout">
    {busy && <div className="auth-loading-overlay"><AuthLoader label={otpState?'Verifying your code…':signup?'Creating your workspace…':'Signing you in…'}/></div>}
    <section className="auth-story">
      <Link className="brand auth-brand" to="/"><img className="brand-mark" src={payLogo} alt="Pay-Panda" /><strong>Pay-Panda</strong></Link>
      <div ref={storyRef}>
        <p className="eyebrow accent">UPI infrastructure for modern teams</p>
        <h1>Payments that confirm themselves.</h1>
        <p>Connect your business QR, create payment sessions through one API, and verify incoming payments in seconds.</p>
        <ul><li><CheckCircle2/>OAuth-secured payment APIs</li><li><CheckCircle2/>Live BharatPe verification</li><li><CheckCircle2/>Hosted, branded checkout</li></ul>
      </div>
      <div className="security-note"><ShieldCheck/><span>Business tokens are encrypted before storage.</span></div>
    </section>
    <main className="auth-panel" ref={panelRef}>{otpState?<form onSubmit={verifyOtp}><p className="eyebrow accent">Two-step verification</p><h2>Enter your login code</h2><p>We sent a six-digit OTP to <strong>{otpState.maskedEmail}</strong>. The code expires in 10 minutes.</p><label>Login OTP<OtpInput value={otp} onChange={setOtp} disabled={busy} autoFocus/></label>{error&&<div className="alert error">{error}</div>}<button className="primary-button" disabled={busy||otp.length!==6}>{busy?'Verifying…':'Verify and sign in'}<ArrowRight/></button><button className="resend-button" type="button" onClick={resendOtp} disabled={busy||resendCooldown>0}>{resendCooldown>0?`Resend code in ${resendCooldown}s`:'Send a new code'}</button><button className="otp-back" type="button" onClick={()=>{setOtpState(null);setOtp('');setError('')}}>Use different credentials</button></form>:<form onSubmit={submit}>
      <p className="eyebrow accent">{signup ? 'Create workspace' : 'Welcome back'}</p>
      <h2>{signup ? 'Start with Pay-Panda' : 'Sign in to your dashboard'}</h2>
      <p>{signup ? 'Set up your business in under two minutes.' : 'Manage your gateway and payments.'}</p>
      <div className="google-auth-wrap" ref={googleWrapRef}><div className="google-auth-skeleton" aria-hidden="true"/><GoogleLogin onSuccess={googleSignIn} onError={()=>{setError('Could not sign in with Google.');toast('Could not sign in with Google.','error')}} text={signup?'signup_with':'signin_with'} shape="pill" width={googleBtnWidth}/></div>
      <div className="auth-divider"><span>or</span></div>
      {signup && <div className="form-grid"><label>Full name<input required value={form.name} onChange={e => setForm({...form,name:e.target.value})}/></label><label>Business name<input required value={form.businessName} onChange={e => setForm({...form,businessName:e.target.value})}/></label></div>}
      <label>Email address<input type="email" required value={form.email} onChange={e => setForm({...form,email:e.target.value})}/></label>
      {signup && <label>Mobile number<div className="phone-input"><select aria-label="Country code" value={form.countryCode} onChange={e => setForm({...form,countryCode:e.target.value,mobile:''})}>{countryCodes.map(([code,label]) => <option key={code} value={code}>{label}</option>)}</select><input required inputMode="numeric" maxLength={form.countryCode==='91'?10:14} minLength={form.countryCode==='91'?10:7} pattern={form.countryCode==='91'?'[0-9]{10}':'[0-9]{7,14}'} title={form.countryCode==='91'?'Enter exactly 10 digits for an Indian mobile number':'Enter 7 to 14 digits'} placeholder={form.countryCode==='91'?'10-digit mobile':'Mobile number'} value={form.mobile} onChange={e => setForm({...form,mobile:e.target.value.replace(/\D/g,'').slice(0,form.countryCode==='91'?10:14)})}/></div></label>}
      <label>Password{!signup&&<Link className="forgot-link" to="/forgot-password">Forgot password?</Link>}<PasswordInput minLength={signup?6:1} required value={form.password} onChange={e => setForm({...form,password:e.target.value})}/></label>
      {signup && <div className="password-strength"><div className="strength-track"><i style={{width:`${strength.score*25}%`}} className={`strength-${strength.score}`}/></div><div><span>{strength.label}</span><small>Minimum 6 characters; mixed characters improve strength</small></div></div>}
      {error && <div className="alert error">{error}</div>}
      {needsActivation&&<button type="button" className="resend-button" onClick={async()=>{try{const {data}=await api.post('/auth/resend-activation',{email:form.email});setActivation({message:data.message,url:data.developmentActivationUrl});setNeedsActivation(false);setError('')}catch(err){const message=err.response?.data?.message||'Could not resend activation email';toast(message,'error')}}}>Resend activation email</button>}
      {activation && <div className="activation-sent"><CheckCircle2/><div><strong>Check your email</strong><p>{activation.message}</p>{activation.url&&<a href={activation.url}>Open development activation link</a>}</div></div>}
      {!activation && <button className="primary-button" disabled={busy}>{busy ? 'Please wait…' : signup ? 'Create account' : 'Sign in'}<ArrowRight size={18}/></button>}
      <p className="auth-switch">{signup ? 'Already registered?' : 'New to Pay-Panda?'} <Link to={signup ? '/login' : '/signup'}>{signup ? 'Sign in' : 'Create account'}</Link></p>
    </form>}</main>
  </div>;
}

function passwordStrength(value) {
  if (!value) return { score: 0, label: 'Enter a secure password' };
  let score = 0;
  if (value.length >= 6) score++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^A-Za-z\d]/.test(value) && !/\s/.test(value)) score++;
  return { score, label: ['Very weak','Weak','Fair','Good','Strong'][score] };
}
