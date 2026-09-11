import { produce } from 'immer'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { DepreciationSectionForm } from '../components/pricing/DepreciationSectionForm'
import { EnergySectionForm } from '../components/pricing/EnergySectionForm'
import { FeesSectionForm } from '../components/pricing/FeesSectionForm'
import { FixedCostsSectionForm } from '../components/pricing/FixedCostsSectionForm'
import { LaborSectionForm } from '../components/pricing/LaborSectionForm'
import { MarginSectionForm } from '../components/pricing/MarginSectionForm'
import { MaterialSectionForm } from '../components/pricing/MaterialSectionForm'
import { PackagingSectionForm } from '../components/pricing/PackagingSectionForm'
import { ResultPanel } from '../components/pricing/ResultPanel'
import { ScenarioComparator } from '../components/pricing/ScenarioComparator'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { CollapsibleSection } from '../components/ui/CollapsibleSection'
import { NumberField } from '../components/ui/NumberField'
import { TextField } from '../components/ui/TextField'
import { useLocalStorageState } from '../hooks/useLocalStorageState'
import { useAuth } from '../lib/auth/AuthContext'
import { getPricedPiece, savePricedPiece } from '../lib/data/history'
import {
  listMaterialProfiles,
  listPrinterProfiles,
  type MaterialProfile,
  type PrinterProfile,
} from '../lib/data/profiles'
import { getSettings } from '../lib/data/settings'
import { exportQuotePdf } from '../lib/pdf/exportQuote'
import { calculatePricing, createDefaultPricingInput } from '../lib/pricing/calculate'
import { formatBRL } from '../lib/format'
import type { PricingInput } from '../types/pricing'

export default function NewPricing() {
  const { pieceId } = useParams()
  const { user, profile } = useAuth()
  const draftKey = `precificacao3d:draft:${user?.id ?? 'anon'}`
  const [input, setInput] = useLocalStorageState<PricingInput>(draftKey, createDefaultPricingInput)
  const [materialProfiles, setMaterialProfiles] = useState<MaterialProfile[]>([])
  const [printerProfiles, setPrinterProfiles] = useState<PrinterProfile[]>([])
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const settingsApplied = useRef(false)

  useEffect(() => {
    listMaterialProfiles().then(setMaterialProfiles).catch(() => {})
    listPrinterProfiles().then(setPrinterProfiles).catch(() => {})
  }, [])

  useEffect(() => {
    if (settingsApplied.current) return
    settingsApplied.current = true
    getSettings()
      .then((settings) => {
        setInput((prev) => {
          const looksUntouched =
            prev.energy.energyTariffPerKwh === 0 &&
            prev.fees.platformFeePercent === 0 &&
            prev.fees.paymentFeePercent === 0 &&
            prev.fees.taxPercent === 0
          if (!looksUntouched) return prev
          return produce(prev, (draft) => {
            draft.energy.energyTariffPerKwh = settings.energyTariffPerKwh
            draft.fees.platformFeePercent = settings.defaultPlatformFeePercent
            draft.fees.paymentFeePercent = settings.defaultPaymentFeePercent
            draft.fees.taxPercent = settings.defaultTaxPercent
            draft.material.wastePercent = settings.defaultWastePercent
          })
        })
      })
      .catch(() => {})
  }, [setInput])

  useEffect(() => {
    if (!pieceId) return
    getPricedPiece(pieceId)
      .then((piece) => setInput(piece.input))
      .catch(() => {})
  }, [pieceId, setInput])

  function update(recipe: (draft: PricingInput) => void) {
    setInput((prev) => produce(prev, recipe))
  }

  function resetForm() {
    if (!confirm('Isso vai limpar todos os campos do cálculo atual. Continuar?')) return
    setInput(createDefaultPricingInput())
    setSaveMessage(null)
  }

  async function handleSaveHistory() {
    setSaving(true)
    setSaveMessage(null)
    try {
      await savePricedPiece(input, result)
      setSaveMessage('Peça salva no histórico.')
    } catch (err) {
      setSaveMessage(err instanceof Error ? `Erro ao salvar: ${err.message}` : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  const result = calculatePricing(input)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Nova precificação</h1>
          <p className="text-sm text-slate-500">Os valores são calculados em tempo real conforme você digita.</p>
        </div>
        <Button variant="ghost" onClick={resetForm}>
          Novo cálculo
        </Button>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <TextField
            label="Nome da peça"
            value={input.pieceName}
            onChange={(v) => update((d) => void (d.pieceName = v))}
            placeholder="Ex.: Suporte de celular articulado"
          />
          <NumberField
            label="Quantidade no pedido (modo lote)"
            value={input.quantity}
            onChange={(v) => update((d) => void (d.quantity = v))}
          />
          <NumberField
            label="Preço mínimo de mercado (opcional)"
            value={input.sanity.minMarketPrice ?? 0}
            suffix="R$"
            onChange={(v) => update((d) => void (d.sanity.minMarketPrice = v || null))}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="divide-y divide-slate-200">
          <CollapsibleSection
            title="1. Material e insumos diretos"
            badge={<span className="text-xs text-slate-500">{formatBRL(result.costBreakdown.materialTotalCost)}</span>}
          >
            <MaterialSectionForm input={input} update={update} materialProfiles={materialProfiles} />
          </CollapsibleSection>

          <CollapsibleSection
            title="2. Energia elétrica"
            badge={<span className="text-xs text-slate-500">{formatBRL(result.costBreakdown.energyCost)}</span>}
          >
            <EnergySectionForm input={input} update={update} />
          </CollapsibleSection>

          <CollapsibleSection
            title="3. Depreciação de equipamento"
            badge={<span className="text-xs text-slate-500">{formatBRL(result.costBreakdown.depreciationCost)}</span>}
          >
            <DepreciationSectionForm input={input} update={update} printerProfiles={printerProfiles} />
          </CollapsibleSection>

          <CollapsibleSection
            title="4. Mão de obra"
            badge={<span className="text-xs text-slate-500">{formatBRL(result.costBreakdown.laborCost)}</span>}
          >
            <LaborSectionForm input={input} update={update} />
          </CollapsibleSection>

          <CollapsibleSection
            title="5. Custos fixos rateados"
            defaultOpen={false}
            badge={<span className="text-xs text-slate-500">{formatBRL(result.costBreakdown.fixedCostPerPiece)}</span>}
          >
            <FixedCostsSectionForm input={input} update={update} />
          </CollapsibleSection>

          <CollapsibleSection
            title="6. Embalagem e logística"
            defaultOpen={false}
            badge={
              <span className="text-xs text-slate-500">
                {formatBRL(result.costBreakdown.packagingCost + result.costBreakdown.shippingCost)}
              </span>
            }
          >
            <PackagingSectionForm input={input} update={update} />
          </CollapsibleSection>

          <CollapsibleSection title="Taxas sobre a venda">
            <FeesSectionForm input={input} update={update} />
          </CollapsibleSection>

          <CollapsibleSection title="Margem de lucro">
            <MarginSectionForm input={input} update={update} result={result} />
          </CollapsibleSection>
        </Card>

        <div className="space-y-4">
          <ResultPanel
            input={input}
            result={result}
            onExportPdf={() => exportQuotePdf(input, result, profile)}
            onSaveHistory={handleSaveHistory}
            saving={saving}
          />
          {saveMessage && <p className="text-sm text-slate-600">{saveMessage}</p>}

          <Card className="p-5">
            <p className="mb-3 text-sm font-semibold text-slate-700">Simulador de cenários</p>
            <ScenarioComparator input={input} />
          </Card>
        </div>
      </div>
    </div>
  )
}
