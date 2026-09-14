import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { TextField } from '../components/ui/TextField'
import { useAuth } from '../lib/auth/AuthContext'
import {
  listAllPricedPieces,
  listAllUsers,
  updateUserRole,
  type AdminPricedPieceSummary,
  type UserAccount,
} from '../lib/data/admin'
import { formatBRL } from '../lib/format'
import { documentLabel, formatDocument } from '../lib/validation/document'

export default function Admin() {
  const { user: currentUser, inviteUser } = useAuth()
  const [users, setUsers] = useState<UserAccount[]>([])
  const [pieces, setPieces] = useState<AdminPricedPieceSummary[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteSending, setInviteSending] = useState(false)
  const [inviteMessage, setInviteMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function refresh(query?: string) {
    try {
      const [u, p] = await Promise.all([listAllUsers(), listAllPricedPieces(query)])
      setUsers(u)
      setPieces(p)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados de administração.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => refresh(search), 300)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  async function handleRoleChange(userId: string, role: 'admin' | 'user') {
    setSavingId(userId)
    try {
      await updateUserRole(userId, role)
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar o papel do usuário.')
    } finally {
      setSavingId(null)
    }
  }

  async function handleInvite(e: FormEvent) {
    e.preventDefault()
    setInviteMessage(null)
    setInviteSending(true)
    try {
      await inviteUser({ email: inviteEmail, fullName: inviteName })
      setInviteMessage({ type: 'success', text: `Convite enviado para ${inviteEmail}.` })
      setInviteEmail('')
      setInviteName('')
      refresh(search)
    } catch (err) {
      setInviteMessage({ type: 'error', text: err instanceof Error ? err.message : 'Erro ao enviar convite.' })
    } finally {
      setInviteSending(false)
    }
  }

  if (loading) return <p className="text-sm text-slate-400 dark:text-slate-500">Carregando…</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Administração</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Visão de todos os usuários e todas as peças precificadas na conta.</p>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <Card className="p-5">
        <h2 className="mb-1 text-sm font-semibold text-slate-700 dark:text-slate-300">Convidar usuário</h2>
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
          O convite chega direto no e-mail informado, com um link para a pessoa definir a senha e completar o
          cadastro (nome e CPF/CNPJ).
        </p>
        <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={handleInvite}>
          <TextField
            label="Nome (opcional)"
            value={inviteName}
            onChange={setInviteName}
            className="sm:max-w-xs"
            placeholder="Como a pessoa se chama"
          />
          <label className="block flex-1 text-sm">
            <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">E-mail</span>
            <input
              type="email"
              required
              placeholder="pessoa@exemplo.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>
          <Button type="submit" disabled={inviteSending}>
            {inviteSending ? 'Enviando…' : 'Enviar convite'}
          </Button>
        </form>
        {inviteMessage && (
          <p
            className={`mt-2 text-sm ${
              inviteMessage.type === 'success'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {inviteMessage.text}
          </p>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Usuários ({users.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="py-2 pr-4">Nome</th>
                <th className="py-2 pr-4">E-mail</th>
                <th className="py-2 pr-4">Documento</th>
                <th className="py-2 pr-4">Cadastrado em</th>
                <th className="py-2 pr-4">Papel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="py-2 pr-4 font-medium text-slate-800 dark:text-slate-200">{u.fullName}</td>
                  <td className="py-2 pr-4 text-slate-600 dark:text-slate-400">{u.email}</td>
                  <td className="py-2 pr-4 text-slate-600 dark:text-slate-400">
                    {formatDocument(u.document)}{' '}
                    <span className="text-xs text-slate-400 dark:text-slate-500">({documentLabel(u.document) ?? '—'})</span>
                  </td>
                  <td className="py-2 pr-4 text-slate-500 dark:text-slate-400">{new Date(u.createdAt).toLocaleDateString('pt-BR')}</td>
                  <td className="py-2 pr-4">
                    <select
                      value={u.role}
                      disabled={savingId === u.id || u.id === currentUser?.id}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as 'admin' | 'user')}
                      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm disabled:bg-slate-50 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
                      title={u.id === currentUser?.id ? 'Você não pode alterar seu próprio papel.' : undefined}
                    >
                      <option value="user">Usuário</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Todas as precificações ({pieces.length})</h2>
          <input
            type="search"
            placeholder="Buscar por nome da peça…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-xs rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="py-2 pr-4">Peça</th>
                <th className="py-2 pr-4">Usuário</th>
                <th className="py-2 pr-4">Qtd.</th>
                <th className="py-2 pr-4">Custo</th>
                <th className="py-2 pr-4">Preço final</th>
                <th className="py-2 pr-4">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {pieces.map((p) => (
                <tr key={p.id}>
                  <td className="py-2 pr-4 font-medium text-slate-800 dark:text-slate-200">{p.pieceName}</td>
                  <td className="py-2 pr-4 text-slate-600 dark:text-slate-400">
                    {p.ownerName}
                    <div className="text-xs text-slate-400 dark:text-slate-500">{p.ownerEmail}</div>
                  </td>
                  <td className="py-2 pr-4 text-slate-600 dark:text-slate-400">{p.quantity}</td>
                  <td className="py-2 pr-4 text-slate-600 dark:text-slate-400">{formatBRL(p.totalProductionCost)}</td>
                  <td className="py-2 pr-4 font-medium text-indigo-700 dark:text-indigo-400">{formatBRL(p.finalPrice)}</td>
                  <td className="py-2 pr-4 text-slate-500 dark:text-slate-400">{new Date(p.createdAt).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
              {pieces.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-400 dark:text-slate-500">
                    Nenhuma peça encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
