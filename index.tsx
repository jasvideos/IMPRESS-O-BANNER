
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const startApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) return;
  
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

// Pequeno delay para garantir que todos os módulos do importmap foram carregados pelo navegador
if (document.readyState === 'complete') {
  startApp();
} else {
  window.addEventListener('load', startApp);
}
