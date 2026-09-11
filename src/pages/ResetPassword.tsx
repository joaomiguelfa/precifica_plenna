import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useAuth } from '../lib/auth/AuthContext'
import { PASSWORD_HINT, passwordError } from '../lib/validation/password'

export default function ResetPassword() {
  const { session, passwordRecovery, updatePassword } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const canReset = passwordRecovery || !!session

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const passwordIssue = passwordError(password)
    if (passwordIssue) return setError(passwordIssue)
    if (password !== confirmPassword) return setError('As senhas não conferem.')

    setLoading(true)
    try {
      await updatePassword(password)
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? traduzErro(err.message) : 'Não foi possível redefinir a senha.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center text-center">
        <p className="text-3xl">✅</p>
        <h1 className="mt-3 text-xl font-semibold text-slate-900">Senha redefinida</h1>
        <p className="mt-2 text-sm text-slate-500">Sua senha foi atualizada. Você já está conectado.</p>
        <Button className="mt-6" onClick={() => navigate('/', { replace: true })}>
          Ir para o Precifica.Plenna
        </Button>
      </div>
    )
  }

  if (!canReset) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center text-center">
        <p className="text-3xl">⚠️</p>
        <h1 className="mt-3 text-xl font-semibold text-slate-900">Link inválido ou expirado</h1>
        <p className="mt-2 text-sm text-slate-500">
          Abra este link diretamente do e-mail de recuperação, ou solicite um novo.
        </p>
        <Link to="/esqueci-senha" className="mt-6 text-sm font-medium text-indigo-600 hover:underline">
          Solicitar novo link
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center">
      <div className="mb-6 text-center">
        <p className="text-2xl">🔑</p>
        <h1 className="mt-2 text-xl font-semibold text-slate-900">Definir nova senha</h1>
        <p className="text-sm text-slate-500">Escolha uma nova senha para sua conta do Precifica.Plenna.</p>
      </div>
      <Card className="p-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm">
            <span className="mb-1 flex items-center gap-1">
              <span className="font-medium text-slate-700">Nova senha</span>
              <span
                tabIndex={0}
                title={PASSWORD_HINT}
                className="flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600"
                aria-label={PASSWORD_HINT}
              >
                ?
              </span>
            </span>
            <input
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span className="mt-1 block text-xs text-slate-400">{PASSWORD_HINT}</span>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Confirmar nova senha</span>
            <input
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Salvando…' : 'Salvar nova senha'}
          </Button>
        </form>
      </Card>
    </div>
  )
}

function traduzErro(message: string): string {
  if (message.toLowerCase().includes('password')) return 'Senha muito curta ou fraca — use pelo menos 8 caracteres.'
  return message
}
