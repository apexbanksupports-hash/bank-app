import { bankingDirectory, CountryBanking, Bank } from '../data/banks';

export function searchBanks(query: string, countryCode?: string): (Bank & { country: string; countryCode: string })[] {
  const q = query.toLowerCase().trim();
  const results: (Bank & { country: string; countryCode: string })[] = [];

  for (const country of bankingDirectory) {
    if (countryCode && country.code !== countryCode.toUpperCase()) continue;
    for (const bank of country.banks) {
      if (!q || bank.name.toLowerCase().includes(q) || bank.swift.toLowerCase().includes(q)) {
        results.push({ ...bank, country: country.country, countryCode: country.code });
      }
    }
  }

  results.sort((a, b) => a.name.localeCompare(b.name));
  return results.slice(0, 50);
}

export function getCountries(): (Pick<CountryBanking, 'country' | 'code' | 'currency' | 'currencyCode'> & { flag: string })[] {
  return bankingDirectory.map(c => ({
    country: c.country,
    code: c.code,
    currency: c.currency,
    currencyCode: c.currencyCode,
    flag: getFlagEmoji(c.code),
  }));
}

export function getCountryByCode(code: string): CountryBanking | undefined {
  return bankingDirectory.find(c => c.code === code.toUpperCase());
}

export function getBanksByCountry(code: string): Bank[] {
  const country = getCountryByCode(code);
  return country ? country.banks : [];
}

function getFlagEmoji(code: string): string {
  const chars = [...code.toUpperCase()].map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65));
  return chars.join('');
}
