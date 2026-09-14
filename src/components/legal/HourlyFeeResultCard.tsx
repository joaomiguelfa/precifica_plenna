import { formatBRL } from '../../lib/format'
import type { HourlyFeeResult } from '../../types/legalPricing'
import { FeeResultCard } from './FeeResultCard'

interface Props {
  result: HourlyFeeResult
}

export function HourlyFeeResultCard({ result }: Props) {
  return (
    <FeeResultCard
      result={result}
      priceLabel="Honorário sugerido (por hora)"
      extra={
        result.isValid && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {formatBRL(result.effectiveHourlyRate)}/hora, para {result.totalHours}h estimadas
          </p>
        )
      }
    />
  )
}
