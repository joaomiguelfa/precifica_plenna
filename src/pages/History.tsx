import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { deletePricedPiece, listPricedPieces, type PricedPieceSummary } from '../lib/data/history'
import { formatBRL } from '../lib/format'

export default function History() {
  const [pieces, setPieces] = useState<PricedPieceSummary[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function refresh(query?: string) {
    setLoading(true)
    try {
      setPieces(await listPricedPieces(query))
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
    if (!confirm('Excluir esta peça do histórico?')) return
    await deletePricedPiece(id)
    refresh(search)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Histórico de peças precificadas</h1>

      <input
        type="search"
        placeholder="Buscar por nome…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      />

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {loading && <p className="text-sm text-slate-400 dark:text-slate-500">Carregando…</p>}

      <Card className="divide-y divide-slate-100 dark:divide-slate-800">
        {!loading && pieces.length === 0 && (
          <p className="p-4 text-sm text-slate-400 dark:text-slate-500">Nenhuma peça encontrada.</p>
        )}
        {pieces.map((piece) => (
          <div key={piece.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
            <div>
              <Link
                to={`/nova/${piece.id}`}
                className="font-medium text-slate-800 hover:text-indigo-600 dark:text-slate-200 dark:hover:text-indigo-400"
              >
                {piece.pieceName}
              </Link>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {new Date(piece.createdAt).toLocaleString('pt-BR')} · qtd. {piece.quantity} · custo{' '}
                {formatBRL(piece.totalProductionCost)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">{formatBRL(piece.finalPrice)}</span>
              <Button variant="danger" size="sm" onClick={() => handleDelete(piece.id)}>
                Excluir
              </Button>
            </div>
          </div>
        ))}
      </Card>
    </div>
  )
}
