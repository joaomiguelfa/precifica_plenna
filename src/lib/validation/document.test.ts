import { describe, expect, it } from 'vitest'
import { documentLabel, formatDocument, isValidDocument, onlyDigits } from './document'

describe('onlyDigits', () => {
  it('remove tudo que não é número', () => {
    expect(onlyDigits('111.444.777-35')).toBe('11144477735')
  })
})

describe('formatDocument', () => {
  it('aplica máscara de CPF conforme os dígitos chegam', () => {
    expect(formatDocument('11144477735')).toBe('111.444.777-35')
  })

  it('aplica máscara de CNPJ conforme os dígitos chegam', () => {
    expect(formatDocument('11222333000181')).toBe('11.222.333/0001-81')
  })
})

describe('isValidDocument', () => {
  it('aceita um CPF com dígitos verificadores corretos', () => {
    expect(isValidDocument('111.444.777-35')).toBe(true)
  })

  it('rejeita um CPF com dígito verificador errado', () => {
    expect(isValidDocument('111.444.777-34')).toBe(false)
  })

  it('rejeita CPF com todos os dígitos iguais', () => {
    expect(isValidDocument('111.111.111-11')).toBe(false)
  })

  it('aceita um CNPJ com dígitos verificadores corretos', () => {
    expect(isValidDocument('11.222.333/0001-81')).toBe(true)
  })

  it('rejeita um CNPJ com dígito verificador errado', () => {
    expect(isValidDocument('11.222.333/0001-80')).toBe(false)
  })

  it('rejeita quantidade de dígitos que não é nem CPF nem CNPJ', () => {
    expect(isValidDocument('123456')).toBe(false)
  })
})

describe('documentLabel', () => {
  it('identifica CPF pela quantidade de dígitos', () => {
    expect(documentLabel('111.444.777-35')).toBe('CPF')
  })

  it('identifica CNPJ pela quantidade de dígitos', () => {
    expect(documentLabel('11.222.333/0001-81')).toBe('CNPJ')
  })

  it('retorna null para quantidade de dígitos inválida', () => {
    expect(documentLabel('123')).toBeNull()
  })
})
