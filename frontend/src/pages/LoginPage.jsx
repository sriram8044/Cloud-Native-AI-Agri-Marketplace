import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sprout, Lock, Mail, AlertCircle, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Return to intended page if redirected
  const from = location.state?.from?.pathname || '/marketplace';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError(t('auth.valCredsReq', 'Please provide both email address and password.'));
      return;
    }

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError(t('auth.loginInvalid', 'Invalid email or password. Please verify your credentials.'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError(null);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl border border-forest-100 shadow-xl overflow-hidden p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-forest-700 text-white flex items-center justify-center mx-auto shadow-md shadow-forest-700/20">
            <Sprout className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {t('auth.signInTitle', 'Sign In to Agri Marketplace')}
          </h1>
          <p className="text-xs text-slate-500">
            {t('auth.signInSubtitle', 'Access direct farm producer pricing and manage harvest listings.')}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t('auth.emailLabel', 'Email Address')}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t('auth.passwordLabel', 'Password')}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('auth.verifying', 'Verifying credentials...')}</span>
              </>
            ) : (
              <>
                <span>{t('auth.signInBtn', 'Sign In')}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Helper */}
        <div className="bg-forest-50/70 p-4 rounded-2xl border border-forest-100/70 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-forest-900">
            <ShieldCheck className="w-4 h-4 text-forest-700" />
            <span>{t('auth.testAccounts', 'Test Accounts (Phase 4 Quick Fill)')}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleQuickFill('farmer@agrimarket.com', 'Farmer@123')}
              className="text-left p-2 rounded-xl bg-white border border-forest-200 text-[11px] hover:bg-forest-100/50 transition"
            >
              <div className="font-bold text-forest-900">{t('auth.demoFarmer', 'Demo Farmer')}</div>
              <div className="text-slate-500 truncate">farmer@agrimarket.com</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('admin@agrimarket.com', 'Admin@123')}
              className="text-left p-2 rounded-xl bg-white border border-forest-200 text-[11px] hover:bg-forest-100/50 transition"
            >
              <div className="font-bold text-forest-900">{t('auth.demoAdmin', 'Demo Admin')}</div>
              <div className="text-slate-500 truncate">admin@agrimarket.com</div>
            </button>
          </div>
        </div>

        {/* Register link */}
        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          {t('auth.noAccountYet', "Don't have an account yet?")}{' '}
          <Link to="/register" className="font-bold text-forest-700 hover:underline">
            {t('auth.registerAsFarmerOrBuyer', 'Register as Farmer or Buyer')}
          </Link>
        </div>
      </div>
    </div>
  );
}
