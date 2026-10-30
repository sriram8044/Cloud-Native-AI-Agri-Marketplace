import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Filter, RefreshCw, PlusCircle, Sprout, AlertCircle } from 'lucide-react';
import { cropService } from '../api/cropService';
import CropCard from '../components/CropCard';
import CropDetailModal from '../components/CropDetailModal';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { formatNumber } from '../utils/formatters';

export default function MarketplacePage() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'All';

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState('newest'); // newest, priceAsc, priceDesc, quantityDesc

  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCrop, setSelectedCrop] = useState(null);

  const categories = ['All', 'Grains', 'Vegetables', 'Fruits', 'Pulses', 'Spices'];

  useEffect(() => {
    fetchCrops(initialSearch);
  }, [initialSearch]);

  const fetchCrops = async (query = '') => {
    setLoading(true);
    setError(null);
    try {
      const data = await cropService.getAllCrops(query);
      setCrops(data);
    } catch {
      setError(
        'Failed to connect to crop service. Please verify that the Spring Boot backend is running on port 8080.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setSearchParams({ search: searchTerm.trim() });
    } else {
      setSearchParams({});
    }
  };

  const handleResetSearch = () => {
    setSearchTerm('');
    setActiveCategory('All');
    setSearchParams({});
    fetchCrops('');
  };

  // Filter crops locally by category and sort
  const filteredCrops = crops
    .filter((crop) => {
      if (activeCategory === 'All') return true;
      return crop.category?.toLowerCase() === activeCategory.toLowerCase();
    })
    .sort((a, b) => {
      if (sortBy === 'priceAsc') return Number(a.pricePerKg) - Number(b.pricePerKg);
      if (sortBy === 'priceDesc') return Number(b.pricePerKg) - Number(a.pricePerKg);
      if (sortBy === 'quantityDesc') return Number(b.availableQuantityKg) - Number(a.availableQuantityKg);
      // default: newest first (by id descending)
      return b.id - a.id;
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-forest-100 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('marketplace.title', 'Agricultural Marketplace')}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {t('marketplace.subtitle', 'Browse verified crop inventory supplied directly by regional agrarian producers.')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchCrops(searchTerm)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 transition"
            title={t('marketplace.refresh', 'Refresh listings')}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('marketplace.refresh', 'Refresh')}</span>
          </button>
          <Link
            to="/sell"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-semibold shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('marketplace.listCrop', 'List Crop')}</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-5 rounded-2xl border border-forest-100/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          {/* Search form */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('marketplace.searchPlaceholder', 'Search by crop name (e.g., Rice, Wheat)...')}
              className="w-full pl-10 pr-20 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-transparent"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-forest-700 text-white rounded-lg text-xs font-semibold hover:bg-forest-800 transition"
            >
              {t('marketplace.searchBtn', 'Search')}
            </button>
          </form>

          {/* Sort selector */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
              {t('marketplace.sortBy', 'Sort by:')}
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-forest-600"
            >
              <option value="newest">{t('marketplace.newest', 'Newest First')}</option>
              <option value="priceAsc">{t('marketplace.priceAsc', 'Price: Low to High')}</option>
              <option value="priceDesc">{t('marketplace.priceDesc', 'Price: High to Low')}</option>
              <option value="quantityDesc">{t('marketplace.quantityDesc', 'Quantity: High to Low')}</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 text-xs">
          <span className="text-slate-400 flex items-center gap-1 font-medium pr-1">
            <Filter className="w-3.5 h-3.5" />
            {t('marketplace.category', 'Category:')}
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-medium transition whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-forest-800 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-forest-50 hover:text-forest-800'
              }`}
            >
              {t(`categories.${cat}`, cat)}
            </button>
          ))}
          {(searchTerm || activeCategory !== 'All') && (
            <button
              onClick={handleResetSearch}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold underline ml-auto whitespace-nowrap pl-2"
            >
              {t('marketplace.resetFilters', 'Reset Filters')}
            </button>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          {t('marketplace.showing', 'Showing')}{' '}
          <strong className="text-slate-800">{formatNumber(filteredCrops.length, i18n.language)}</strong>{' '}
          {t('marketplace.listings', 'listings')}
          {initialSearch && (
            <span>
              {' '}{t('marketplace.matching', 'matching')} "<strong className="text-forest-800">{initialSearch}</strong>"
            </span>
          )}
          {activeCategory !== 'All' && (
            <span>
              {' '}{t('marketplace.inCategory', 'in category')} <strong className="text-forest-800">{t(`categories.${activeCategory}`, activeCategory)}</strong>
            </span>
          )}
        </span>
      </div>

      {/* Content Area */}
      {loading ? (
        <LoadingSkeleton count={6} />
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 p-8 rounded-3xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <h3 className="font-bold text-lg">{t('marketplace.backendErrorTitle', 'Backend Communication Error')}</h3>
          <p className="text-xs text-rose-700 max-w-md mx-auto">{error}</p>
          <button
            onClick={() => fetchCrops(searchTerm)}
            className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition"
          >
            {t('marketplace.retryConnection', 'Retry Connection')}
          </button>
        </div>
      ) : filteredCrops.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-forest-200 space-y-4">
          <div className="w-14 h-14 bg-forest-50 text-forest-700 rounded-full flex items-center justify-center mx-auto">
            <Sprout className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">{t('marketplace.noProduceTitle', 'No Matching Produce Found')}</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              {crops.length === 0
                ? t('marketplace.noProduceDescEmpty', 'The database currently contains no crop listings. Be the first to publish farm produce!')
                : t('marketplace.noProduceDescFilter', 'Try adjusting your search keywords or switching category filters.')}
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            {crops.length > 0 && (
              <button
                onClick={handleResetSearch}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                {t('marketplace.clearFilters', 'Clear Filters')}
              </button>
            )}
            <Link
              to="/sell"
              className="px-4 py-2 rounded-xl bg-forest-700 text-white text-xs font-semibold hover:bg-forest-800 transition"
            >
              {t('marketplace.listNewCrop', 'List a New Crop')}
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCrops.map((crop) => (
            <CropCard key={crop.id} crop={crop} onSelect={setSelectedCrop} />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedCrop && (
        <CropDetailModal crop={selectedCrop} onClose={() => setSelectedCrop(null)} />
      )}
    </div>
  );
}
