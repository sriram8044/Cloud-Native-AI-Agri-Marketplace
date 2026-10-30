import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import i18n, { LANGUAGE_STORAGE_KEY } from '../i18n';
import Navbar from '../components/Navbar';
import LanguageSelector from '../components/LanguageSelector';
import CropCard from '../components/CropCard';
import CropDetailModal from '../components/CropDetailModal';
import { AuthContext, AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { formatCurrency, formatNumber, formatDate, getLocale } from '../utils/formatters';

// Mock API modules for isolated component tests
vi.mock('../api/cropService', () => ({
  cropService: {
    getAllCrops: vi.fn().mockResolvedValue([]),
    getHealth: vi.fn().mockResolvedValue({ status: 'UP', service: 'agri-backend' }),
  },
}));

vi.mock('../api/aiService', () => ({
  aiService: {
    getDemandForecast: vi.fn(),
    getPriceRecommendation: vi.fn(),
    getProfitSummary: vi.fn(),
  },
}));

describe('Phase 8 Multilingual Support & Localization Tests', () => {
  beforeEach(async () => {
    // Reset language to English before each test
    await act(async () => {
      await i18n.changeLanguage('en');
    });
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
    } catch {
      // ignore
    }
  });

  it('verifies English is the default language and renders default navigation', () => {
    expect(i18n.language).toBe('en');

    render(
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Navbar />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByRole('link', { name: 'Home' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Marketplace' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Sell Crops' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeDefined();
    expect(screen.getByText('List Produce')).toBeDefined();
  });

  it('switches to Telugu and updates navigation labels immediately without reload', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Navbar />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    // Initial check: English
    expect(screen.getByRole('link', { name: 'Home' })).toBeDefined();

    // Switch to Telugu via LanguageSelector UI button
    const langBtn = screen.getByRole('button', { name: /Language/i });
    fireEvent.click(langBtn);

    const teOption = screen.getByRole('option', { name: /తెలుగు/i });
    fireEvent.click(teOption);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'హోమ్' })).toBeDefined();
      expect(screen.getByRole('link', { name: 'మార్కెట్ ప్లేస్' })).toBeDefined();
      expect(screen.getByRole('link', { name: 'పంటల అమ్మకం' })).toBeDefined();
      expect(screen.getByRole('link', { name: 'డ్యాష్‌బోర్డ్' })).toBeDefined();
      expect(screen.getByText('ఉత్పత్తిని చేర్చండి')).toBeDefined();
      expect(document.documentElement.lang).toBe('te');
    });
  });

  it('switches to Hindi and updates navigation labels immediately without reload', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Navbar />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    // Switch to Hindi via LanguageSelector UI button
    const langBtn = screen.getByRole('button', { name: /Language/i });
    fireEvent.click(langBtn);

    const hiOption = screen.getByRole('option', { name: /हिन्दी/i });
    fireEvent.click(hiOption);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'होम' })).toBeDefined();
      expect(screen.getByRole('link', { name: 'मार्केटप्लेस' })).toBeDefined();
      expect(screen.getByRole('link', { name: 'फसलें बेचें' })).toBeDefined();
      expect(screen.getByRole('link', { name: 'डैशबोर्ड' })).toBeDefined();
      expect(screen.getByText('उपज जोड़ें')).toBeDefined();
      expect(document.documentElement.lang).toBe('hi');
    });
  });

  it('persists selected language in localStorage across page refreshes', async () => {
    await act(async () => {
      await i18n.changeLanguage('te');
    });
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('te');

    await act(async () => {
      await i18n.changeLanguage('hi');
    });
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('hi');

    await act(async () => {
      await i18n.changeLanguage('en');
    });
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');
  });

  it('safely handles missing translation keys by falling back to default value or English', async () => {
    await act(async () => {
      await i18n.changeLanguage('te');
    });
    // Non-existent key falls back to defaultValue or key
    const fallbackText = i18n.t('nonexistent.key', 'My Safe Fallback');
    expect(fallbackText).toBe('My Safe Fallback');
  });

  it('correctly localizes currency, numbers, and dates across en-IN, te-IN, and hi-IN', () => {
    // 1. Locale tags
    expect(getLocale('en')).toBe('en-IN');
    expect(getLocale('te')).toBe('te-IN');
    expect(getLocale('hi')).toBe('hi-IN');

    // 2. Currency formatting maintains ₹ symbol and numeric precision
    const price = 125000.5;
    const enCurr = formatCurrency(price, 'en');
    const teCurr = formatCurrency(price, 'te');
    const hiCurr = formatCurrency(price, 'hi');

    expect(enCurr).toContain('₹');
    expect(enCurr).toContain('1,25,000.50');
    expect(teCurr).toContain('₹');
    expect(hiCurr).toContain('₹');

    // 3. Number formatting uses locale group separators
    const qty = 50000;
    expect(formatNumber(qty, 'en')).toBe('50,000');
    expect(formatNumber(qty, 'te')).toBe('50,000');
    expect(formatNumber(qty, 'hi')).toBe('50,000');

    // 4. Date formatting reflects locale
    const dateStr = '2026-10-28T10:00:00Z';
    const enDate = formatDate(dateStr, 'en');
    expect(enDate).toContain('2026');
    expect(enDate).toContain('Oct');
  });

  it('preserves role-based navigation tabs across English, Telugu, and Hindi', async () => {
    const mockCustomerAuth = {
      user: { id: 10, name: 'Sita Sharma', role: 'CUSTOMER', email: 'sita@test.com' },
      isFarmer: () => false,
      isAdmin: () => false,
      logout: vi.fn(),
    };

    const { rerender } = render(
      <BrowserRouter>
        <AuthContext.Provider value={mockCustomerAuth}>
          <CartProvider>
            <Navbar />
          </CartProvider>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // English Customer Nav
    expect(screen.getByText('My Orders')).toBeDefined();

    // Telugu Customer Nav
    await act(async () => {
      await i18n.changeLanguage('te');
    });
    expect(screen.getByText('నా ఆర్డర్‌లు')).toBeDefined();

    // Hindi Customer Nav
    await act(async () => {
      await i18n.changeLanguage('hi');
    });
    expect(screen.getByText('मेरे ऑर्डर्स')).toBeDefined();

    // Now test Farmer Nav
    const mockFarmerAuth = {
      user: { id: 20, name: 'Ramesh Patel', role: 'FARMER', email: 'ramesh@test.com' },
      isFarmer: () => true,
      isAdmin: () => false,
      logout: vi.fn(),
    };

    rerender(
      <BrowserRouter>
        <AuthContext.Provider value={mockFarmerAuth}>
          <CartProvider>
            <Navbar />
          </CartProvider>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Hindi Farmer Nav
    expect(screen.getByText('ऑर्डर प्रबंधन')).toBeDefined();
    expect(screen.getByText('एआई अंतर्दृष्टि')).toBeDefined();

    // Telugu Farmer Nav
    await act(async () => {
      await i18n.changeLanguage('te');
    });
    expect(screen.getByText('ఆర్డర్ల నిర్వహణ')).toBeDefined();
    expect(screen.getByText('AI అంతర్దృష్టులు')).toBeDefined();

    // English Farmer Nav
    await act(async () => {
      await i18n.changeLanguage('en');
    });
    expect(screen.getByText('Manage Orders')).toBeDefined();
    expect(screen.getByText('AI Insights')).toBeDefined();
  });

  it('renders CropCard and CropDetailModal accurately in Telugu and Hindi', async () => {
    const mockCrop = {
      id: 55,
      name: 'Organic Basmati Rice',
      category: 'Grains',
      description: 'Long grain aromatic farm harvested rice',
      pricePerKg: '68.00',
      availableQuantityKg: '1200.00',
      location: 'Karnal, Haryana',
      createdAt: '2026-10-25T08:00:00Z',
    };

    // Render under Telugu
    await act(async () => {
      await i18n.changeLanguage('te');
    });
    const { unmount } = render(
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <CropCard crop={mockCrop} onSelect={() => {}} />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Organic Basmati Rice')).toBeDefined();
    expect(screen.getByText(/68.00/i)).toBeDefined();
    expect(screen.getByText('యూనిట్ ధర')).toBeDefined();
    expect(screen.getByText('అందుబాటులో ఉంది')).toBeDefined();
    expect(screen.getByText('కార్ట్‌కు జోడించండి')).toBeDefined();
    expect(screen.getByText('వివరాలు చూడండి')).toBeDefined();

    unmount();

    // Render under Hindi
    await act(async () => {
      await i18n.changeLanguage('hi');
    });
    render(
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <CropDetailModal crop={mockCrop} onClose={() => {}} />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Organic Basmati Rice')).toBeDefined();
    expect(screen.getByText('मात्रा चुनें (किग्रा)')).toBeDefined();
    expect(screen.getByText(/कार्ट में 1 किग्रा जोड़ें/i)).toBeDefined();
    expect(screen.getByText('फसल की गुणवत्ता और विवरण')).toBeDefined();
  });

  it('renders LanguageSelector with readable language labels and handles selection', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <LanguageSelector />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    // Initial button displays current English name
    const btn = screen.getByRole('button', { name: /Language/i });
    expect(btn).toBeDefined();

    // Open dropdown
    fireEvent.click(btn);

    // Verify all 3 options exist by role option
    expect(screen.getByRole('option', { name: /English/i })).toBeDefined();
    expect(screen.getByRole('option', { name: /తెలుగు/i })).toBeDefined();
    expect(screen.getByRole('option', { name: /हिन्दी/i })).toBeDefined();

    // Click Telugu option
    fireEvent.click(screen.getByRole('option', { name: /తెలుగు/i }));

    await waitFor(() => {
      expect(i18n.language).toBe('te');
      expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('te');
    });
  });

  it('renders mobile LanguageSelector variant with radio buttons', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <LanguageSelector isMobile={true} />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    const radios = screen.getAllByRole('radio');
    expect(radios.length).toBe(3);

    // Click Hindi radio button
    fireEvent.click(screen.getByRole('radio', { name: /हिन्दी/i }));

    await waitFor(() => {
      expect(i18n.language).toBe('hi');
      expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('hi');
    });
  });
});
