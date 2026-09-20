import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

try {
  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    );
    (window as any).__APP_MOUNTED__ = true;
  }
} catch (err: any) {
  console.error('Fatal initialization error in main.tsx:', err);
  const errBox = document.getElementById('loader-error-box');
  const errMsg = document.getElementById('loader-error-msg');
  if (errBox && errMsg) {
    errBox.style.display = 'block';
    errMsg.textContent = err?.message || String(err);
  }
}
