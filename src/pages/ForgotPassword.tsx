import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useAuth } from '../lib/auth/AuthContext'

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await resetPassword(email)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? traduzErro(err.message) : 'Não foi possível enviar o link de recuperação.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center text-center">
        <p className="text-3xl">📩</p>
        <h1 className="mt-3 text-xl font-semibold text-slate-900">Confira seu e-mail</h1>
        <p className="mt-2 text-sm text-slate-500">
          Se houver uma conta com o e-mail <strong>{email}</strong>, enviamos um link para redefinir a senha.
        </p>
        <Link to="/login" className="mt-6 text-sm font-medium text-indigo-600 hover:underline">
          Voltar para o login
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center">
      <div className="mb-6 text-center">
        <p className="text-2xl">🔑</p>
        <h1 className="mt-2 text-xl font-semibold text-slate-900">Esqueci minha senha</h1>
        <p className="text-sm text-slate-500">Informe o e-mail da sua conta para receber um link de redefinição.</p>
      </div>
      <Card className="p-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">E-mail</span>
            <input
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Enviando…' : 'Enviar link de recuperação'}
          </Button>
        </form>
      </Card>
      <p className="mt-4 text-center text-sm text-slate-500">
        Lembrou a senha?{' '}
        <Link to="/login" className="font-medium text-indigo-600 hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  )
}

function traduzErro(message: string): string {
  if (message.includes('email rate limit exceeded')) return 'Muitas tentativas em pouco tempo — aguarde alguns minutos e tente de novo.'
  return message
}
