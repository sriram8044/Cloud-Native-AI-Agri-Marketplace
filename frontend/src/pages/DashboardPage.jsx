import React, { useState, useEffect } from 'react';
import { Activity, Database, Server, Sprout, Scale, IndianRupee, Layers, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cropService } from '../api/cropService';
import { formatNumber, formatDateTime } from '../utils/formatters';

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const [crops, setCrops] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cropsData, healthData] = await Promise.all([
        cropService.getAllCrops().catch(() => []),
        cropService.getHealth().catch(() => null),
      ]);
      setCrops(cropsData);
      setHealth(healthData);
    } catch {
      setError('Unable to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  // Metrics calculations
  const totalListings = crops.length;
  const totalVolumeKg = crops.reduce((acc, c) => acc + Number(c.availableQuantityKg || 0), 0);
  const totalValuation = crops.reduce(
    (acc, c) => acc + Number(c.pricePerKg || 0) * Number(c.availableQuantityKg || 0),
    0
  );

  // Category counts
  const categoryCounts = crops.reduce((acc, c) => {
    const cat = c.category || 'Other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-forest-100 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('dashboard.title', 'Marketplace Overview & Health')}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {t('dashboard.subtitle', 'Real-time telemetry and inventory statistics aggregated across Spring Boot & MySQL.')}
          </p>
        </div>
        <Link
          to="/sell"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-semibold shadow-sm transition self-start sm:self-auto"
        >
          <Sprout className="w-4 h-4" />
          <span>{t('dashboard.newCropListing', 'New Crop Listing')}</span>
        </Link>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-forest-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-forest-100 text-forest-700 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">
              {t('dashboard.totalActiveCrops', 'Total Active Crops')}
            </span>
            <div className="text-2xl font-black text-slate-900">
              {formatNumber(totalListings, i18n.language)}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-forest-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">
              {t('dashboard.totalHarvestVolume', 'Total Harvest Volume')}
            </span>
            <div className="text-2xl font-black text-slate-900">
              {formatNumber(totalVolumeKg, i18n.language)}{' '}
              <span className="text-xs font-normal text-slate-500">{t('cropCard.kg', 'kg')}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-forest-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">
              {t('dashboard.totalCatalogValue', 'Total Catalog Value')}
            </span>
            <div className="text-2xl font-black text-slate-900">
              ₹{formatNumber(totalValuation, i18n.language, { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-forest-100 shadow-sm flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              health?.status === 'UP' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}
          >
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">
              {t('dashboard.backendStatus', 'Backend Status')}
            </span>
            <div className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
              <span>{health?.status === 'UP' ? t('dashboard.healthy', 'HEALTHY (UP)') : t('dashboard.disconnected', 'DISCONNECTED')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Telemetry & Categories Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Backend & Cloud Architecture Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-forest-100 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-forest-700" />
              <h3 className="font-bold text-slate-900 text-base">
                {t('dashboard.telemetryTitle', 'Backend Microservice Telemetry')}
              </h3>
            </div>
            <span className="text-xs bg-forest-50 text-forest-800 font-mono font-medium px-2.5 py-1 rounded-full border border-forest-100">
              Port: 8080
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">{t('dashboard.serviceIdentifier', 'Service Identifier:')}</span>
                <span className="font-bold text-slate-800">{health?.service || 'agri-marketplace-backend'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">{t('dashboard.serviceStatus', 'Service Status:')}</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {health?.status || t('dashboard.active', 'Active')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">{t('dashboard.framework', 'Framework:')}</span>
                <span className="font-mono text-slate-700">Spring Boot 3.5.9 / Java 21</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">{t('dashboard.healthEndpoint', 'Health Endpoint:')}</span>
                <span className="font-mono text-slate-700">/api/health</span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">{t('dashboard.databaseEngine', 'Database Engine:')}</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 text-forest-600" />
                  MySQL 8.0.44
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">{t('dashboard.targetSchema', 'Target Schema:')}</span>
                <span className="font-mono text-slate-700">agri_marketplace</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">{t('dashboard.ormEntity', 'ORM / Entity:')}</span>
                <span className="text-slate-700 font-medium">Hibernate 6.6 / Spring Data JPA</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">{t('dashboard.viteProxy', 'Vite Reverse Proxy:')}</span>
                <span className="text-emerald-700 font-semibold">{t('dashboard.enabled', 'Enabled (/api → :8080)')}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              {t('dashboard.lastVerified', 'Last Verified Timestamp:')}{' '}
              {health?.timestamp ? formatDateTime(health.timestamp, i18n.language) : formatDateTime(new Date().toISOString(), i18n.language)}
            </span>
            <button
              onClick={loadDashboardData}
              className="text-forest-700 hover:text-forest-900 font-semibold"
            >
              {t('dashboard.recheckTelemetry', 'Recheck Telemetry')}
            </button>
          </div>
        </div>

        {/* Category Breakdown Card */}
        <div className="bg-white rounded-2xl border border-forest-100 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
            {t('dashboard.categoryBreakdown', 'Category Breakdown')}
          </h3>

          {Object.keys(categoryCounts).length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              {t('dashboard.noCategories', 'No categories recorded yet.')}
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(categoryCounts).map(([cat, count]) => {
                const percentage = Math.round((count / (totalListings || 1)) * 100);
                const localizedCat = t(`categories.${cat}`, cat);
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700">{localizedCat}</span>
                      <span className="text-slate-500">
                        {formatNumber(count, i18n.language)} {t('nav.items', 'items')} ({formatNumber(percentage, i18n.language)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-forest-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-4 border-t border-slate-100">
            <Link
              to="/marketplace"
              className="text-xs font-semibold text-forest-700 hover:text-forest-900 flex items-center justify-between"
            >
              <span>{t('dashboard.exploreCatalog', 'Explore Marketplace Catalog')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
