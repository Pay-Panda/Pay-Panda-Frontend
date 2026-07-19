import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import './legacy.css';
import App from './App.jsx';
import { AuthProvider } from './state/AuthContext.jsx';
import { AdminAuthProvider } from './state/AdminAuthContext.jsx';
import { UiProvider } from './state/UiProvider.jsx';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <GoogleOAuthProvider clientId={googleClientId}>
        <UiProvider><AuthProvider><AdminAuthProvider><App /></AdminAuthProvider></AuthProvider></UiProvider>
      </GoogleOAuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
