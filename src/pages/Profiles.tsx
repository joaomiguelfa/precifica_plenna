import { useEffect, useState } from 'react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { NumberField } from '../components/ui/NumberField'
import { TextField } from '../components/ui/TextField'
import {
  deleteMaterialProfile,
  deletePrinterProfile,
  listMaterialProfiles,
  listPrinterProfiles,
  upsertMaterialProfile,
  upsertPrinterProfile,
  type MaterialProfile,
  type PrinterProfile,
} from '../lib/data/profiles'
import { formatBRL } from '../lib/format'

const emptyPrinter = { name: '', powerWatts: 0, acquisitionCost: 0, lifespanHours: 0 }
const emptyMaterial = { name: '', materialType: '', color: '', costPerKg: 0 }

export default function Profiles() {
  const [printers, setPrinters] = useState<PrinterProfile[]>([])
  const [materials, setMaterials] = useState<MaterialProfile[]>([])
  const [newPrinter, setNewPrinter] = useState(emptyPrinter)
  const [newMaterial, setNewMaterial] = useState(emptyMaterial)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    try {
      const [p, m] = await Promise.all([listPrinterProfiles(), listMaterialProfiles()])
      setPrinters(p)
      setMaterials(m)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar perfis.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function addPrinter() {
    if (!newPrinter.name.trim()) return
    await upsertPrinterProfile(newPrinter)
    setNewPrinter(emptyPrinter)
    refresh()
  }

  async function addMaterial() {
    if (!newMaterial.name.trim()) return
    await upsertMaterialProfile(newMaterial)
    setNewMaterial(emptyMaterial)
    refresh()
  }

  if (loading) return <p className="text-sm text-slate-400 dark:text-slate-500">Carregando perfis…</p>
  if (error) return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Perfis salvos</h1>

      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Impressoras</h2>
        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-5">
          <TextField label="Nome" value={newPrinter.name} onChange={(v) => setNewPrinter({ ...newPrinter, name: v })} />
          <NumberField
            label="Potência"
            suffix="W"
            value={newPrinter.powerWatts}
            onChange={(v) => setNewPrinter({ ...newPrinter, powerWatts: v })}
          />
          <NumberField
            label="Valor de aquisição"
            suffix="R$"
            value={newPrinter.acquisitionCost}
            onChange={(v) => setNewPrinter({ ...newPrinter, acquisitionCost: v })}
          />
          <NumberField
            label="Vida útil"
            suffix="h"
            value={newPrinter.lifespanHours}
            onChange={(v) => setNewPrinter({ ...newPrinter, lifespanHours: v })}
          />
          <Button className="self-end" onClick={addPrinter}>
            + Adicionar
          </Button>
        </div>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {printers.map((p) => (
            <li key={p.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-200">{p.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {p.powerWatts}W · {formatBRL(p.acquisitionCost)} · {p.lifespanHours}h de vida útil
                </p>
              </div>
              <Button variant="danger" size="sm" onClick={() => deletePrinterProfile(p.id).then(refresh)}>
                Remover
              </Button>
            </li>
          ))}
          {printers.length === 0 && <p className="py-2 text-sm text-slate-400 dark:text-slate-500">Nenhuma impressora salva.</p>}
        </ul>
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Materiais</h2>
        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-5">
          <TextField label="Nome" value={newMaterial.name} onChange={(v) => setNewMaterial({ ...newMaterial, name: v })} />
          <TextField
            label="Tipo"
            value={newMaterial.materialType}
            onChange={(v) => setNewMaterial({ ...newMaterial, materialType: v })}
            placeholder="PLA, PETG, ABS…"
          />
          <TextField label="Cor" value={newMaterial.color} onChange={(v) => setNewMaterial({ ...newMaterial, color: v })} />
          <NumberField
            label="Custo/kg"
            suffix="R$"
            value={newMaterial.costPerKg}
            onChange={(v) => setNewMaterial({ ...newMaterial, costPerKg: v })}
          />
          <Button className="self-end" onClick={addMaterial}>
            + Adicionar
          </Button>
        </div>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {materials.map((m) => (
            <li key={m.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-200">{m.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {[m.materialType, m.color].filter(Boolean).join(' · ')} — {formatBRL(m.costPerKg)}/kg
                </p>
              </div>
              <Button variant="danger" size="sm" onClick={() => deleteMaterialProfile(m.id).then(refresh)}>
                Remover
              </Button>
            </li>
          ))}
          {materials.length === 0 && <p className="py-2 text-sm text-slate-400 dark:text-slate-500">Nenhum material salvo.</p>}
        </ul>
      </Card>
    </div>
  )
}
