import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconSearch, IconCheck, IconGlobe } from './Icons';
import { banks } from '../api/client';

interface BankOption {
  name: string;
  swift: string;
  type: string;
  country: string;
  countryCode: string;
}

interface CountryOption {
  country: string;
  code: string;
  flag: string;
  currency: string;
  currencyCode: string;
}

interface BankSelectProps {
  onSelect: (bank: BankOption | null) => void;
  selectedBank: BankOption | null;
  selectedCountry: CountryOption | null;
  onSelectCountry: (country: CountryOption | null) => void;
}

export default function BankSelect({ onSelect, selectedBank, selectedCountry, onSelectCountry }: BankSelectProps) {
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [filteredBanks, setFilteredBanks] = useState<BankOption[]>([]);
  const [bankSearch, setBankSearch] = useState('');
  const [countrySearch, setCountrySearch] = useState('');
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const bankRef = useRef<HTMLDivElement>(null);
  const countryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    banks.countries().then(setCountries).catch(() => {});
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (bankRef.current && !bankRef.current.contains(e.target as Node)) setBankOpen(false);
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) setCountryOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!selectedCountry) { setFilteredBanks([]); return; }
    setLoadingBanks(true);
    banks.byCountry(selectedCountry.code).then(data => {
      setFilteredBanks(data);
      setLoadingBanks(false);
    }).catch(() => setLoadingBanks(false));
  }, [selectedCountry]);

  const countryFiltered = countries.filter(c =>
    c.country.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const bankFiltered = filteredBanks.filter(b =>
    b.name.toLowerCase().includes(bankSearch.toLowerCase()) ||
    b.swift.toLowerCase().includes(bankSearch.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div ref={countryRef} className="relative">
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          Destination Country
        </label>
        <div
          onClick={() => setCountryOpen(!countryOpen)}
          className="w-full px-4 py-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        >
          {selectedCountry ? (
            <>
              <span className="text-xl">{selectedCountry.flag}</span>
              <div className="flex-1">
                <p className="text-sm font-medium">{selectedCountry.country}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{selectedCountry.currency} ({selectedCountry.currencyCode})</p>
              </div>
            </>
          ) : (
            <span style={{ color: 'var(--text-muted)' }} className="text-sm">Select a country</span>
          )}
          <svg className={`w-4 h-4 transition-transform ${countryOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>
        <AnimatePresence>
          {countryOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute z-30 left-0 right-0 mt-1 rounded-xl border shadow-xl overflow-hidden"
              style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border)' }}
            >
              <div className="p-2">
                <div className="relative">
                  <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input
                    value={countrySearch}
                    onChange={e => setCountrySearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-lg text-sm focus:outline-none"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    placeholder="Search countries..."
                    autoFocus
                  />
                </div>
              </div>
              <div className="max-h-52 overflow-y-auto">
                {countryFiltered.map(c => (
                  <button
                    key={c.code}
                    onClick={() => { onSelectCountry(c); setCountryOpen(false); setCountrySearch(''); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all hover:bg-white/5"
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    <span className="text-lg">{c.flag}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{c.country}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.code} · {c.currencyCode}</p>
                    </div>
                    {selectedCountry?.code === c.code && <IconCheck size={14} className="text-blue-400 shrink-0" />}
                  </button>
                ))}
                {countryFiltered.length === 0 && (
                  <p className="px-4 py-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>No countries found</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div ref={bankRef} className="relative">
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          Bank
        </label>
        <div
          onClick={() => selectedCountry && setBankOpen(!bankOpen)}
          className="w-full px-4 py-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            opacity: selectedCountry ? 1 : 0.5,
          }}
        >
          {selectedBank ? (
            <>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>
                {selectedBank.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedBank.name}</p>
                <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{selectedBank.swift}</p>
              </div>
            </>
          ) : (
            <span style={{ color: 'var(--text-muted)' }} className="text-sm">
              {selectedCountry ? 'Search or select a bank' : 'Select a country first'}
            </span>
          )}
          {selectedCountry && (
            <svg className={`w-4 h-4 transition-transform ${bankOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          )}
        </div>
        <AnimatePresence>
          {bankOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute z-30 left-0 right-0 mt-1 rounded-xl border shadow-xl overflow-hidden"
              style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border)' }}
            >
              <div className="p-2">
                <div className="relative">
                  <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input
                    value={bankSearch}
                    onChange={e => setBankSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-lg text-sm focus:outline-none"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    placeholder="Search banks..."
                    autoFocus
                  />
                </div>
              </div>
              <div className="max-h-52 overflow-y-auto">
                {loadingBanks ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : bankFiltered.length > 0 ? (
                  bankFiltered.map((b, i) => (
                    <button
                      key={`${b.swift}-${i}`}
                      onClick={() => { onSelect(b); setBankOpen(false); setBankSearch(''); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all hover:bg-white/5"
                      style={{ borderBottom: '1px solid var(--border)' }}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>
                        {b.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{b.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{b.swift}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${b.type === 'central' ? 'text-amber-400 bg-amber-400/10' : b.type === 'islamic' ? 'text-emerald-400 bg-emerald-400/10' : 'text-blue-400 bg-blue-400/10'}`}>
                            {b.type}
                          </span>
                        </div>
                      </div>
                      {selectedBank?.swift === b.swift && <IconCheck size={14} className="text-blue-400 shrink-0" />}
                    </button>
                  ))
                ) : (
                  <p className="px-4 py-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>No banks found</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
