import { Analytics } from '@vercel/analytics/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Mobile debugging tool - TEMPORARY (remove after fixing mobile issues)
import('eruda').then(eruda => {
  eruda.default.init();
  console.log('🔧 Eruda Debug Tool Loaded - Check bottom right corner');
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Analytics />
  </StrictMode>,
)
