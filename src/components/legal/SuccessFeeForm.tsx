import { calculateSuccessFee } from '../../lib/legalPricing/calculate'
import { formatBRL, formatPercent } from '../../lib/format'
import type { PracticeAssumptions, SuccessFeeInput } from '../../types/legalPricing'
import { Card } from '../ui/Card'
import { NumberField } from '../ui/NumberField'
import { DirectCostsEditor } from './DirectCostsEditor'
import { RoleAllocationsEditor } from './RoleAllocationsEditor'

interface Props {
  input: SuccessFeeInput
  assumptions: PracticeAssumptions
  onChange: (input: SuccessFeeInput) => void
}

export function SuccessFeeForm({ input, assumptions, onChange }: Props) {
  const result = calculateSuccessFee(input, assumptions)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="space-y-4">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          O honorário só é recebido se o caso for ganho — por isso o percentual sugerido já embute a chance de
          perder (e não receber nada) em casos parecidos, além da comissão sobre êxito repassada ao responsável.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <NumberField
            label="Valor da causa / proveito econômico"
            suffix="R$"
            value={input.caseValue}
            onChange={(v) => onChange({ ...input, caseValue: v })}
          />
          <NumberField
            label="Probabilidade de êxito"
            suffix="%"
            value={input.successProbabilityPercent}
            onChange={(v) => onChange({ ...input, successProbabilityPercent: v })}
          />
        </div>
        <RoleAllocationsEditor
          roles={input.roles}
          assumptions={assumptions}
          onChange={(roles) => onChange({ ...input, roles })}
        />
        <DirectCostsEditor
          items={input.directCosts}
          onChange={(directCosts) => onChange({ ...input, directCosts })}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <NumberField
            label="Rateio de custos fixos"
            suffix="R$"
            value={input.fixedCostAllocation}
            onChange={(v) => onChange({ ...input, fixedCostAllocation: v })}
          />
          <NumberField
            label="Margem de lucro desejada"
            suffix="%"
            value={input.marginPercent}
            onChange={(v) => onChange({ ...input, marginPercent: v })}
          />
        </div>
      </div>

      <Card className="p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Custo do caso (horas + custos diretos + rateio)
        </p>
        <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {formatBRL(result.costBreakdown.totalCost)}
        </p>

        <div className="my-4 border-t border-dashed border-slate-200 dark:border-slate-700" />

        <p className="text-xs font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
          Percentual de êxito sugerido
        </p>
        {result.isValid ? (
          <>
            <p className="text-4xl font-bold text-indigo-700 dark:text-indigo-400">
              {formatPercent(result.suggestedFeePercent)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              sobre o valor da causa, cobrado somente se o caso for ganho
            </p>
          </>
        ) : (
          <p className="text-sm text-red-600 dark:text-red-400">{result.warning}</p>
        )}

        {result.isValid && (
          <>
            <div className="my-4 border-t border-slate-200 dark:border-slate-800" />
            <dl className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Valor a receber se ganhar</dt>
                <dd className="font-medium text-slate-800 dark:text-slate-200">{formatBRL(result.amountIfWon)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Valor esperado (ponderado pela probabilidade)</dt>
                <dd className="font-medium text-slate-800 dark:text-slate-200">{formatBRL(result.expectedValue)}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-1.5 font-semibold dark:border-slate-700">
                <dt>Custo do caso</dt>
                <dd>{formatBRL(result.costBreakdown.totalCost)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
              Se o caso for perdido, o custo de {formatBRL(result.costBreakdown.totalCost)} não é recuperado — é
              por isso que o percentual sugerido é mais alto quanto menor a probabilidade de êxito.
            </p>
          </>
        )}

        {result.isValid && result.warning && (
          <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            {result.warning}
          </p>
        )}
      </Card>
    </div>
  )
}
