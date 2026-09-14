import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type BusinessSegment = 'impressao3d' | 'bbcs_advocacia'

export const SEGMENT_LABELS: Record<BusinessSegment, string> = {
  impressao3d: 'Precifica3D (Impressão 3D)',
  bbcs_advocacia: 'BBCS Advocacia (Honorários)',
}

const STORAGE_KEY = 'precificacao3d:segment'

function getInitialSegment(): BusinessSegment {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'impressao3d' || stored === 'bbcs_advocacia') return stored
  } catch {
    // localStorage indisponível: segue com o padrão
  }
  return 'impressao3d'
}

interface SegmentContextValue {
  segment: BusinessSegment
  setSegment: (segment: BusinessSegment) => void
}

const SegmentContext = createContext<SegmentContextValue | null>(null)

export function SegmentProvider({ children }: { children: ReactNode }) {
  const [segment, setSegment] = useState<BusinessSegment>(getInitialSegment)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, segment)
    } catch {
      // armazenamento indisponível: vale só para esta sessão
    }
  }, [segment])

  return <SegmentContext.Provider value={{ segment, setSegment }}>{children}</SegmentContext.Provider>
}

export function useSegment(): SegmentContextValue {
  const ctx = useContext(SegmentContext)
  if (!ctx) throw new Error('useSegment precisa estar dentro de <SegmentProvider>')
  return ctx
}
