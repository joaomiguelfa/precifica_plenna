import { useEffect, useState } from 'react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { NumberField } from '../components/ui/NumberField'
import { DEFAULT_SETTINGS, getSettings, saveSettings, type AppSettings } from '../lib/data/settings'

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setStatus(null)
    try {
      await saveSettings(settings)
      setStatus('Configurações salvas.')
    } catch (err) {
      setStatus(err instanceof Error ? `Erro: ${err.message}` : 'Erro ao salvar.')
    }
  }

  if (loading) return <p className="text-sm text-slate-400 dark:text-slate-500">Carregando…</p>

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Configurações</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Esses valores são usados como padrão para novos cálculos de precificação (podem ser ajustados peça a
        peça).
      </p>

      <Card className="space-y-4 p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <NumberField
            label="Tarifa de energia padrão"
            suffix="R$/kWh"
            value={settings.energyTariffPerKwh}
            onChange={(v) => setSettings({ ...settings, energyTariffPerKwh: v })}
          />
          <NumberField
            label="Percentual de desperdício padrão"
            suffix="%"
            value={settings.defaultWastePercent}
            onChange={(v) => setSettings({ ...settings, defaultWastePercent: v })}
          />
          <NumberField
            label="Taxa de plataforma padrão"
            suffix="%"
            value={settings.defaultPlatformFeePercent}
            onChange={(v) => setSettings({ ...settings, defaultPlatformFeePercent: v })}
          />
          <NumberField
            label="Taxa de cartão/gateway padrão"
            suffix="%"
            value={settings.defaultPaymentFeePercent}
            onChange={(v) => setSettings({ ...settings, defaultPaymentFeePercent: v })}
          />
          <NumberField
            label="Imposto padrão"
            suffix="%"
            value={settings.defaultTaxPercent}
            onChange={(v) => setSettings({ ...settings, defaultTaxPercent: v })}
          />
        </div>
        <Button onClick={handleSave}>Salvar configurações</Button>
        {status && <p className="text-sm text-slate-600 dark:text-slate-400">{status}</p>}
      </Card>
    </div>
  )
}
