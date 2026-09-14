import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { listPricedPieces, type PricedPieceSummary } from '../lib/data/history'
import { formatBRL } from '../lib/format'

export default function Dashboard() {
  const [recent, setRecent] = useState<PricedPieceSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listPricedPieces()
      .then((pieces) => setRecent(pieces.slice(0, 5)))
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar histórico.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <Card className="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Precifique sua próxima peça</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Informe os custos reais de produção e deixe o app calcular o preço de venda correto.
          </p>
        </div>
        <Link to="/nova">
          <Button>+ Nova precificação</Button>
        </Link>
      </Card>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Peças precificadas recentemente</h2>
          <Link to="/historico" className="text-xs font-medium text-indigo-600 hover:underline">
            Ver histórico completo
          </Link>
        </div>

        {loading && <p className="text-sm text-slate-400 dark:text-slate-500">Carregando…</p>}
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {!loading && !error && recent.length === 0 && (
          <p className="text-sm text-slate-400 dark:text-slate-500">Nenhuma peça precificada ainda.</p>
        )}

        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {recent.map((piece) => (
            <li key={piece.id} className="flex items-center justify-between py-2 text-sm">
              <Link
                to={`/nova/${piece.id}`}
                className="font-medium text-slate-800 hover:text-indigo-600 dark:text-slate-200 dark:hover:text-indigo-400"
              >
                {piece.pieceName}
              </Link>
              <span className="text-slate-500 dark:text-slate-400">{formatBRL(piece.finalPrice)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
