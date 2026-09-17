interface Props {
  className?: string
}

/**
 * Símbolo da marca Plenna (o "P" com o acento verde), reconstruído em SVG a
 * partir do guideline de marca — versão colorida, que funciona tanto em
 * fundo claro quanto escuro.
 */
export function PlennaMark({ className = 'h-8 w-8' }: Props) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M36 2C24.402 2 15 11.402 15 23v6H8a4 4 0 0 0-4 4v25a4 4 0 0 0 4 4h16a4 4 0 0 0 4-4V37h8c11.598 0 21-9.402 21-21S47.598 2 36 2Zm0 11a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z"
        fill="#FF6A00"
      />
      <path d="M32 45a7 7 0 0 1 14 0v9H32v-9Z" fill="#42B14B" />
    </svg>
  )
}
