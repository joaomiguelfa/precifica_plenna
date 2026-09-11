import { useEffect, useRef, useState } from 'react'

/**
 * Estado sincronizado com localStorage, para não perder o trabalho em
 * andamento ao fechar/recarregar a aba (rascunho do formulário de precificação).
 */
export function useLocalStorageState<T>(key: string, initialValue: T | (() => T)) {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key)
      if (stored) return JSON.parse(stored) as T
    } catch {
      // localStorage indisponível ou JSON corrompido: segue com o valor inicial
    }
    return typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue
  })

  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(state))
    } catch {
      // armazenamento cheio ou bloqueado: ignora silenciosamente
    }
  }, [key, state])

  return [state, setState] as const
}
