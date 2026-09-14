import { NavLink, Route, Routes } from 'react-router-dom'
import { AdminRoute } from './components/auth/AdminRoute'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { useAuth } from './lib/auth/AuthContext'
import { SEGMENT_LABELS, useSegment, type BusinessSegment } from './lib/segment/SegmentContext'
import { useTheme } from './lib/theme/ThemeContext'
import Admin from './pages/Admin'
import CompleteProfile from './pages/CompleteProfile'
import Dashboard from './pages/Dashboard'
import ForgotPassword from './pages/ForgotPassword'
import History from './pages/History'
import LegalHistory from './pages/LegalHistory'
import LegalProfiles from './pages/LegalProfiles'
import Login from './pages/Login'
import NewLegalPricing from './pages/NewLegalPricing'
import NewPricing from './pages/NewPricing'
import Profiles from './pages/Profiles'
import ResetPassword from './pages/ResetPassword'
import Settings from './pages/Settings'
import SignUp from './pages/SignUp'

const navItemsBySegment: Record<BusinessSegment, { to: string; label: string; end: boolean }[]> = {
  impressao3d: [
    { to: '/', label: 'Início', end: true },
    { to: '/nova', label: 'Nova precificação', end: false },
    { to: '/perfis', label: 'Perfis salvos', end: false },
    { to: '/historico', label: 'Histórico', end: false },
    { to: '/configuracoes', label: 'Configurações', end: false },
  ],
  bbcs_advocacia: [
    { to: '/', label: 'Início', end: true },
    { to: '/honorarios', label: 'Nova precificação', end: true },
    { to: '/honorarios/perfis', label: 'Perfis salvos', end: false },
    { to: '/honorarios/historico', label: 'Histórico', end: false },
  ],
}

function SegmentSelect() {
  const { segment, setSegment } = useSegment()
  return (
    <select
      value={segment}
      onChange={(e) => setSegment(e.target.value as BusinessSegment)}
      aria-label="Negócio"
      className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
    >
      {Object.entries(SEGMENT_LABELS).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  )
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
      title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
      className="rounded-md px-2 py-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}

function Header() {
  const { session, profile, isAdmin, signOut } = useAuth()
  const { segment } = useSegment()
  const baseItems = navItemsBySegment[segment]
  const items = isAdmin ? [...baseItems, { to: '/admin', label: 'Administração', end: false }] : baseItems
  const profileComplete = profile != null && profile.document !== ''

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
            <span aria-hidden="true">{segment === 'bbcs_advocacia' ? '⚖️' : '🖨️'}</span>
            <span>Precifica.Plenna</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {session && profileComplete && <SegmentSelect />}
            <ThemeToggle />
            {session && (
              <div className="flex items-center gap-3 border-l border-slate-200 pl-3 text-sm dark:border-slate-800">
                <span className="hidden text-slate-600 sm:inline dark:text-slate-400">
                  {profile?.fullName || session.user.email}
                </span>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="rounded-md px-2 py-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                >
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
        {session && profileComplete && (
          <nav className="-mx-1 flex flex-wrap gap-1">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </header>
  )
}

function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<SignUp />} />
          <Route path="/esqueci-senha" element={<ForgotPassword />} />
          <Route path="/redefinir-senha" element={<ResetPassword />} />
          <Route
            path="/completar-cadastro"
            element={
              <ProtectedRoute>
                <CompleteProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/nova"
            element={
              <ProtectedRoute>
                <NewPricing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/nova/:pieceId"
            element={
              <ProtectedRoute>
                <NewPricing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/perfis"
            element={
              <ProtectedRoute>
                <Profiles />
              </ProtectedRoute>
            }
          />
          <Route
            path="/historico"
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            }
          />
          <Route
            path="/configuracoes"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/honorarios"
            element={
              <ProtectedRoute>
                <NewLegalPricing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/honorarios/:caseId"
            element={
              <ProtectedRoute>
                <NewLegalPricing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/honorarios/perfis"
            element={
              <ProtectedRoute>
                <LegalProfiles />
              </ProtectedRoute>
            }
          />
          <Route
            path="/honorarios/historico"
            element={
              <ProtectedRoute>
                <LegalHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <Admin />
                </AdminRoute>
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  )
}

export default App
