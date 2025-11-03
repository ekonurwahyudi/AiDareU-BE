/**
 * Utility functions for currency formatting and parsing
 */

/**
 * Format number with Indonesian thousand separators (dots)
 * Example: 100000 -> "100.000"
 */
export const formatCurrency = (value: number | string): string => {
  if (!value && value !== 0) return ''
  
  const numericValue = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(numericValue)) return ''
  
  return numericValue.toLocaleString('id-ID')
}

/**
 * Parse formatted currency string to number
 * Example: "100.000" -> 100000
 */
export const parseCurrency = (value: string): number | '' => {
  if (!value) return ''
  
  // Remove all dots (thousand separators) and convert to number
  const numericString = value.replace(/\./g, '')
  const numericValue = parseFloat(numericString)
  
  return isNaN(numericValue) ? '' : numericValue
}

/**
 * Clean input value to only allow numbers and dots
 */
export const cleanCurrencyInput = (value: string): string => {
  return value.replace(/[^\d.]/g, '')
}

/**
 * Format currency for display with Rp prefix
 */
export const formatCurrencyWithPrefix = (value: number | string): string => {
  const formatted = formatCurrency(value)
  return formatted ? `Rp ${formatted}` : ''
}

/**
 * Validate if currency value is valid
 */
export const isValidCurrency = (value: string | number): boolean => {
  if (!value && value !== 0) return false
  const numericValue = typeof value === 'string' ? parseCurrency(value) : value
  return typeof numericValue === 'number' && numericValue >= 0
}