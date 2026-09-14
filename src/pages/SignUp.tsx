import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useAuth } from '../lib/auth/AuthContext'
import { documentLabel, formatDocument, isValidDocument } from '../lib/validation/document'
import { PASSWORD_HINT, passwordError } from '../lib/validation/password'

export default function SignUp() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [document, setDocument] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)

  const label = documentLabel(document)
  const documentTouched = document.length > 0
  const documentValid = !documentTouched || isValidDocument(document)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!fullName.trim()) return setError('Informe seu nome.')
    if (!isValidDocument(document)) return setError('CPF ou CNPJ inválido — confira os números digitados.')
    const passwordIssue = passwordError(password)
    if (passwordIssue) return setError(passwordIssue)
    if (password !== confirmPassword) return setError('As senhas não conferem.')

    setLoading(true)
    try {
      const { needsEmailConfirmation } = await signUp({ fullName, document, email, password })
      if (needsEmailConfirmation) {
        setConfirmationSent(true)
      } else {
        navigate('/', { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? traduzErro(err.message) : 'Não foi possível criar a conta.')
    } finally {
      setLoading(false)
    }
  }

  if (confirmationSent) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center text-center">
        <p className="text-3xl">📩</p>
        <h1 className="mt-3 text-xl font-semibold text-slate-900 dark:text-slate-100">Confirme seu e-mail</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Enviamos um link de confirmação para <strong>{email}</strong>. Depois de confirmar, volte e entre
          normalmente.
        </p>
        <Link to="/login" className="mt-6 text-sm font-medium text-indigo-600 hover:underline">
          Ir para o login
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center py-8">
      <div className="mb-6 text-center">
        <p className="text-2xl">🖨️</p>
        <h1 className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">Criar cadastro</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Seus dados identificam quem está usando o Precifica.Plenna.</p>
      </div>
      <Card className="p-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Nome completo</span>
            <input
              type="text"
              required
              autoComplete="name"
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">
              CPF ou CNPJ {label && <span className="font-normal text-slate-400 dark:text-slate-500">({label})</span>}
            </span>
            <input
              type="text"
              required
              inputMode="numeric"
              placeholder="000.000.000-00"
              className={`w-full rounded-md border px-3 py-2 outline-none focus:ring-1 dark:bg-slate-900 dark:text-slate-100 ${
                documentValid
                  ? 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700'
                  : 'border-red-400 focus:border-red-500 focus:ring-red-500 dark:border-red-700'
              }`}
              value={document}
              onChange={(e) => setDocument(formatDocument(e.target.value))}
            />
            {!documentValid && (
              <span className="mt-1 block text-xs text-red-600 dark:text-red-400">CPF/CNPJ inválido.</span>
            )}
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">E-mail</span>
            <input
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="mb-1 flex items-center gap-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">Senha</span>
                <span
                  tabIndex={0}
                  title={PASSWORD_HINT}
                  className="flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300"
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
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Confirmar senha</span>
              <input
                type="password"
                required
                autoComplete="new-password"
                minLength={8}
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </label>
            <p className="col-span-2 -mt-2 text-xs text-slate-400 dark:text-slate-500">{PASSWORD_HINT}</p>
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Criando conta…' : 'Criar cadastro'}
          </Button>
        </form>
      </Card>
      <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
        Já tem conta?{' '}
        <Link to="/login" className="font-medium text-indigo-600 hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  )
}

function traduzErro(message: string): string {
  if (message.includes('User already registered')) return 'Já existe uma conta com esse e-mail.'
  if (message.toLowerCase().includes('password')) return 'Senha muito curta ou fraca — use pelo menos 8 caracteres.'
  if (message.includes('email rate limit exceeded')) return 'Muitas tentativas em pouco tempo — aguarde alguns minutos e tente de novo.'
  return message
}
