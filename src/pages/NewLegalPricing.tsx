import { AdhocFeeForm } from '../components/legal/AdhocFeeForm'
import { HourlyFeeForm } from '../components/legal/HourlyFeeForm'
import { PracticeAssumptionsPanel } from '../components/legal/PracticeAssumptionsPanel'
import { RecurringFeeForm } from '../components/legal/RecurringFeeForm'
import { SuccessFeeForm } from '../components/legal/SuccessFeeForm'
import { Card } from '../components/ui/Card'
import { useLocalStorageState } from '../hooks/useLocalStorageState'
import { useAuth } from '../lib/auth/AuthContext'
import { createDefaultLegalPricingInput } from '../lib/legalPricing/calculate'
import type { LegalFeeModel, LegalPricingInput } from '../types/legalPricing'

const MODEL_TABS: { id: LegalFeeModel; label: string }[] = [
  { id: 'hourly', label: 'Por hora' },
  { id: 'recurring', label: 'Fixo/recorrente' },
  { id: 'success', label: 'Êxito' },
  { id: 'adhoc', label: 'Contratual avulso' },
]

export default function NewLegalPricing() {
  const { user } = useAuth()
  const draftKey = `precificacao3d:legal-draft:${user?.id ?? 'anon'}`
  const [input, setInput] = useLocalStorageState<LegalPricingInput>(draftKey, createDefaultLegalPricingInput)

  function resetForm() {
    if (!confirm('Isso vai limpar todos os campos do cálculo atual. Continuar?')) return
    setInput(createDefaultLegalPricingInput())
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Nova precificação — BBCS Advocacia
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Escolha a forma de cobrança do serviço. Os valores são calculados em tempo real.
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

      <Card className="divide-y divide-slate-200 dark:divide-slate-800">
        <PracticeAssumptionsPanel
          assumptions={input.assumptions}
          onChange={(assumptions) => setInput({ ...input, assumptions })}
        />
      </Card>

      <div className="flex flex-wrap gap-1 rounded-md border border-slate-300 p-1 text-sm dark:border-slate-700">
        {MODEL_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setInput({ ...input, selectedModel: tab.id })}
            className={`flex-1 rounded px-3 py-1.5 font-medium transition-colors ${
              input.selectedModel === tab.id
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {input.selectedModel === 'hourly' && (
        <HourlyFeeForm
          input={input.hourly}
          assumptions={input.assumptions}
          onChange={(hourly) => setInput({ ...input, hourly })}
        />
      )}
      {input.selectedModel === 'recurring' && (
        <RecurringFeeForm
          input={input.recurring}
          assumptions={input.assumptions}
          onChange={(recurring) => setInput({ ...input, recurring })}
        />
      )}
      {input.selectedModel === 'success' && (
        <SuccessFeeForm
          input={input.success}
          assumptions={input.assumptions}
          onChange={(success) => setInput({ ...input, success })}
        />
      )}
      {input.selectedModel === 'adhoc' && (
        <AdhocFeeForm
          input={input.adhoc}
          assumptions={input.assumptions}
          onChange={(adhoc) => setInput({ ...input, adhoc })}
        />
      )}
    </div>
  )
}
