import { StrictMode } from 'react';  // StrictMode de react pour activer des vérifications supplémentaires en développement
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(  // l'application à l'élément avec l'id 'root'
  <StrictMode>
    <App />  // le code principal de l'application à l'intérieur de StrictMode
  </StrictMode>
);
