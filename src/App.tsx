import { NavLink, Route, Routes } from 'react-router-dom'
import { AdminRoute } from './components/auth/AdminRoute'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { useAuth } from './lib/auth/AuthContext'
import { useTheme } from './lib/theme/ThemeContext'
import Admin from './pages/Admin'
import CompleteProfile from './pages/CompleteProfile'
import Dashboard from './pages/Dashboard'
import ForgotPassword from './pages/ForgotPassword'
import History from './pages/History'
import Login from './pages/Login'
import NewPricing from './pages/NewPricing'
import Profiles from './pages/Profiles'
import ResetPassword from './pages/ResetPassword'
import Settings from './pages/Settings'
import SignUp from './pages/SignUp'

const navItems = [
  { to: '/', label: 'Início', end: true },
  { to: '/nova', label: 'Nova precificação', end: false },
  { to: '/perfis', label: 'Perfis salvos', end: false },
  { to: '/historico', label: 'Histórico', end: false },
  { to: '/configuracoes', label: 'Configurações', end: false },
]

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
  const items = isAdmin ? [...navItems, { to: '/admin', label: 'Administração', end: false }] : navItems
  const profileComplete = profile != null && profile.document !== ''

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
          <span aria-hidden="true">🖨️</span>
          <span>Precifica.Plenna</span>
        </div>
        {session && profileComplete && (
          <nav className="-mx-2 flex flex-1 justify-end gap-1 overflow-x-auto">
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
        <div className="flex shrink-0 items-center gap-1">
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
