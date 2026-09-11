import { describe, expect, it } from 'vitest'
import { isPasswordValid, passwordError } from './password'

describe('isPasswordValid', () => {
  it('aceita uma senha com letras, números e 8+ caracteres', () => {
    expect(isPasswordValid('casa2024')).toBe(true)
  })

  it('rejeita senha curta demais', () => {
    expect(isPasswordValid('ab1')).toBe(false)
  })

  it('rejeita senha só com letras', () => {
    expect(isPasswordValid('somentetexto')).toBe(false)
  })

  it('rejeita senha só com números', () => {
    expect(isPasswordValid('12345678')).toBe(false)
  })
})

describe('passwordError', () => {
  it('retorna null para senha válida', () => {
    expect(passwordError('casa2024')).toBeNull()
  })

  it('avisa sobre tamanho mínimo primeiro', () => {
    expect(passwordError('a1')).toMatch(/8 caracteres/)
  })

  it('avisa sobre falta de letra', () => {
    expect(passwordError('12345678')).toMatch(/letra/)
  })

  it('avisa sobre falta de número', () => {
    expect(passwordError('abcdefgh')).toMatch(/número/)
  })
})
