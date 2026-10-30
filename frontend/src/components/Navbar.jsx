import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Sprout, PlusCircle, Activity, Menu, X, User, LogOut, 
  LogIn, ShoppingCart, Package, ClipboardList 
} from 'lucide-react';
import { cropService } from '../api/cropService';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import LanguageSelector from './LanguageSelector';

export default function Navbar() {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, logout, isFarmer } = useAuth();
  const { cart } = useCart();
  const [backendStatus, setBackendStatus] = useState('checking'); // 'up', 'down', 'checking'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    try {
      const data = await cropService.getHealth();
      if (data && data.status === 'UP') {
        setBackendStatus('up');
      } else {
        setBackendStatus('down');
      }
    } catch {
      setBackendStatus('down');
    }
  };

  const navLinks = [
    { name: t('nav.home', 'Home'), path: '/' },
    { name: t('nav.marketplace', 'Marketplace'), path: '/marketplace' },
    { name: t('nav.sellCrops', 'Sell Crops'), path: '/sell' },
    { name: t('nav.dashboard', 'Dashboard'), path: '/dashboard' },
  ];

  // Add role-specific navigation tabs
  if (user && user.role === 'CUSTOMER') {
    navLinks.push({ name: t('nav.myOrders', 'My Orders'), path: '/orders' });
  } else if (user && isFarmer()) {
    navLinks.push({ name: t('nav.manageOrders', 'Manage Orders'), path: '/farmer/orders' });
    navLinks.push({ name: t('nav.aiInsights', 'AI Insights'), path: '/farmer/insights' });
  }

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'FARMER':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-sky-100 text-sky-800 border-sky-200';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-forest-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-forest-700 flex items-center justify-center text-white shadow-md shadow-forest-700/20 group-hover:bg-forest-800 transition">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold text-forest-900 tracking-tight block leading-none">
                {t('nav.brandTitle', 'Agri')} <span className="text-forest-600">{t('nav.brandHighlight', 'Marketplace')}</span>
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-600 block mt-0.5">
                {t('nav.brandSubtitle', 'Cloud-Native Farm Direct')}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive(link.path)
                    ? 'bg-forest-100 text-forest-900 font-semibold'
                    : 'text-slate-600 hover:text-forest-800 hover:bg-forest-50'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right actions: Language Selector + Backend status + Cart + Auth / User Menu + Sell CTA */}
          <div className="hidden md:flex items-center gap-3">
            {/* Multilingual Selector */}
            <LanguageSelector />

            {/* Live Backend Telemetry Indicator */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                backendStatus === 'up'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : backendStatus === 'checking'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
              title={backendStatus === 'up' ? 'Spring Boot API Active (:8080)' : 'API Offline'}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  backendStatus === 'up'
                    ? 'bg-emerald-500 animate-pulse'
                    : backendStatus === 'checking'
                    ? 'bg-amber-400'
                    : 'bg-rose-500'
                }`}
              />
              <Activity className="w-3.5 h-3.5" />
              <span>{backendStatus === 'up' ? t('nav.apiActive', 'API Active') : t('nav.apiOffline', 'API Offline')}</span>
            </div>

            {/* Shopping Cart Button with live Badge */}
            <Link
              to="/cart"
              className={`relative p-2 rounded-xl border transition flex items-center justify-center ${
                isActive('/cart')
                  ? 'bg-forest-100 text-forest-900 border-forest-300'
                  : 'bg-white hover:bg-forest-50 text-slate-700 border-slate-200'
              }`}
              title={t('nav.cart', 'Shopping Cart')}
            >
              <ShoppingCart className="w-5 h-5" />
              {cart && cart.totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-forest-700 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                  {cart.totalItems}
                </span>
              )}
            </Link>

            {/* Auth State / Profile */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="flex items-center gap-1.5 text-xs">
                  <div className="w-7 h-7 rounded-full bg-forest-100 text-forest-800 flex items-center justify-center font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-semibold text-slate-900 leading-tight truncate max-w-[110px]">
                      {user.name}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border inline-block w-fit ${getRoleBadge(
                        user.role
                      )}`}
                    >
                      {user.role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title={t('nav.signOut', 'Sign Out')}
                  aria-label={t('nav.signOut', 'Sign Out')}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-forest-800 px-2.5 py-1.5 rounded-lg hover:bg-forest-50 transition"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{t('nav.signIn', 'Sign In')}</span>
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center text-xs font-semibold bg-forest-100 text-forest-900 hover:bg-forest-200 px-3 py-1.5 rounded-lg transition"
                >
                  {t('nav.register', 'Register')}
                </Link>
              </div>
            )}

            {/* Sell Produce CTA */}
            <Link
              to="/sell"
              className="inline-flex items-center gap-1.5 bg-forest-700 hover:bg-forest-800 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-sm hover:shadow transition ml-1"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t('nav.listProduce', 'List Produce')}</span>
            </Link>
          </div>

          {/* Mobile menu button and cart */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              to="/cart"
              className="relative p-2 rounded-lg text-slate-700 hover:bg-forest-50"
              aria-label={t('nav.cart', 'Cart')}
            >
              <ShoppingCart className="w-5 h-5" />
              {cart && cart.totalItems > 0 && (
                <span className="absolute 0 top-0 right-0 bg-forest-700 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cart.totalItems}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-forest-50"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-forest-100 bg-white px-4 pt-3 pb-5 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-base font-medium ${
                isActive(link.path)
                  ? 'bg-forest-100 text-forest-900 font-semibold'
                  : 'text-slate-600 hover:bg-forest-50'
              }`}
            >
              {link.name}
            </Link>
          ))}

          <Link
            to="/cart"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between px-3 py-2 rounded-lg text-base font-medium text-slate-600 hover:bg-forest-50"
          >
            <span className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-forest-700" />
              {t('nav.cart', 'Shopping Cart')}
            </span>
            {cart && cart.totalItems > 0 && (
              <span className="bg-forest-700 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {cart.totalItems} {t('nav.items', 'items')}
              </span>
            )}
          </Link>

          {/* Mobile Language Selector */}
          <LanguageSelector isMobile={true} />

          <div className="pt-3 border-t border-slate-100 space-y-2">
            {user ? (
              <div className="flex items-center justify-between p-2 rounded-xl bg-forest-50/70">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-forest-700 text-white flex items-center justify-center font-bold text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{user.name}</div>
                    <div className="text-[10px] text-slate-500">{user.email} ({user.role})</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 px-2 py-1"
                >
                  {t('nav.signOut', 'Sign Out')}
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700"
                >
                  {t('nav.signIn', 'Sign In')}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 rounded-lg bg-forest-700 text-white text-sm font-semibold"
                >
                  {t('nav.register', 'Register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
