import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { DirectCostsEditor } from '../components/legal/DirectCostsEditor'
import { FeeResultCard } from '../components/legal/FeeResultCard'
import { FixedCostAllocationDisplay } from '../components/legal/FixedCostAllocationDisplay'
import { HourlyFeeResultCard } from '../components/legal/HourlyFeeResultCard'
import { RoleAllocationsEditor } from '../components/legal/RoleAllocationsEditor'
import { SuccessFeeResultCard } from '../components/legal/SuccessFeeResultCard'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { NumberField } from '../components/ui/NumberField'
import { TextField } from '../components/ui/TextField'
import { useLocalStorageState } from '../hooks/useLocalStorageState'
import { useAuth } from '../lib/auth/AuthContext'
import { getLegalCase, saveLegalCase } from '../lib/data/legalHistory'
import {
  listEmployeeProfiles,
  listFixedCostProfiles,
  type EmployeeProfile,
  type FixedCostProfile,
} from '../lib/data/legalProfiles'
import { createDefaultLegalOfficeSettings, getLegalSettings, type LegalOfficeSettings } from '../lib/data/legalSettings'
import { formatBRL } from '../lib/format'
import { calculateSelectedModels, createDefaultLegalPricingInput, round2 } from '../lib/legalPricing/calculate'
import { exportLegalQuotePdf } from '../lib/pdf/exportLegalQuote'
import { LEGAL_FEE_MODEL_LABELS } from '../types/legalPricing'
import type { LegalFeeModel, LegalPricingInput } from '../types/legalPricing'

const MODEL_OPTIONS = Object.entries(LEGAL_FEE_MODEL_LABELS) as [LegalFeeModel, string][]

type PageTab = 'custos' | 'honorarios'

export default function NewLegalPricing() {
  const { caseId } = useParams()
  const { user, profile } = useAuth()
  // v2: o formato do rascunho mudou (formas de honorário combináveis, dados
  // de custo compartilhados) — chave nova para não tentar reidratar um
  // rascunho antigo com o formato incompatível.
  const draftKey = `precificacao3d:legal-draft-v2:${user?.id ?? 'anon'}`
  const [input, setInput] = useLocalStorageState<LegalPricingInput>(draftKey, createDefaultLegalPricingInput)
  const [activeTab, setActiveTab] = useState<PageTab>('custos')
  const [employees, setEmployees] = useState<EmployeeProfile[]>([])
  const [fixedCosts, setFixedCosts] = useState<FixedCostProfile[]>([])
  const [officeSettings, setOfficeSettings] = useState<LegalOfficeSettings>(createDefaultLegalOfficeSettings())
  const [includeBreakdown, setIncludeBreakdown] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  useEffect(() => {
    listEmployeeProfiles().then(setEmployees).catch(() => {})
    listFixedCostProfiles().then(setFixedCosts).catch(() => {})
    // As premissas do escritório e o número de casos/mês agora só são
    // editados em "Perfis salvos" — aqui só lemos o valor mais atual.
    getLegalSettings()
      .then((settings) => {
        setOfficeSettings(settings)
        setInput((prev) => ({ ...prev, assumptions: settings.assumptions }))
      })
      .catch(() => {})
  }, [setInput])

  useEffect(() => {
    if (!caseId) return
    getLegalCase(caseId)
      .then((legalCase) => setInput(legalCase.input))
      .catch(() => {})
  }, [caseId, setInput])

  function toggleModel(model: LegalFeeModel) {
    setInput((prev) => {
      const isSelected = prev.selectedModels.includes(model)
      const selectedModels = isSelected
        ? prev.selectedModels.filter((m) => m !== model)
        : [...prev.selectedModels, model]
      return { ...prev, selectedModels }
    })
  }

  function resetForm() {
    if (!confirm('Isso vai limpar todos os campos do cálculo atual. Continuar?')) return
    setInput((prev) => ({ ...createDefaultLegalPricingInput(), assumptions: prev.assumptions }))
    setSaveMessage(null)
  }

  async function handleSaveHistory() {
    setSaving(true)
    setSaveMessage(null)
    try {
      await saveLegalCase(effectiveInput, results)
      setSaveMessage('Orçamento salvo no histórico.')
    } catch (err) {
      setSaveMessage(err instanceof Error ? `Erro ao salvar: ${err.message}` : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  function handleExportPdf() {
    exportLegalQuotePdf(effectiveInput, results, profile, includeBreakdown)
  }

  // O rateio de custos fixos não é mais digitado no caso — vem do total de
  // custos fixos e do número de casos/mês cadastrados em "Perfis salvos".
  const fixedCostsTotal = fixedCosts.reduce((sum, f) => sum + f.monthlyCost, 0)
  const computedFixedCostAllocation =
    fixedCosts.length > 0 && officeSettings.monthlyCaseCount > 0
      ? round2(fixedCostsTotal / officeSettings.monthlyCaseCount)
      : 0
  const effectiveInput: LegalPricingInput = { ...input, fixedCostAllocation: computedFixedCostAllocation }

  const results = calculateSelectedModels(effectiveInput)
  const hoursLabel =
    input.selectedModels.length === 1 && input.selectedModels[0] === 'recurring'
      ? 'Horas/mês estimadas'
      : 'Horas estimadas'
  const resultCards = [
    results.hourly && <HourlyFeeResultCard key="hourly" result={results.hourly} />,
    results.recurring && (
      <FeeResultCard key="recurring" result={results.recurring} priceLabel="Honorário fixo mensal sugerido" />
    ),
    results.success && <SuccessFeeResultCard key="success" result={results.success} />,
    results.adhoc && <FeeResultCard key="adhoc" result={results.adhoc} priceLabel="Valor fechado sugerido" />,
  ].filter(Boolean)

  const TABS: { id: PageTab; label: string }[] = [
    { id: 'custos', label: 'Custos do caso' },
    { id: 'honorarios', label: 'Honorários' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Nova precificação — BBCS Advocacia
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Preencha os custos do caso, depois escolha e combine as formas de honorário — os valores são
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

      <div className="flex w-fit gap-1 rounded-md border border-slate-300 p-1 text-sm dark:border-slate-700">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded px-3 py-1.5 font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'custos' && (
        <>
          <Card className="p-4">
            <TextField
              label="Nome do processo/caso"
              value={input.caseName}
              onChange={(v) => setInput({ ...input, caseName: v })}
              placeholder="Ex.: Ação trabalhista — Cliente XYZ"
            />
          </Card>

          <Card className="p-4 space-y-4">
            <RoleAllocationsEditor
              roles={input.roles}
              assumptions={input.assumptions}
              employees={employees}
              onChange={(roles) => setInput({ ...input, roles })}
              hoursLabel={hoursLabel}
            />
            <DirectCostsEditor
              items={input.directCosts}
              onChange={(directCosts) => setInput({ ...input, directCosts })}
            />
            <FixedCostAllocationDisplay
              fixedCosts={fixedCosts}
              monthlyCaseCount={officeSettings.monthlyCaseCount}
              value={computedFixedCostAllocation}
            />
          </Card>

          <p className="text-xs text-slate-400 dark:text-slate-500">
            As premissas do escritório (custo por cargo, horas disponíveis, tributos…) e o número de casos/mês
            usado no rateio de custos fixos agora ficam só na aba <strong>Perfis salvos</strong>.
          </p>
        </>
      )}

      {activeTab === 'honorarios' && (
        <>
          <Card className="p-4">
            <h2 className="mb-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
              Formas de honorário aplicadas a este caso
            </h2>
            <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
              Selecione uma ou mais — todas usam os custos preenchidos na aba "Custos do caso".
            </p>
            <div className="flex flex-wrap gap-2">
              {MODEL_OPTIONS.map(([id, label]) => {
                const active = input.selectedModels.includes(id)
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleModel(id)}
                    className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                      active
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`}
                  >
                    {active ? '✓ ' : ''}
                    {label}
                  </button>
                )
              })}
            </div>
            <div className="mt-4 max-w-xs">
              <NumberField
                label="Margem de lucro desejada"
                suffix="%"
                value={input.marginPercent}
                onChange={(v) => setInput({ ...input, marginPercent: v })}
              />
            </div>
          </Card>

          {input.selectedModels.includes('success') && (
            <Card className="p-4">
              <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                Dados do honorário de êxito
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <NumberField
                  label="Valor da causa / proveito econômico"
                  suffix="R$"
                  value={input.caseValue}
                  onChange={(v) => setInput({ ...input, caseValue: v })}
                />
                <NumberField
                  label="Probabilidade de êxito"
                  suffix="%"
                  value={input.successProbabilityPercent}
                  onChange={(v) => setInput({ ...input, successProbabilityPercent: v })}
                />
              </div>
            </Card>
          )}

          {input.selectedModels.includes('adhoc') && (
            <Card className="p-4">
              <TextField
                label="Nome do serviço (contratual avulso)"
                value={input.serviceName}
                onChange={(v) => setInput({ ...input, serviceName: v })}
                placeholder="Ex.: Elaboração de contrato de prestação de serviços"
              />
            </Card>
          )}

          {resultCards.length === 0 && (
            <p className="text-sm text-slate-400 dark:text-slate-500">
              Selecione ao menos uma forma de honorário acima para ver o resultado.
            </p>
          )}

          {resultCards.length > 0 && (
            <div className={`grid grid-cols-1 gap-4 ${resultCards.length > 1 ? 'lg:grid-cols-2' : ''}`}>
              {resultCards}
            </div>
          )}

          {resultCards.length > 1 && results.estimatedTotalRevenue != null && (
            <Card className="border-indigo-300 p-5 dark:border-indigo-700">
              <p className="text-xs font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                Receita total estimada do caso (formas combinadas)
              </p>
              <p className="text-3xl font-bold text-indigo-700 dark:text-indigo-400">
                {formatBRL(results.estimatedTotalRevenue)}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Soma o valor fixo de cada forma selecionada (por hora, fixo/recorrente, avulso) com o valor
                esperado — ponderado pela probabilidade — do componente de êxito, quando aplicável.
              </p>
            </Card>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={handleExportPdf} disabled={resultCards.length === 0}>
              Exportar orçamento (PDF)
            </Button>
            <button
              type="button"
              onClick={() => setIncludeBreakdown((v) => !v)}
              aria-pressed={includeBreakdown}
              title="Quando ativado, o PDF sai com o detalhamento de custos do caso, não só o valor do honorário"
              className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                includeBreakdown
                  ? 'border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-300'
                  : 'border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              {includeBreakdown ? '✓ ' : ''}Descrição
            </button>
            <Button onClick={handleSaveHistory} disabled={saving || resultCards.length === 0}>
              {saving ? 'Salvando…' : 'Salvar orçamento no histórico'}
            </Button>
          </div>
          <p className="-mt-2 text-xs text-slate-400 dark:text-slate-500">
            {includeBreakdown
              ? 'O PDF vai sair com o detalhamento completo dos custos do caso.'
              : 'Ative "Descrição" para o PDF sair com o detalhamento de custos, não só o valor do honorário.'}
          </p>
          {saveMessage && <p className="text-sm text-slate-600 dark:text-slate-400">{saveMessage}</p>}
        </>
      )}
    </div>
  )
}
