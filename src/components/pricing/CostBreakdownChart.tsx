import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { formatBRL } from '../../lib/format'
import { useTheme } from '../../lib/theme/ThemeContext'
import type { CostBreakdown, PricingMethodResult } from '../../types/pricing'

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ec4899', '#0ea5e9', '#8b5cf6', '#ef4444', '#22c55e']

interface Props {
  costBreakdown: CostBreakdown
  selected: PricingMethodResult
}

export function CostBreakdownChart({ costBreakdown, selected }: Props) {
  const { theme } = useTheme()
  const textColor = theme === 'dark' ? '#cbd5e1' : '#475569'
  const tooltipBg = theme === 'dark' ? '#1e293b' : '#ffffff'

  if (!selected.isValid || selected.finalPrice == null) {
    return <p className="text-sm text-slate-400 dark:text-slate-500">Ajuste os campos para ver a composição do preço.</p>
  }

  const packagingAndShipping = costBreakdown.packagingCost + costBreakdown.shippingCost

  const data = [
    { name: 'Material', value: costBreakdown.materialTotalCost },
    { name: 'Energia', value: costBreakdown.energyCost },
    { name: 'Depreciação', value: costBreakdown.depreciationCost },
    { name: 'Mão de obra', value: costBreakdown.laborCost },
    { name: 'Custos fixos', value: costBreakdown.fixedCostPerPiece },
    { name: 'Embalagem/frete', value: packagingAndShipping },
    { name: 'Taxas de venda', value: selected.fees.totalFeesAmount },
    { name: 'Lucro', value: selected.profitAmount ?? 0 },
  ].filter((d) => d.value > 0)

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => formatBRL(Number(value))}
            contentStyle={{ backgroundColor: tooltipBg, borderColor: textColor, color: textColor }}
            labelStyle={{ color: textColor }}
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            wrapperStyle={{ fontSize: 12, color: textColor }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
