import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { deleteLegalCase, listLegalCases, type PricedLegalCaseSummary } from '../lib/data/legalHistory'
import { formatBRL } from '../lib/format'
import { LEGAL_FEE_MODEL_LABELS } from '../types/legalPricing'

export default function LegalHistory() {
  const [cases, setCases] = useState<PricedLegalCaseSummary[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function refresh(query?: string) {
    setLoading(true)
    try {
      setCases(await listLegalCases(query))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar histórico.')
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

  async function handleDelete(id: string) {
    if (!confirm('Excluir este orçamento do histórico?')) return
    await deleteLegalCase(id)
    refresh(search)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Histórico de orçamentos</h1>

      <input
        type="search"
        placeholder="Buscar por nome do processo…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      />

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {loading && <p className="text-sm text-slate-400 dark:text-slate-500">Carregando…</p>}

      <Card className="divide-y divide-slate-100 dark:divide-slate-800">
        {!loading && cases.length === 0 && (
          <p className="p-4 text-sm text-slate-400 dark:text-slate-500">Nenhum orçamento encontrado.</p>
        )}
        {cases.map((legalCase) => (
          <div key={legalCase.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
            <div>
              <Link
                to={`/honorarios/${legalCase.id}`}
                className="font-medium text-slate-800 hover:text-indigo-600 dark:text-slate-200 dark:hover:text-indigo-400"
              >
                {legalCase.caseName}
              </Link>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {new Date(legalCase.createdAt).toLocaleString('pt-BR')} ·{' '}
                {legalCase.selectedModels.map((m) => LEGAL_FEE_MODEL_LABELS[m]).join(' + ')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">
                {legalCase.estimatedTotalRevenue != null ? formatBRL(legalCase.estimatedTotalRevenue) : '—'}
              </span>
              <Button variant="danger" size="sm" onClick={() => handleDelete(legalCase.id)}>
                Excluir
              </Button>
            </div>
          </div>
        ))}
      </Card>
    </div>
  )
}
