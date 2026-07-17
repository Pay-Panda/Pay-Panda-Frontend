import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './state/AuthContext.jsx';
import { AdminAuthProvider } from './state/AdminAuthContext.jsx';
import { UiProvider } from './state/UiProvider.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <UiProvider><AuthProvider><AdminAuthProvider><App /></AdminAuthProvider></AuthProvider></UiProvider>
    </BrowserRouter>
  </StrictMode>,
)
