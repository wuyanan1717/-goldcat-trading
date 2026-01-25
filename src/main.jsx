import { Analytics } from '@vercel/analytics/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// --- Cache Nuke for Mobile Debugging ---
if (window.location.search.includes('reset=true')) {
  console.log('Force resetting application...');

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function (registrations) {
      for (let registration of registrations) {
        registration.unregister();
        console.log('Service Worker unregistered.');
      }
    });
  }

  // Clear caches
  if ('caches' in window) {
    caches.keys().then((names) => {
      names.forEach((name) => {
        caches.delete(name);
        console.log('Cache deleted:', name);
      });
    });
  }

  // Clear local storage (Optional, maybe keep user settings? let's keep it safe for now and only clear if requested explicitly)
  // localStorage.clear(); 

  // Redirect to clean URL after 1 second to ensure SW is dead
  setTimeout(() => {
    window.location.href = window.location.pathname;
  }, 1000);
}
// ---------------------------------------

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
