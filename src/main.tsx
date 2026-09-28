import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { SaveService } from './services/SaveService.ts';
import { UpdateService } from './services/UpdateService.ts';
import App from './App.tsx';
import './index.css';

// Load saved progress immediately before initial React component tree mounts
try {
  SaveService.loadGame();
} catch (e) {
  console.warn('Initial save hydration failed, will use store defaults:', e);
}

// Automatically register and coordinate PWA Service Worker updates safely
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('PWA: New content available, notifying UpdateService...');
    UpdateService.setUpdateAvailable(() => {
      updateSW(true);
    });
  },
  onOfflineReady() {
    console.log('PWA: App is ready to work offline.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

