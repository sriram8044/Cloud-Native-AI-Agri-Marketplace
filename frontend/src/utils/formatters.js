/**
 * Localization formatting utilities for Indian Currency (INR), Numbers, and Dates
 * Supports en-IN (English), te-IN (Telugu), and hi-IN (Hindi).
 */

export const LOCALE_MAP = {
  en: 'en-IN',
  te: 'te-IN',
  hi: 'hi-IN',
};

/**
 * Returns the matching BCP 47 locale tag for a given language code.
 */
export function getLocale(lng = 'en') {
  return LOCALE_MAP[lng] || 'en-IN';
}

/**
 * Format a number as Indian Currency (INR) with standard symbol ₹.
 * Preserves decimal precision and uses locale group separators.
 */
export function formatCurrency(amount, lng = 'en') {
  const numeric = Number(amount);
  if (isNaN(numeric)) return '₹0.00';

  const locale = getLocale(lng);
  try {
    const formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numeric);
    return `₹${formatted}`;
  } catch {
    return `₹${numeric.toFixed(2)}`;
  }
}

/**
 * Format a number with locale-aware thousand/lakh separators.
 */
export function formatNumber(value, lng = 'en', options = {}) {
  const numeric = Number(value);
  if (isNaN(numeric)) return '0';

  const locale = getLocale(lng);
  try {
    return new Intl.NumberFormat(locale, options).format(numeric);
  } catch {
    return numeric.toLocaleString();
  }
}

/**
 * Format a date string or timestamp according to the selected locale.
 */
export function formatDate(dateVal, lng = 'en', options = {}) {
  if (!dateVal) return '';
  const date = new Date(dateVal);
  if (isNaN(date.getTime())) return String(dateVal);

  const locale = getLocale(lng);
  const defaultOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  };

  try {
    return new Intl.DateTimeFormat(locale, defaultOptions).format(date);
  } catch {
    return date.toLocaleDateString('en-IN', defaultOptions);
  }
}

/**
 * Format date & time according to the selected locale.
 */
export function formatDateTime(dateVal, lng = 'en', options = {}) {
  if (!dateVal) return '';
  const date = new Date(dateVal);
  if (isNaN(date.getTime())) return String(dateVal);

  const locale = getLocale(lng);
  const defaultOptions = {
    dateStyle: 'medium',
    timeStyle: 'short',
    ...options,
  };

  try {
    return new Intl.DateTimeFormat(locale, defaultOptions).format(date);
  } catch {
    return date.toLocaleString('en-IN', defaultOptions);
  }
}
