import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check, ChevronDown } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English', shortLabel: 'EN' },
  { code: 'te', label: 'తెలుగు', shortLabel: 'తె' },
  { code: 'hi', label: 'हिन्दी', shortLabel: 'हि' },
];

export default function LanguageSelector({ isMobile = false }) {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Normalize current language code (e.g., 'en-US' -> 'en')
  const currentLangCode = (i18n.language || 'en').split('-')[0];
  const currentLang = LANGUAGES.find((l) => l.code === currentLangCode) || LANGUAGES[0];

  const handleSelectLanguage = (code) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (isMobile) {
    return (
      <div className="pt-2 border-t border-slate-100">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2 px-1">
          {t('nav.language', 'Language')}
        </label>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={t('nav.language', 'Language')}>
          {LANGUAGES.map((lang) => {
            const isSelected = currentLang.code === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => handleSelectLanguage(lang.code)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition ${
                  isSelected
                    ? 'bg-forest-100 text-forest-900 border-forest-300 shadow-sm font-bold'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-forest-50/60'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5 text-forest-700 shrink-0" />}
                <span>{lang.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        id="language-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={t('nav.language', 'Language')}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition ${
          isOpen
            ? 'bg-forest-50 text-forest-900 border-forest-300 ring-2 ring-forest-500/20'
            : 'bg-white hover:bg-forest-50/60 text-slate-700 border-slate-200'
        }`}
      >
        <Globe className="w-3.5 h-3.5 text-forest-700 shrink-0" />
        <span className="font-bold">{currentLang.label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-labelledby="language-selector-button"
          className="absolute right-0 mt-2 w-40 bg-white rounded-2xl shadow-xl border border-forest-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 focus:outline-none"
        >
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
            {t('nav.language', 'Language')}
          </div>
          {LANGUAGES.map((lang) => {
            const isSelected = currentLang.code === lang.code;
            return (
              <button
                key={lang.code}
                role="option"
                aria-selected={isSelected}
                type="button"
                onClick={() => handleSelectLanguage(lang.code)}
                className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition ${
                  isSelected
                    ? 'bg-forest-50 text-forest-900 font-bold'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-forest-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-bold">
                    {lang.shortLabel}
                  </span>
                  <span>{lang.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-forest-700" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
