/** Remove tudo que não é dígito. */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

/** Aplica máscara de CPF (11 dígitos) ou CNPJ (14 dígitos) conforme o usuário digita. */
export function formatDocument(value: string): string {
  const digits = onlyDigits(value).slice(0, 14)

  if (digits.length <= 11) {
    const parts = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 9)].filter(Boolean)
    let out = parts.join('.')
    if (digits.length > 9) out += `-${digits.slice(9, 11)}`
    return out
  }

  const parts = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 8)].filter(Boolean)
  let out = parts.join('.')
  if (digits.length > 8) out += `/${digits.slice(8, 12)}`
  if (digits.length > 12) out += `-${digits.slice(12, 14)}`
  return out
}

function isCpfValid(cpf: string): boolean {
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false
  const digits = cpf.split('').map(Number)
  for (const checkIndex of [9, 10]) {
    let sum = 0
    for (let i = 0; i < checkIndex; i++) sum += digits[i] * (checkIndex + 1 - i)
    const rest = (sum * 10) % 11
    const expected = rest === 10 ? 0 : rest
    if (expected !== digits[checkIndex]) return false
  }
  return true
}

function isCnpjValid(cnpj: string): boolean {
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false
  const digits = cnpj.split('').map(Number)
  const calc = (checkIndex: number) => {
    const weights = checkIndex === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    let sum = 0
    for (let i = 0; i < checkIndex; i++) sum += digits[i] * weights[i]
    const rest = sum % 11
    return rest < 2 ? 0 : 11 - rest
  }
  return calc(12) === digits[12] && calc(13) === digits[13]
}

/** Valida CPF (pessoa física, 11 dígitos) ou CNPJ (pessoa jurídica, 14 dígitos) por dígito verificador. */
export function isValidDocument(value: string): boolean {
  const digits = onlyDigits(value)
  if (digits.length === 11) return isCpfValid(digits)
  if (digits.length === 14) return isCnpjValid(digits)
  return false
}

export function documentLabel(value: string): 'CPF' | 'CNPJ' | null {
  const digits = onlyDigits(value)
  if (digits.length === 11) return 'CPF'
  if (digits.length === 14) return 'CNPJ'
  return null
}
