/**
 * App.jsx
 * -----------------------------------------------------------------------------
 * Componente raiz y enrutador de LEYENDAS CR.
 * -----------------------------------------------------------------------------
 */

import { BrowserRouter, useLocation } from 'react-router-dom'
import { AccessibilityProvider } from './context/AccessibilityContext'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import AppRoutes from './routes/AppRoutes'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ColorBlindFilters from './components/accessibility/ColorBlindFilters'
import OnboardingToasts from './components/onboarding/OnboardingToasts'
import MedievalHorrorBackground from './components/MedievalHorrorBackground'

function AppContent() {
  const location = useLocation()
  const isMapPage = location.pathname === '/mapa'

  return (
    <div className="app-shell flex flex-col min-h-screen relative">
      {/* Fondo animado estilo medieval de terror gótico */}
      <MedievalHorrorBackground />

      {/* Barra de navegación superior */}
      <div className="relative z-30">
        <Navbar />
      </div>

      {/* Contenido principal: en /mapa ocupa exactamente el alto restante sin scroll */}
      <main className={`relative z-10 ${isMapPage ? 'flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden' : 'flex-1'}`}>
        <AppRoutes />
      </main>

      {/* El pie de página se muestra en las demás vistas para dejar al mapa 100% de visibilidad */}
      {!isMapPage && (
        <div className="relative z-10">
          <Footer />
        </div>
      )}

      {/* Guia inicial: avisos flotantes al ingresar por primera vez */}
      <OnboardingToasts />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      {/* Preferencias visuales: tema, tamaño de texto y daltonismo */}
      <AccessibilityProvider>
        {/* Sesión y roles */}
        <AuthProvider>
          {/* Notificaciones flotantes (toasts + onboarding) */}
          <ToastProvider>
            {/* Matrices de color SVG usadas por el mapa */}
            <ColorBlindFilters />
            <AppContent />
          </ToastProvider>
        </AuthProvider>
      </AccessibilityProvider>
    </BrowserRouter>
  )
}
