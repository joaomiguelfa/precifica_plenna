export const MIN_PASSWORD_LENGTH = 8

export const PASSWORD_HINT = `Pelo menos ${MIN_PASSWORD_LENGTH} caracteres, misturando letras e números (ex.: casa2024impressora).`

/** Requisito mínimo: tamanho, pelo menos uma letra e pelo menos um número. */
export function isPasswordValid(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH && /[a-zA-Z]/.test(password) && /[0-9]/.test(password)
}

export function passwordError(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`
  if (!/[a-zA-Z]/.test(password)) return 'A senha precisa ter pelo menos uma letra.'
  if (!/[0-9]/.test(password)) return 'A senha precisa ter pelo menos um número.'
  return null
}
