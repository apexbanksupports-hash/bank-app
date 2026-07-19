export function validateSwiftCode(code: string): { valid: boolean; error?: string } {
  const cleaned = code.replace(/\s/g, '').toUpperCase();
  if (cleaned.length < 8 || cleaned.length > 11) {
    return { valid: false, error: 'SWIFT/BIC code must be 8 or 11 characters' };
  }
  if (!/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(cleaned)) {
    return { valid: false, error: 'Invalid SWIFT/BIC format' };
  }
  return { valid: true };
}

export function formatSwiftCode(code: string): string {
  const cleaned = code.replace(/\s/g, '').toUpperCase();
  if (cleaned.length === 8) return cleaned;
  return cleaned;
}
