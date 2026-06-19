import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { AuthProvider, useAuth } from '@context/AuthContext'
import { PantryProvider } from '@context/PantryContext'
import { UserProvider } from '@context/UserContext'
import { FamilyProvider } from '@context/FamilyContext'
import { MealsProvider } from '@context/MealsContext'
import { ExerciseProvider } from '@context/ExerciseContext'
import { WeeklyPlanProvider } from '@context/WeeklyPlanContext'
import DashboardLayout from '@components/shared/DashboardLayout'
import KyoraAgent from '@components/agent/KyoraAgent'
import PantryPage from '@components/pantry/PantryPage'
import KyoraOnboarding from '@components/onboarding/KyoraOnboarding'
import KyoraDashboard from '@components/dashboard/KyoraDashboard'
import PlanPage from '@components/dashboard/PlanPage'
import ProgressPage from '@components/dashboard/ProgressPage'
import CuentaPage from '@components/dashboard/CuentaPage'
import SubscriptionSuccess from '@components/dashboard/SubscriptionSuccess'
import LoginPage from '@components/auth/LoginPage'
import AuthCallback from '@components/auth/AuthCallback'
import UpdatePasswordPage from '@components/auth/UpdatePasswordPage'
import LandingPage from '@components/landing/LandingPage'

/**
 * KYŌRA App — Router Principal
 *
 * /               → Landing page
 * /app/login      → Iniciar sesión / Registro
 * /app/onboarding → Onboarding de usuario (5 pasos)
 * /app/dashboard  → Dashboard del usuario (hub central)
 * /app/agent      → Agente nutricional IA (chat + despensa)
 * /app/pantry     → Mi Despensa
 * /app/chat       → Redirige a /app/agent
 */

/**
 * ProtectedRoute — redirige a login si no hay sesión activa.
 * Muestra nada mientras Supabase carga la sesión inicial.
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return null // evita flash mientras se resuelve la sesión
  if (!isAuthenticated) return <Navigate to="/app/login" replace />
  return children
}

/**
 * AppLayout — envuelve las rutas protegidas que necesitan sidebar
 * (Dashboard, Agente, Despensa). Onboarding NO lleva sidebar.
 */
function AppLayout({ children }) {
  return (
    <ProtectedRoute>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  )
}

function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <FamilyProvider>
        <PantryProvider>
          <MealsProvider>
          <ExerciseProvider>
          <WeeklyPlanProvider>
            <Router>
              <Routes>
                {/* Public */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/app/login" element={<LoginPage />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/auth/update-password" element={<UpdatePasswordPage />} />

                {/* Protected — without sidebar */}
                <Route path="/app/onboarding" element={<ProtectedRoute><KyoraOnboarding /></ProtectedRoute>} />

                {/* Protected — with shared sidebar layout */}
                <Route path="/app/dashboard" element={<AppLayout><KyoraDashboard /></AppLayout>} />
                <Route path="/app/agent" element={<AppLayout><KyoraAgent /></AppLayout>} />
                <Route path="/app/pantry" element={<AppLayout><PantryPage /></AppLayout>} />
                <Route path="/app/plan" element={<AppLayout><PlanPage /></AppLayout>} />
                <Route path="/app/progress" element={<AppLayout><ProgressPage /></AppLayout>} />
                <Route path="/app/cuenta" element={<AppLayout><CuentaPage /></AppLayout>} />
                <Route path="/app/subscription/success" element={<ProtectedRoute><SubscriptionSuccess /></ProtectedRoute>} />
                <Route path="/app/chat" element={<Navigate to="/app/agent" replace />} />
                <Route path="/app/*" element={<Navigate to="/app/dashboard" replace />} />
              </Routes>
            </Router>
            <SpeedInsights />
          </WeeklyPlanProvider>
          </ExerciseProvider>
          </MealsProvider>
        </PantryProvider>
        </FamilyProvider>
      </UserProvider>
    </AuthProvider>
  )
}

export default App
