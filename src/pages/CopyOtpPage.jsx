import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import api from '../lib/api';

export default function CopyOtpPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState('loading');

  useEffect(() => {
    const token = searchParams.get('t');
    if (!token) { navigate('/login', { replace: true }); return; }
    api.post('/auth/resolve-otp-copy', { token }).then(({ data }) => {
      return navigator.clipboard.writeText(data.otp).then(() => {
        setState('copied');
        setTimeout(() => navigate('/', { replace: true }), 4000);
      });
    }).catch(() => {
      setState('error');
      setTimeout(() => navigate('/login', { replace: true }), 5000);
    });
  }, [searchParams, navigate]);

  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'Arial, sans-serif', background: '#f9fafb' }}>
    <div style={{ textAlign: 'center', padding: 32, maxWidth: 400 }}>
      {state === 'copied' ? <>
        <CheckCircle2 size={48} style={{ color: '#22c55e', margin: '0 auto 16px' }} />
        <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>Code copied!</h2>
        <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>OTP copied to clipboard. Redirecting to Pay-Panda…</p>
      </> : state === 'error' ? <>
        <XCircle size={48} style={{ color: '#ef4444', margin: '0 auto 16px' }} />
        <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>Link expired</h2>
        <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>This copy link expired. Use the code displayed in the email.</p>
      </> : <>
        <div style={{ width: 48, height: 48, border: '3px solid #e5e7eb', borderTopColor: '#6d4aff', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin .8s linear infinite' }} />
        <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>Copying code…</h2>
        <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>Please wait…</p>
      </>}
    </div>
    <style>{'@keyframes spin { to { transform: rotate(360deg) } }'}</style>
  </div>;
}
