import { DirectCostsEditor } from '../components/resale/DirectCostsEditor'
import { MarginModeField } from '../components/resale/MarginModeField'
import { PlatformFeesEditor } from '../components/resale/PlatformFeesEditor'
import { ResaleResultPanel } from '../components/resale/ResaleResultPanel'
import { Card } from '../components/ui/Card'
import { CollapsibleSection } from '../components/ui/CollapsibleSection'
import { NumberField } from '../components/ui/NumberField'
import { TextField } from '../components/ui/TextField'
import { useLocalStorageState } from '../hooks/useLocalStorageState'
import { useAuth } from '../lib/auth/AuthContext'
import { formatBRL, formatPercent } from '../lib/format'
import { calculateResalePricing, createDefaultResalePricingInput } from '../lib/resale/calculate'
import type { ResalePricingInput } from '../types/resale'

export default function NewResalePricing() {
  const { user } = useAuth()
  const draftKey = `precificacao3d:resale-draft:${user?.id ?? 'anon'}`
  const [input, setInput] = useLocalStorageState<ResalePricingInput>(draftKey, createDefaultResalePricingInput)

  function update(patch: Partial<ResalePricingInput>) {
    setInput({ ...input, ...patch })
  }

  function resetForm() {
    if (!confirm('Isso vai limpar todos os campos do cálculo atual. Continuar?')) return
    setInput(createDefaultResalePricingInput())
  }

  const result = calculateResalePricing(input)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Nova precificação — Revenda</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Para produtos comprados prontos e revendidos no Mercado Livre ou em outras plataformas. Os valores são
            calculados em tempo real.
          </p>
        </div>
        <button
          type="button"
          onClick={resetForm}
          className="rounded-md px-2 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          Novo cálculo
        </button>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <TextField
            label="Nome do produto"
            value={input.productName}
            onChange={(v) => update({ productName: v })}
            placeholder="Ex.: Fone de ouvido bluetooth XYZ"
          />
          <NumberField
            label="Quantidade no pedido (modo lote)"
            value={input.quantity}
            onChange={(v) => update({ quantity: v })}
          />
          <NumberField
            label="Preço mínimo de mercado (opcional)"
            suffix="R$"
            value={input.minMarketPrice ?? 0}
            onChange={(v) => update({ minMarketPrice: v || null })}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="divide-y divide-slate-200 dark:divide-slate-800">
          <CollapsibleSection
            title="1. Custo da mercadoria"
            badge={
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {formatBRL(result.costBreakdown.totalCost)}
              </span>
            }
          >
            <NumberField
              label="Custo de compra (CMV)"
              suffix="R$"
              value={input.purchaseCost}
              onChange={(v) => update({ purchaseCost: v })}
            />
            <DirectCostsEditor items={input.directCosts} onChange={(directCosts) => update({ directCosts })} />
          </CollapsibleSection>

          <CollapsibleSection
            title="2. Taxas das plataformas e impostos"
            badge={
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {formatPercent(result.platformFeesTotalPercent + input.taxPercent)}
              </span>
            }
          >
            <PlatformFeesEditor items={input.platformFees} onChange={(platformFees) => update({ platformFees })} />
            <NumberField
              label="Impostos (ex.: Simples Nacional)"
              suffix="%"
              value={input.taxPercent}
              onChange={(v) => update({ taxPercent: v })}
            />
          </CollapsibleSection>

          <CollapsibleSection title="3. Margem de lucro">
            <MarginModeField
              mode={input.marginMode}
              marginPercent={input.marginPercent}
              marginValue={input.marginValue}
              onModeChange={(marginMode) => update({ marginMode })}
              onMarginPercentChange={(marginPercent) => update({ marginPercent })}
              onMarginValueChange={(marginValue) => update({ marginValue })}
            />
          </CollapsibleSection>
        </Card>

        <ResaleResultPanel input={input} result={result} />
      </div>
    </div>
  )
}
