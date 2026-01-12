import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// ===== EINSTIEGSPUNKT DER ANWENDUNG =====
// Diese Datei ist der Startpunkt für React.
// Sie verbindet unsere React-App mit dem HTML-DOM.

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
