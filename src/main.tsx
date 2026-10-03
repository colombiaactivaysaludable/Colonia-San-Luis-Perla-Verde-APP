import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register PWA Service Worker quietly on window load without any page reload
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.log('Colonia San Luis SW active:', reg.scope);
      })
      .catch((err) => {
        console.warn('SW register notice:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
