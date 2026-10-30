import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sprout, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, Loader2, Sparkles, Lock, ShieldAlert } from 'lucide-react';
import { cropService } from '../api/cropService';
import { useAuth } from '../context/AuthContext';
import { formatNumber } from '../utils/formatters';

export default function SellCropPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isFarmer, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    category: 'Grains',
    description: '',
    pricePerKg: '',
    availableQuantityKg: '',
    location: '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [createdCrop, setCreatedCrop] = useState(null);

  const categories = [
    'Grains',
    'Vegetables',
    'Fruits',
    'Pulses',
    'Spices',
    'Oilseeds',
    'Commercial Crops',
  ];

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = t('sell.valNameReq', 'Crop name is required');
    else if (formData.name.length > 100) errs.name = t('sell.valNameMax', 'Crop name must not exceed 100 characters');

    if (!formData.category.trim()) errs.category = t('sell.valCatReq', 'Category is required');

    if (!formData.pricePerKg) errs.pricePerKg = t('sell.valPriceReq', 'Price per kg is required');
    else if (isNaN(formData.pricePerKg) || Number(formData.pricePerKg) <= 0)
      errs.pricePerKg = t('sell.valPricePos', 'Price must be a positive number greater than 0');

    if (!formData.availableQuantityKg) errs.availableQuantityKg = t('sell.valQtyReq', 'Available quantity is required');
    else if (isNaN(formData.availableQuantityKg) || Number(formData.availableQuantityKg) <= 0)
      errs.availableQuantityKg = t('sell.valQtyPos', 'Quantity must be a positive number greater than 0');

    if (!formData.location.trim()) errs.location = t('sell.valLocReq', 'Harvest location is required (e.g., District, State)');
    else if (formData.location.length > 100) errs.location = t('sell.valLocMax', 'Location must not exceed 100 characters');

    if (formData.description && formData.description.length > 1000)
      errs.description = t('sell.valDescMax', 'Description must not exceed 1000 characters');

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setSubmitting(true);
    try {
      const created = await cropService.createCrop(formData);
      setCreatedCrop(created);
    } catch (err) {
      if (err.response && err.response.data) {
        const data = err.response.data;
        if (data.validationErrors) {
          setErrors(data.validationErrors);
        } else {
          setServerError(data.message || 'Failed to list crop. Please check your input.');
        }
      } else {
        setServerError('Cannot reach backend on port 8080. Ensure Spring Boot service is active.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Auth Guard 1: Not Authenticated
  if (!authLoading && !user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {t('sell.signInRequiredTitle', 'Sign In Required to List Produce')}
          </h1>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            {t('sell.signInRequiredDesc', 'Crop publishing is restricted to verified agricultural producers. Please sign in with your farmer account to publish and manage harvests.')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
          <Link
            to="/login"
            state={{ from: location }}
            className="px-6 py-3 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-sm shadow-sm transition"
          >
            {t('sell.signInToContinue', 'Sign In to Continue')}
          </Link>
          <Link
            to="/register"
            className="px-6 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-sm transition"
          >
            {t('sell.registerAsFarmer', 'Register as a Farmer')}
          </Link>
        </div>
      </div>
    );
  }

  // Auth Guard 2: Authenticated but role is CUSTOMER
  if (!authLoading && user && !isFarmer()) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 bg-rose-100 text-rose-800 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {t('sell.farmerAccountRequiredTitle', 'Farmer Account Required')}
          </h1>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            {t('sell.farmerAccountRequiredDesc', { email: user?.email, defaultValue: `You are currently signed in as a Buyer / Customer (${user?.email}). Only registered Farmer accounts have permission to publish crop listings to the marketplace.` })}
          </p>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 max-w-md mx-auto">
          {t('sell.farmerRoleTip', 'Need to sell harvest? You can register a new account choosing the Farmer / Producer role or sign in with test credentials.')}
        </div>
        <div className="flex justify-center gap-3 pt-2">
          <Link
            to="/marketplace"
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition"
          >
            {t('sell.browseMarketplace', 'Browse Marketplace')}
          </Link>
          <Link
            to="/register"
            className="px-5 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-semibold text-xs shadow-sm transition"
          >
            {t('sell.registerFarmer', 'Register as Farmer')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link
        to="/marketplace"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-forest-700 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t('sell.backToMarketplace', 'Back to Marketplace')}</span>
      </Link>

      {/* Success View */}
      {createdCrop ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-forest-100 shadow-xl space-y-6 animate-in fade-in duration-200">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {t('sell.successTitle', 'Crop Listed Successfully!')}
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              {t('sell.successDesc', { name: createdCrop.name, farmer: user?.name, defaultValue: `Your produce listing for ${createdCrop.name} is now live in the marketplace catalog and associated with farmer ${user?.name}.` })}
            </p>
          </div>

          <div className="bg-forest-50/70 p-5 rounded-2xl border border-forest-100 max-w-sm mx-auto text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">{t('sell.catalogId', 'Catalog ID:')}</span>
              <span className="font-bold font-mono text-slate-800">#{createdCrop.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t('sell.unitPrice', 'Unit Price:')}</span>
              <span className="font-bold text-forest-800">₹{formatNumber(createdCrop.pricePerKg, i18n.language, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t('sell.quantity', 'Quantity:')}</span>
              <span className="font-bold text-slate-800">{formatNumber(createdCrop.availableQuantityKg, i18n.language)} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t('sell.location', 'Location:')}</span>
              <span className="font-medium text-slate-800">{createdCrop.location}</span>
            </div>
            <div className="flex justify-between border-t border-forest-100 pt-1">
              <span className="text-slate-500">{t('sell.listingFarmer', 'Listing Farmer:')}</span>
              <span className="font-semibold text-emerald-800">{createdCrop.farmerName || user?.name}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
            <button
              onClick={() => {
                setCreatedCrop(null);
                setFormData({
                  name: '',
                  category: 'Grains',
                  description: '',
                  pricePerKg: '',
                  availableQuantityKg: '',
                  location: '',
                });
              }}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              {t('sell.listAnother', 'List Another Crop')}
            </button>
            <button
              onClick={() => navigate('/marketplace')}
              className="px-5 py-2.5 rounded-xl bg-forest-700 text-white text-xs font-semibold hover:bg-forest-800 transition shadow-sm flex items-center justify-center gap-2"
            >
              <span>{t('sell.viewInMarketplace', 'View in Marketplace')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Create Form View */
        <div className="bg-white rounded-3xl border border-forest-100 shadow-xl overflow-hidden">
          <div className="bg-forest-900 text-white p-6 sm:p-8">
            <div className="flex items-center justify-between mb-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-800 text-forest-200 text-xs font-semibold">
                <Sprout className="w-3.5 h-3.5" />
                <span>{t('sell.producerPortal', 'Producer Portal')}</span>
              </div>
              {user && (
                <div className="text-xs text-forest-200">
                  {t('sell.signedInAs', 'Signed in as:')} <span className="font-bold text-white">{user.name}</span> ({user.role})
                </div>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {t('sell.publishTitle', 'Publish Farm Harvest')}
            </h1>
            <p className="text-forest-200 text-xs sm:text-sm mt-1 max-w-xl">
              {t('sell.publishSubtitle', 'Enter crop details, verified batch weight, and per-kilogram price. The listing will immediately reflect in the public agricultural inventory.')}
            </p>
          </div>

          {serverError && (
            <div className="mx-6 mt-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {/* Crop Name */}
            <div>
              <label htmlFor="name" className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                {t('sell.cropName', 'Crop Name')} <span className="text-rose-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder={t('sell.cropNamePlaceholder', 'e.g., Sharbati Organic Wheat, Basmati Rice 1121')}
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                  errors.name
                    ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20'
                    : 'border-slate-200 focus:ring-forest-600'
                }`}
              />
              {errors.name && <p className="text-rose-600 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Category & Location (2 columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="category" className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  {t('sell.category', 'Category')} <span className="text-rose-500">*</span>
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 bg-white"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {t(`categories.${c}`, c)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="location" className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  {t('sell.location', 'Farm / Harvest Location')} <span className="text-rose-500">*</span>
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder={t('sell.locationPlaceholder', 'e.g., Ludhiana, Punjab')}
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                    errors.location
                      ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20'
                      : 'border-slate-200 focus:ring-forest-600'
                  }`}
                />
                {errors.location && <p className="text-rose-600 text-xs mt-1">{errors.location}</p>}
              </div>
            </div>

            {/* Price & Quantity (2 columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="pricePerKg" className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  {t('sell.pricePerKg', 'Price per Kilogram (₹)')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
                    ₹
                  </span>
                  <input
                    id="pricePerKg"
                    name="pricePerKg"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.pricePerKg}
                    onChange={handleChange}
                    placeholder="45.00"
                    className={`w-full pl-8 pr-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                      errors.pricePerKg
                        ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20'
                        : 'border-slate-200 focus:ring-forest-600'
                    }`}
                  />
                </div>
                {errors.pricePerKg && <p className="text-rose-600 text-xs mt-1">{errors.pricePerKg}</p>}
              </div>

              <div>
                <label htmlFor="availableQuantityKg" className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  {t('sell.availableQty', 'Available Quantity (kg)')} <span className="text-rose-500">*</span>
                </label>
                <input
                  id="availableQuantityKg"
                  name="availableQuantityKg"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.availableQuantityKg}
                  onChange={handleChange}
                  placeholder="1500"
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                    errors.availableQuantityKg
                      ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20'
                      : 'border-slate-200 focus:ring-forest-600'
                  }`}
                />
                {errors.availableQuantityKg && (
                  <p className="text-rose-600 text-xs mt-1">{errors.availableQuantityKg}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                {t('sell.description', 'Quality Details / Harvest Notes')}
              </label>
              <textarea
                id="description"
                name="description"
                rows="3"
                value={formData.description}
                onChange={handleChange}
                placeholder={t('sell.descPlaceholder', 'Mention crop moisture levels, organic certifications, storage conditions, or grain grade...')}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
              {errors.description && <p className="text-rose-600 text-xs mt-1">{errors.description}</p>}
            </div>

            {/* AI Assistant Note */}
            <div className="bg-forest-50 p-4 rounded-2xl border border-forest-100 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-forest-700 shrink-0 mt-0.5" />
              <div className="text-xs text-forest-900 leading-relaxed">
                {t('sell.smartPricingNotice', 'Smart Pricing Advice (Preview): In Phase 5, the integrated AI microservice will automatically evaluate your crop variety and location against historical mandi prices to recommend optimal price bands.')}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-6 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('sell.publishing', 'Publishing to Marketplace...')}</span>
                  </>
                ) : (
                  <>
                    <Sprout className="w-4 h-4" />
                    <span>{t('sell.publishBtn', 'Publish Harvest Listing')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
