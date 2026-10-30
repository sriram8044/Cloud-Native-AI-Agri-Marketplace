import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Sprout, ArrowRight, ShieldCheck, TrendingUp, Sparkles, CheckCircle2 } from 'lucide-react';
import { cropService } from '../api/cropService';
import CropCard from '../components/CropCard';
import CropDetailModal from '../components/CropDetailModal';
import LoadingSkeleton from '../components/LoadingSkeleton';

export default function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCrop, setSelectedCrop] = useState(null);

  useEffect(() => {
    fetchFeaturedCrops();
  }, []);

  const fetchFeaturedCrops = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await cropService.getAllCrops();
      setCrops(data.slice(0, 3)); // show first 3 as featured
    } catch {
      setError(t('home.backendError', 'Unable to load featured crops from backend. Ensure Spring Boot is running on port 8080.'));
    } finally {
      setLoading(false);
    }
  };

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/marketplace');
    }
  };

  const popularSearches = [
    { key: 'Rice', categoryKey: 'Grains' },
    { key: 'Wheat', categoryKey: 'Grains' },
    { key: 'Corn', categoryKey: 'Grains' },
    { key: 'Soybean', categoryKey: 'Oilseeds' },
    { key: 'Cotton', categoryKey: 'Commercial Crops' },
    { key: 'Pulses', categoryKey: 'Pulses' },
  ];

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-forest-100/70 via-forest-50/50 to-transparent pt-12 pb-16 px-4 sm:px-6 lg:px-8 rounded-3xl border border-forest-100/60 max-w-7xl mx-auto mt-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-forest-200/80 text-forest-900 text-xs font-semibold tracking-wide">
            <Sprout className="w-4 h-4 text-forest-700" />
            <span>{t('home.badge', 'Direct Farm-to-Buyer Marketplace')}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-forest-950 tracking-tight leading-[1.15]">
            {t('home.heroTitle1', 'Fresh Harvest Directly from')}{' '}
            <span className="text-forest-700">{t('home.heroTitle2', 'Indian Farmers')}</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {t('home.heroDesc', 'Eliminate traditional middlemen markups. Browse verified listings of grains, vegetables, and pulses with transparent lot pricing and direct origin transparency.')}
          </p>

          {/* Search Bar Form */}
          <form
            onSubmit={handleHeroSearch}
            className="flex flex-col sm:flex-row gap-2 max-w-xl mx-auto bg-white p-2 rounded-2xl shadow-lg shadow-forest-900/5 border border-forest-100"
          >
            <div className="relative flex-1 flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('home.searchPlaceholder', 'Search crops (e.g., Basmati Rice, Wheat, Corn)...')}
                className="w-full pl-11 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 text-slate-800 placeholder-slate-400"
              />
            </div>
            <button
              type="submit"
              className="bg-forest-700 hover:bg-forest-800 text-white px-6 py-3 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 shadow-sm"
            >
              <span>{t('home.searchBtn', 'Search Catalog')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Category Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-slate-500">
            <span className="font-medium text-slate-700">{t('home.popular', 'Popular:')}</span>
            {popularSearches.map((item) => (
              <button
                key={item.key}
                onClick={() => navigate(`/marketplace?search=${item.key}`)}
                className="bg-white/80 hover:bg-forest-100 text-slate-700 hover:text-forest-900 px-2.5 py-1 rounded-lg border border-forest-100 transition"
              >
                {t(`categories.${item.key}`, item.key)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Crops Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-forest-700 uppercase tracking-wider mb-1">
              <CheckCircle2 className="w-4 h-4" />
              {t('home.liveDataBadge', 'Live Marketplace Data')}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {t('home.featuredTitle', 'Featured Crop Listings')}
            </h2>
          </div>
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 hover:text-forest-900"
          >
            <span>{t('home.viewAll', 'View All Listings')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <LoadingSkeleton count={3} />
        ) : error ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-6 rounded-2xl text-center">
            <p className="font-semibold">{error}</p>
            <p className="text-xs text-amber-700 mt-2">
              Tip: Start the backend via <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">mvn spring-boot:run</code> on port 8080.
            </p>
          </div>
        ) : crops.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-dashed border-forest-200">
            <div className="w-12 h-12 bg-forest-100 text-forest-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <Sprout className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">{t('home.noCropsTitle', 'No Crops Listed Yet')}</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-5">
              {t('home.noCropsDesc', 'Be the first producer to publish agricultural inventory to the marketplace!')}
            </p>
            <Link
              to="/sell"
              className="inline-flex items-center gap-2 bg-forest-700 hover:bg-forest-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition"
            >
              <span>{t('home.listFirstCrop', 'List Your First Crop')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {crops.map((crop) => (
              <CropCard key={crop.id} crop={crop} onSelect={setSelectedCrop} />
            ))}
          </div>
        )}
      </section>

      {/* Value Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-forest-100 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-700 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">{t('home.pillar1Title', 'Direct Farmer Sales')}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t('home.pillar1Desc', 'Farmers post real-time batch weights and set authentic baseline prices, receiving payments directly without aggregator commission loss.')}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-forest-100 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">{t('home.pillar2Title', 'Transparent Quality & Origin')}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t('home.pillar2Desc', 'Every listing includes explicit provenance location, category grading, and available volume down to exact kilogram precision.')}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-forest-100 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">{t('home.pillar3Title', 'AI-Powered Insights')}</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest-100 text-forest-800">
                {t('home.pillar3Upcoming', 'Upcoming')}
              </span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t('home.pillar3Desc', 'Phase 4 AI service integration will deliver predictive crop yield pricing, automated demand forecasting, and smart buyer matching.')}
            </p>
          </div>
        </div>
      </section>

      {/* Farmer Call-To-Action Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-forest-900 to-forest-800 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-xl">
          <div className="max-w-2xl space-y-4">
            <span className="text-xs uppercase tracking-wider font-bold text-forest-300">
              {t('home.ctaBadge', 'Producer Onboarding')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {t('home.ctaTitle', 'Ready to sell your seasonal harvest at fair market rates?')}
            </h2>
            <p className="text-forest-100 text-sm sm:text-base leading-relaxed">
              {t('home.ctaDesc', 'List your grains, legumes, fruits, or vegetables in seconds. Connect with verified regional buyers looking for bulk or retail farm deliveries.')}
            </p>
            <div className="pt-2 flex flex-wrap gap-4">
              <Link
                to="/sell"
                className="bg-white text-forest-900 hover:bg-forest-50 px-6 py-3 rounded-xl text-sm font-bold shadow-md transition"
              >
                {t('home.ctaBtn', 'List Your Harvest Now')}
              </Link>
              <Link
                to="/marketplace"
                className="bg-forest-800 hover:bg-forest-700 border border-forest-600 text-white px-6 py-3 rounded-xl text-sm font-semibold transition"
              >
                {t('home.ctaExplore', 'Explore Current Listings')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Detail Modal */}
      {selectedCrop && (
        <CropDetailModal crop={selectedCrop} onClose={() => setSelectedCrop(null)} />
      )}
    </div>
  );
}
