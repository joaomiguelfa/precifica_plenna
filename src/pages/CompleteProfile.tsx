import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PlennaMark } from '../components/ui/PlennaMark'
import { useAuth } from '../lib/auth/AuthContext'
import { documentLabel, formatDocument, isValidDocument } from '../lib/validation/document'
import { PASSWORD_HINT, passwordError } from '../lib/validation/password'

export default function CompleteProfile() {
  const { profile, updateProfile, updatePassword } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState(profile?.fullName ?? '')
  const [document, setDocument] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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
      await updateProfile({ fullName, document })
      await updatePassword(password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível concluir o cadastro.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center py-8">
      <div className="mb-6 text-center">
        <PlennaMark className="mx-auto h-10 w-10" />
        <h1 className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">Complete seu cadastro</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Falta pouco — confirme seus dados e defina uma senha para acessar o Precifica.Plenna.
        </p>
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
            {loading ? 'Salvando…' : 'Concluir cadastro'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
