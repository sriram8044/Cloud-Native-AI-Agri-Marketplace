import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sprout, User, Mail, Lock, AlertCircle, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register, login } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CUSTOMER', // Default: CUSTOMER; can choose FARMER
  });

  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError(t('auth.valFullNameReq', 'Full name is required.'));
      return;
    }
    if (!formData.email.trim()) {
      setError(t('auth.valEmailReq', 'Valid email address is required.'));
      return;
    }
    if (formData.password.length < 6) {
      setError(t('auth.valPassLen', 'Password must be at least 6 characters long.'));
      return;
    }

    setSubmitting(true);
    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
      });

      // Auto login upon successful registration
      try {
        await login(formData.email.trim(), formData.password);
      } catch {
        // If auto-login fails, redirect to login page
      }

      setSuccess(true);
      setTimeout(() => {
        if (formData.role === 'FARMER') {
          navigate('/sell');
        } else {
          navigate('/marketplace');
        }
      }, 1500);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Registration failed. Please check your details and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl border border-forest-100 shadow-xl overflow-hidden p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-forest-700 text-white flex items-center justify-center mx-auto shadow-md shadow-forest-700/20">
            <Sprout className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {t('auth.createAccountTitle', 'Create an Account')}
          </h1>
          <p className="text-xs text-slate-500">
            {t('auth.createAccountSubtitle', "Join India's direct farm-to-buyer agricultural marketplace.")}
          </p>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{t('auth.regSuccess', 'Registration successful! Redirecting to marketplace...')}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t('auth.fullNameLabel', 'Full Name')}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Rajesh Kumar"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t('auth.emailLabel', 'Email Address')}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="rajesh@example.com"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t('auth.passwordMinLabel', 'Password (min. 6 characters)')}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>
          </div>

          {/* Account Role Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              {t('auth.accountRoleLabel', 'Account Role')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'CUSTOMER' })}
                className={`p-3 rounded-2xl border text-left transition ${
                  formData.role === 'CUSTOMER'
                    ? 'border-forest-600 bg-forest-50/80 ring-2 ring-forest-600/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold text-xs text-slate-900">{t('auth.buyerRole', 'Buyer / Customer')}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{t('auth.buyerRoleDesc', 'Browse & purchase crop lots')}</div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'FARMER' })}
                className={`p-3 rounded-2xl border text-left transition ${
                  formData.role === 'FARMER'
                    ? 'border-forest-600 bg-forest-50/80 ring-2 ring-forest-600/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold text-xs text-slate-900">{t('auth.farmerRole', 'Farmer / Producer')}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{t('auth.farmerRoleDesc', 'Publish & manage harvest')}</div>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              {t('auth.adminNotice', 'Note: Administrative roles cannot be registered through public registration.')}
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting || success}
            className="w-full py-3 px-4 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-70 mt-4"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('auth.creatingAccount', 'Creating account...')}</span>
              </>
            ) : (
              <>
                <span>{t('auth.registerBtn', 'Register Account')}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Login link */}
        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          {t('auth.alreadyRegistered', 'Already registered?')}{' '}
          <Link to="/login" className="font-bold text-forest-700 hover:underline">
            {t('auth.signInHere', 'Sign In here')}
          </Link>
        </div>
      </div>
    </div>
  );
}
