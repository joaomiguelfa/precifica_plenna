import type { PricingInput } from '../../types/pricing'

export interface SectionProps {
  input: PricingInput
  update: (recipe: (draft: PricingInput) => void) => void
}
