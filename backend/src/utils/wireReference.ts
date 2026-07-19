export function generateWireReferenceNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'WIR-';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateTrackingNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 20; i++) {
    if (i > 0 && i % 4 === 0) result += '-';
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function calculateWireFee(amount: number, currency: string = 'USD'): number {
  const feeRate = 0.015;
  const minFee = 10;
  const maxFee = 50;
  const fee = Math.round(amount * feeRate * 100) / 100;
  return Math.max(minFee, Math.min(maxFee, fee));
}

export function getEstimatedArrival(countryCode: string): Date {
  const now = new Date();
  let days = 3;
  const euCountries = ['GB', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'PT', 'IE', 'FI', 'SE', 'DK', 'NO', 'CH', 'PL', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SK', 'SI', 'LT', 'LV', 'EE', 'LU', 'MT', 'CY', 'GR'];
  const americas = ['US', 'CA', 'MX', 'BR', 'AR', 'CL', 'CO', 'PE', 'PA', 'CR', 'GT', 'HN', 'SV', 'NI', 'DO', 'PR', 'JM', 'TT', 'BS', 'BB', 'CU', 'HT', 'BZ'];
  const asia = ['JP', 'CN', 'KR', 'IN', 'SG', 'HK', 'TH', 'PH', 'MY', 'ID', 'VN', 'TW', 'BD', 'PK', 'LK', 'NP'];
  
  if (americas.includes(countryCode)) days = 1;
  else if (euCountries.includes(countryCode)) days = 2;
  else if (asia.includes(countryCode)) days = 3;
  else days = 4;
  
  const arrival = new Date(now);
  arrival.setDate(arrival.getDate() + days);
  
  while (arrival.getDay() === 0 || arrival.getDay() === 6) {
    arrival.setDate(arrival.getDate() + 1);
  }
  
  return arrival;
}
