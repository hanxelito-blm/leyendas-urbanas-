/**
 * main.jsx
 * -----------------------------------------------------------------------------
 * Punto de entrada de React.
 *
 * `App` ya incluye el `BrowserRouter`, por lo que aqui solo se monta el arbol
 * y se cargan las hojas de estilo globales:
 *   - `index.css`          -> Tailwind + estilos legacy del portal
 *   - `assets/accessibility.css` -> variables de tema, texto y daltonismo
 * -----------------------------------------------------------------------------
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './assets/accessibility.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
