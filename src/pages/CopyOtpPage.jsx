import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';

export default function CopyOtpPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('t');
    if (!token) { navigate('/login', { replace: true }); return; }
    api.post('/auth/resolve-otp-copy', { token }).then(({ data }) => {
      navigator.clipboard.writeText(data.otp);
    }).finally(() => {
      try { window.close(); } catch {}
      navigate('/', { replace: true });
    });
  }, [searchParams, navigate]);

  return null;
}
