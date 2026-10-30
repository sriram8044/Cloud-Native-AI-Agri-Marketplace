import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp, TrendingDown, DollarSign, AlertTriangle, CheckCircle2,
  BarChart2, Info, ShieldCheck, Layers, Sparkles, RefreshCw,
  ArrowRight, Sprout, PieChart, Calendar, HelpCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cropService } from '../api/cropService';
import { aiService } from '../api/aiService';
import { formatNumber } from '../utils/formatters';

export default function FarmerInsightsPage() {
  const { t, i18n } = useTranslation();
  const { user, isFarmer } = useAuth();
  const navigate = useNavigate();

  const [crops, setCrops] = useState([]);
  const [selectedCropId, setSelectedCropId] = useState('');
  const [horizonDays, setHorizonDays] = useState(7);
  const [costInput, setCostInput] = useState('');

  // AI responses
  const [forecastData, setForecastData] = useState(null);
  const [pricingData, setPricingData] = useState(null);
  const [profitData, setProfitData] = useState(null);

  // Loading & error states
  const [loadingCrops, setLoadingCrops] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [loadingProfit, setLoadingProfit] = useState(false);
  const [serviceError, setServiceError] = useState(null);

  // 1. Fetch Farmer's active crops
  useEffect(() => {
    if (!user) return;
    if (!isFarmer()) return;

    fetchFarmerCrops();
  }, [user]);

  const fetchFarmerCrops = async () => {
    try {
      setLoadingCrops(true);
      const allCrops = await cropService.getAllCrops();
      // Filter crops owned by this farmer
      const farmerCrops = allCrops.filter(
        c => c.farmerId === user.id || c.farmerName === user.name
      );
      setCrops(farmerCrops);

      if (farmerCrops.length > 0) {
        setSelectedCropId(farmerCrops[0].id.toString());
      }
    } catch (err) {
      console.error('Failed to load farmer crops:', err);
    } finally {
      setLoadingCrops(false);
    }
  };

  // 2. Fetch AI Insights when selected crop or horizon changes
  useEffect(() => {
    if (selectedCropId) {
      fetchCropAiInsights(selectedCropId, horizonDays);
    }
  }, [selectedCropId, horizonDays]);

  // 3. Fetch Profit Intelligence
  useEffect(() => {
    if (user && isFarmer()) {
      fetchProfitSummary();
    }
  }, [user]);

  const fetchCropAiInsights = async (cropId, horizon) => {
    setLoadingInsights(true);
    setServiceError(null);

    try {
      const [forecastRes, pricingRes] = await Promise.all([
        aiService.getDemandForecast(cropId, horizon),
        aiService.getPriceRecommendation(cropId, costInput ? parseFloat(costInput) : null),
      ]);

      setForecastData(forecastRes);
      setPricingData(pricingRes);
    } catch (err) {
      console.error('Error fetching AI insights:', err);
      const msg = err.response?.data?.message || err.message || 'AI service is temporarily unavailable.';
      setServiceError(msg);
      setForecastData(null);
      setPricingData(null);
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleRecalculatePricing = async (e) => {
    e.preventDefault();
    if (!selectedCropId) return;

    try {
      setLoadingInsights(true);
      const pricingRes = await aiService.getPriceRecommendation(
        selectedCropId,
        costInput ? parseFloat(costInput) : null
      );
      setPricingData(pricingRes);

      // Also refresh profit summary with updated crop cost
      const costMap = {};
      if (costInput && !isNaN(parseFloat(costInput))) {
        costMap[selectedCropId] = parseFloat(costInput);
      }
      const profitRes = await aiService.getProfitSummary(costMap);
      setProfitData(profitRes);
    } catch (err) {
      console.error('Failed to recalculate pricing:', err);
      setServiceError(err.response?.data?.message || 'Pricing update failed.');
    } finally {
      setLoadingInsights(false);
    }
  };

  const fetchProfitSummary = async () => {
    setLoadingProfit(true);
    try {
      const costMap = {};
      if (costInput && selectedCropId && !isNaN(parseFloat(costInput))) {
        costMap[selectedCropId] = parseFloat(costInput);
      }
      const profitRes = await aiService.getProfitSummary(costMap);
      setProfitData(profitRes);
    } catch (err) {
      console.error('Failed to fetch profit summary:', err);
    } finally {
      setLoadingProfit(false);
    }
  };

  // Guard: Unauthorized if not logged in or not farmer
  if (!user || !isFarmer()) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {t('aiInsights.farmerAccessRequired', 'Farmer Access Required')}
        </h2>
        <p className="text-slate-600 mb-6 max-w-md mx-auto">
          {t('aiInsights.farmerAccessDesc', 'The AI Demand Forecasting, Dynamic Pricing, and Profit Intelligence suite is reserved for verified farmers.')}
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-forest-700 hover:bg-forest-800 text-white font-medium rounded-xl transition"
        >
          <span>{t('farmerOrders.signInBtn', 'Sign In as Farmer')}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Header Banner */}
      <section className="bg-gradient-to-r from-forest-900 via-forest-800 to-emerald-900 text-white py-10 px-4 sm:px-6 lg:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold tracking-wide uppercase mb-3 border border-emerald-400/30">
                <Sparkles className="w-3.5 h-3.5" />
                {t('aiInsights.headerBadge', 'Explainable Decision Intelligence')}
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                {t('aiInsights.title', 'Farmer AI Intelligence & Profit Dashboard')}
              </h1>
              <p className="mt-2 text-forest-100 text-sm max-w-2xl">
                {t('aiInsights.subtitle', 'Real-world demand forecasting, data-driven dynamic pricing guardrails, and verified crop profit intelligence.')}
              </p>
            </div>

            {/* Quick Stats Pill */}
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur border border-white/10 rounded-2xl p-4 self-start md:self-auto">
              <div className="w-10 h-10 rounded-xl bg-emerald-400/20 flex items-center justify-center text-emerald-300">
                <Sprout className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-forest-200 uppercase font-medium block">
                  {t('aiInsights.activeListings', 'Active Listings')}
                </span>
                <span className="text-xl font-bold">
                  {t('aiInsights.cropsCount', { count: crops.length, defaultValue: `${crops.length} Crops` })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* Service Error Alert */}
        {serviceError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start justify-between gap-4 text-red-900 shadow-sm animate-fadeIn">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-sm">
                  {t('aiInsights.connectionNotice', 'AI Service Connection Notice')}
                </h4>
                <p className="text-xs text-red-700 mt-0.5">{serviceError}</p>
                <p className="text-xs text-red-600 mt-1 italic">
                  {t('aiInsights.connectionNoticeTip', 'Ensure the Python FastAPI service is running on port 8000 and reachable by Spring Boot.')}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                if (selectedCropId) fetchCropAiInsights(selectedCropId, horizonDays);
                fetchProfitSummary();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-semibold rounded-lg transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {t('aiInsights.retry', 'Retry')}
            </button>
          </div>
        )}

        {/* Controls Card: Crop Selector & Forecast Horizon */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            {/* Crop Selector */}
            <div className="md:col-span-1">
              <label htmlFor="cropSelect" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                {t('aiInsights.selectCrop', 'Select Your Crop Listing')}
              </label>
              {loadingCrops ? (
                <div className="h-10 bg-slate-100 animate-pulse rounded-xl" />
              ) : crops.length === 0 ? (
                <div className="text-sm text-slate-500 py-2">
                  {t('aiInsights.noActiveCrops', 'No active crops found.')}{' '}
                  <Link to="/sell" className="text-forest-600 font-semibold underline">
                    {t('aiInsights.createListing', 'Create a listing')}
                  </Link>
                </div>
              ) : (
                <select
                  id="cropSelect"
                  value={selectedCropId}
                  onChange={(e) => setSelectedCropId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:bg-white transition"
                >
                  {crops.map((crop) => (
                    <option key={crop.id} value={crop.id}>
                      {crop.name} — ₹{formatNumber(crop.pricePerKg, i18n.language, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/kg ({formatNumber(crop.availableQuantityKg, i18n.language)} kg)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Forecast Horizon */}
            <div>
              <label htmlFor="horizonSelect" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                {t('aiInsights.forecastHorizon', 'Forecast Horizon')}
              </label>
              <select
                id="horizonSelect"
                value={horizonDays}
                onChange={(e) => setHorizonDays(parseInt(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:bg-white transition"
              >
                <option value={7}>{t('aiInsights.horizon7', '7 Days (Short-term)')}</option>
                <option value={14}>{t('aiInsights.horizon14', '14 Days (Bi-weekly)')}</option>
                <option value={30}>{t('aiInsights.horizon30', '30 Days (Monthly Outlook)')}</option>
              </select>
            </div>

            {/* Production Cost per kg input */}
            <div>
              <label htmlFor="costInput" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                {t('aiInsights.productionCost', 'Your Production Cost / kg (₹)')} <span className="text-slate-500 font-normal">{t('aiInsights.optional', '(Optional)')}</span>
              </label>
              <form onSubmit={handleRecalculatePricing} className="flex gap-2">
                <input
                  id="costInput"
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="e.g. 32.00"
                  value={costInput}
                  onChange={(e) => setCostInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:bg-white transition"
                />
                <button
                  type="submit"
                  disabled={loadingInsights}
                  className="px-4 py-2.5 bg-forest-700 hover:bg-forest-800 text-white text-xs font-semibold rounded-xl transition flex-shrink-0 flex items-center gap-1.5 shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingInsights ? 'animate-spin' : ''}`} />
                  {t('aiInsights.recalculate', 'Recalculate')}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Loading Spinner for Insights */}
        {loadingInsights && (
          <div className="py-16 text-center">
            <div className="inline-block w-10 h-10 border-4 border-forest-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm font-medium text-slate-600">
              {t('aiInsights.runningEvaluation', 'Running demand aggregation, model evaluation, and pricing rules...')}
            </p>
          </div>
        )}

        {!loadingInsights && (
          <div className="space-y-8">
            {/* GRID: 1. Demand Forecast & 2. Dynamic Pricing Recommendation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* CARD 1: Demand Forecasting */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center">
                        <BarChart2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">
                          {t('aiInsights.demandForecastTitle', 'Crop Demand Forecast')}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {t('aiInsights.demandForecastSubtitle', 'Based on completed customer orders')}
                        </p>
                      </div>
                    </div>
                    {forecastData && (
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                        forecastData.has_sufficient_data
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {forecastData.has_sufficient_data ? t('aiInsights.trainedModel', 'Trained Model') : t('aiInsights.sparseDataFallback', 'Sparse Data / Fallback')}
                      </span>
                    )}
                  </div>

                  {/* Insufficient Data Notice */}
                  {forecastData && !forecastData.has_sufficient_data && (
                    <div className="mt-4 p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Info className="w-4 h-4 text-amber-600" />
                        <span>{t('aiInsights.dataLimitationNotice', 'Data Limitation Notice')}</span>
                      </div>
                      <p>
                        {t('aiInsights.dataLimitationText', {
                          count: forecastData.historical_points_count,
                          min: forecastData.minimum_points_required,
                          defaultValue: `This crop listing currently has ${forecastData.historical_points_count} historical order point(s). A minimum of ${forecastData.minimum_points_required} distinct chronological periods is required to reliably train autoregressive ML models without temporal data leakage.`,
                        })}
                      </p>
                      <p className="text-amber-700 italic">
                        {t('aiInsights.naiveBaselineNote', 'Values shown below represent a naive baseline estimate to guide orientation until additional order velocity is registered.')}
                      </p>
                    </div>
                  )}

                  {/* Visual Chart / Projection Breakdown */}
                  {forecastData && forecastData.forecast && forecastData.forecast.length > 0 ? (
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-3 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                        <span>{t('aiInsights.dateCol', { horizon: forecastData.forecast_horizon_days, defaultValue: `Date (Next ${forecastData.forecast_horizon_days} Days)` })}</span>
                        <span>{t('aiInsights.projectedDemandCol', 'Projected Demand (kg)')}</span>
                      </div>
                      <div className="space-y-2">
                        {forecastData.forecast.map((pt, idx) => {
                          const maxVal = Math.max(...forecastData.forecast.map(p => p.predicted_demand_kg), 1.0);
                          const pct = Math.min(100, Math.max(10, (pt.predicted_demand_kg / maxVal) * 100));
                          const formattedDemand = formatNumber(pt.predicted_demand_kg, i18n.language, {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1,
                          });
                          return (
                            <div key={idx} className="flex items-center gap-3">
                              <span className="text-xs font-mono text-slate-600 w-24">{pt.date}</span>
                              <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden relative">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    pt.is_fallback ? 'bg-amber-400' : 'bg-forest-600'
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold text-slate-800 w-20 text-right font-mono">
                                {formattedDemand} kg
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-sm text-slate-400">
                      {t('aiInsights.noProjections', 'No forecast projections available.')}
                    </div>
                  )}
                </div>

                {/* Model Evaluation Card Footer */}
                {forecastData && (
                  <div className="mt-6 pt-4 border-t border-slate-100 bg-slate-50/80 -mx-6 -mb-6 p-4 rounded-b-2xl">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                      {t('aiInsights.modelEvaluationTitle', 'Model Evaluation Metrics')}
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">{t('aiInsights.baselinePersistence', 'Baseline Persistence')}</span>
                        <span className="font-semibold text-slate-800 block mt-0.5">
                          {forecastData.baseline_model?.mae != null ? `MAE: ${formatNumber(forecastData.baseline_model.mae, i18n.language, { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg` : 'N/A (Sparse)'}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {forecastData.baseline_model?.rmse != null ? `RMSE: ${formatNumber(forecastData.baseline_model.rmse, i18n.language, { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg` : t('aiInsights.evalWithheld', 'Evaluation withheld')}
                        </span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">{t('aiInsights.ridgeModel', 'Ridge Regularized Model')}</span>
                        <span className="font-semibold text-forest-700 block mt-0.5">
                          {forecastData.evaluated_model?.mae != null ? `MAE: ${formatNumber(forecastData.evaluated_model.mae, i18n.language, { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg` : 'N/A (Sparse)'}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {forecastData.evaluated_model?.rmse != null ? `RMSE: ${formatNumber(forecastData.evaluated_model.rmse, i18n.language, { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg` : t('aiInsights.evalWithheld', 'Evaluation withheld')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* CARD 2: Explainable Dynamic Pricing */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">
                          {t('aiInsights.pricingTitle', 'Explainable Price Recommendation')}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {t('aiInsights.pricingSubtitle', 'Inventory elasticity & cost-floor protection')}
                        </p>
                      </div>
                    </div>
                    {pricingData && (
                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                        {pricingData.methodology === 'HYBRID_ML_RULE' ? t('aiInsights.hybridMethodology', 'Hybrid ML + Rules') : t('aiInsights.ruleMethodology', 'Explainable Rule Engine')}
                      </span>
                    )}
                  </div>

                  {pricingData ? (
                    <div className="mt-5 space-y-5">
                      {/* Price Comparison Summary */}
                      <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/70">
                        <div>
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block">
                            {t('aiInsights.currentListedPrice', 'Current Listed Price')}
                          </span>
                          <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                            ₹{formatNumber(pricingData.current_price_per_kg, i18n.language, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            <span className="text-xs font-normal text-slate-500"> / kg</span>
                          </span>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-forest-700 uppercase tracking-wide block">
                            {t('aiInsights.suggestedPrice', 'Suggested Price')}
                          </span>
                          <span className="text-2xl font-extrabold text-forest-700 mt-1 block">
                            ₹{formatNumber(pricingData.suggested_price_per_kg, i18n.language, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            <span className="text-xs font-normal text-slate-500"> / kg</span>
                          </span>
                        </div>
                      </div>

                      {/* Recommended Price Band Range */}
                      {pricingData.price_range && (
                        <div className="p-3 bg-forest-50/60 rounded-xl border border-forest-100 flex items-center justify-between">
                          <span className="text-xs font-bold text-forest-900 uppercase tracking-wide">
                            {t('aiInsights.recommendedRangeBand', 'Recommended Range Band')}
                          </span>
                          <span className="text-sm font-extrabold text-forest-800 font-mono">
                            ₹{formatNumber(pricingData.price_range.min_price_per_kg, i18n.language, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} — ₹{formatNumber(pricingData.price_range.max_price_per_kg, i18n.language, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / kg
                          </span>
                        </div>
                      )}

                      {/* Explanatory Factors Breakdown */}
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5">
                          {t('aiInsights.influencingFactors', 'Influencing Factors & Rationale')}
                        </h4>
                        <div className="space-y-2">
                          {pricingData.factors?.map((f, i) => {
                            let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
                            if (f.impact === 'PROTECTIVE') badgeStyle = 'bg-purple-100 text-purple-800 border-purple-200';
                            if (f.impact === 'POSITIVE') badgeStyle = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                            if (f.impact === 'NEGATIVE') badgeStyle = 'bg-amber-100 text-amber-800 border-amber-200';

                            return (
                              <div key={i} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <span className="font-bold text-slate-800">{f.factor}</span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border ${badgeStyle}`}>
                                    {f.impact}
                                  </span>
                                </div>
                                <p className="text-slate-600 leading-relaxed">{f.description}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-sm text-slate-400">
                      Pricing recommendation unavailable.
                    </div>
                  )}
                </div>

                {/* Farmer Guardrail Notice */}
                <div className="mt-6 pt-4 border-t border-slate-100 bg-amber-50/60 -mx-6 -mb-6 p-4 rounded-b-2xl border-b border-amber-200/40">
                  <div className="flex items-start gap-2 text-xs text-amber-900">
                    <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-semibold">
                        {t('aiInsights.farmerApprovalRequired', 'Farmer Approval Required')}
                      </strong>
                      <span>{t('aiInsights.farmerApprovalDesc', 'Prices in the marketplace are never altered automatically. Any price update requires your explicit manual review and approval on the crop edit form.')}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* SECTION 3: Farmer Profit Intelligence */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                    <PieChart className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      {t('aiInsights.profitTitle', 'Farmer Profit Intelligence')}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {t('aiInsights.profitSubtitle', 'Gross order revenue vs farmer-verified input costs')}
                    </p>
                  </div>
                </div>

                {profitData && (
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border self-start sm:self-auto ${
                    profitData.profit_available
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {profitData.profit_available ? t('aiInsights.verifiedMargin', 'Verified Profit Margin') : t('aiInsights.costRequired', 'Cost Input Required')}
                  </span>
                )}
              </div>

              {/* Profit Metric Cards */}
              {profitData && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
                  {/* Gross Revenue */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block">
                      {t('aiInsights.grossRevenue', 'Gross Sales Revenue')}
                    </span>
                    <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                      ₹{formatNumber(profitData.total_gross_revenue, i18n.language, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      {t('aiInsights.fromConfirmedOrders', 'From confirmed customer orders')}
                    </span>
                  </div>

                  {/* Production Cost */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block">
                      {t('aiInsights.estimatedCost', 'Total Estimated Cost')}
                    </span>
                    <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                      {profitData.total_estimated_cost != null ? `₹${formatNumber(profitData.total_estimated_cost, i18n.language, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : t('aiInsights.unavailable', 'Unavailable')}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      {profitData.total_estimated_cost != null ? t('aiInsights.costFromInput', 'Computed from farmer input') : t('aiInsights.costMissing', 'Cost data missing')}
                    </span>
                  </div>

                  {/* Net Profit */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-xs font-semibold text-forest-700 uppercase tracking-wide block">
                      {t('aiInsights.estimatedProfit', 'Total Estimated Profit')}
                    </span>
                    <span className={`text-2xl font-extrabold mt-1 block ${
                      profitData.total_estimated_profit != null
                        ? profitData.total_estimated_profit >= 0 ? 'text-forest-700' : 'text-red-600'
                        : 'text-slate-400'
                    }`}>
                      {profitData.total_estimated_profit != null ? `₹${formatNumber(profitData.total_estimated_profit, i18n.language, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : t('aiInsights.unavailable', 'Unavailable')}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      {profitData.total_estimated_profit != null ? t('aiInsights.revMinusCost', 'Revenue minus production costs') : t('aiInsights.costRequired', 'Requires verified cost')}
                    </span>
                  </div>

                  {/* Profit Margin % */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-xs font-semibold text-forest-700 uppercase tracking-wide block">
                      {t('aiInsights.overallMargin', 'Overall Margin')}
                    </span>
                    <span className={`text-2xl font-extrabold mt-1 block ${
                      profitData.overall_profit_margin_percent != null ? 'text-forest-700' : 'text-slate-400'
                    }`}>
                      {profitData.overall_profit_margin_percent != null ? `${formatNumber(profitData.overall_profit_margin_percent, i18n.language, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%` : t('aiInsights.unavailable', 'Unavailable')}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      {t('aiInsights.netMargin', 'Net operating margin')}
                    </span>
                  </div>
                </div>
              )}

              {/* Guidance / Transparency Callout */}
              {profitData && (
                <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-xl text-xs text-purple-900 flex items-start gap-2 mb-6">
                  <ShieldCheck className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>{t('aiInsights.dataIntegrityPrinciple', 'Data Integrity Principle:')} </strong>
                    <span>{profitData.guidance}</span>
                  </div>
                </div>
              )}

              {/* Crop Breakdown Table */}
              {profitData && profitData.crop_summaries && profitData.crop_summaries.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-left">
                      <tr>
                        <th className="py-3 px-4">{t('aiInsights.cropNameCol', 'Crop Name')}</th>
                        <th className="py-3 px-4 text-right">{t('aiInsights.soldQtyCol', 'Sold Quantity')}</th>
                        <th className="py-3 px-4 text-right">{t('aiInsights.grossRevCol', 'Gross Revenue')}</th>
                        <th className="py-3 px-4 text-right">{t('aiInsights.costPerKgCol', 'Cost / kg')}</th>
                        <th className="py-3 px-4 text-right">{t('aiInsights.estProfitCol', 'Estimated Profit')}</th>
                        <th className="py-3 px-4 text-right">{t('aiInsights.marginCol', 'Margin (%)')}</th>
                        <th className="py-3 px-4 text-center">{t('aiInsights.statusCol', 'Status')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {profitData.crop_summaries.map((item) => (
                        <tr key={item.crop_id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4 font-semibold text-slate-800">{item.crop_name}</td>
                          <td className="py-3 px-4 text-right font-mono">{formatNumber(item.quantity_sold_kg, i18n.language, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg</td>
                          <td className="py-3 px-4 text-right font-mono font-semibold">₹{formatNumber(item.gross_revenue, i18n.language, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="py-3 px-4 text-right font-mono">
                            {item.cost_per_kg != null ? `₹${formatNumber(item.cost_per_kg, i18n.language, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-forest-700">
                            {item.estimated_profit != null ? `₹${formatNumber(item.estimated_profit, i18n.language, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : t('aiInsights.unavailable', 'Unavailable')}
                          </td>
                          <td className="py-3 px-4 text-right font-mono">
                            {item.profit_margin_percent != null ? `${formatNumber(item.profit_margin_percent, i18n.language, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%` : '—'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              item.status === 'CALCULATED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.status === 'ZERO_SALES'
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {item.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
