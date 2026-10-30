import React, { useState } from 'react';
import { MapPin, Scale, Tag, Calendar, ArrowRight, ShoppingCart, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatNumber, formatDate } from '../utils/formatters';

export default function CropCard({ crop, onSelect }) {
  const { t, i18n } = useTranslation();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  // Format price & quantity with locale awareness while preserving exact numbers
  const formattedPrice = formatNumber(crop.pricePerKg, i18n.language, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const formattedQuantity = formatNumber(crop.availableQuantityKg, i18n.language);

  // Format created date
  const createdDate = crop.createdAt
    ? formatDate(crop.createdAt, i18n.language)
    : t('cropCard.recent', 'Recent');

  // Localized category name
  const localizedCategory = crop.category
    ? t(`categories.${crop.category}`, crop.category)
    : '';

  // Category badge colors
  const getCategoryColor = (cat) => {
    switch (cat?.toLowerCase()) {
      case 'grains':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'vegetables':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'fruits':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'legumes':
      case 'pulses':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'spices':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-forest-100 text-forest-800 border-forest-200';
    }
  };

  const handleQuickAdd = async (e) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'CUSTOMER') {
      alert(t('cropModal.customerOnlyError', { role: user.role, defaultValue: `Shopping cart is reserved for Customer accounts. You are logged in as ${user.role}.` }));
      return;
    }
    setAdding(true);
    try {
      await addToCart(crop.id, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to add item to cart');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-forest-100/80 shadow-sm hover:shadow-md hover:border-forest-200 transition-all duration-200 flex flex-col justify-between overflow-hidden group">
      <div className="p-5">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getCategoryColor(
              crop.category
            )}`}
          >
            <Tag className="w-3 h-3" />
            {localizedCategory}
          </span>
          <span className="text-[11px] text-slate-600 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {createdDate}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-slate-900 group-hover:text-forest-700 transition line-clamp-1">
          {crop.name}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 min-h-[32px]">
          {crop.description || t('cropCard.defaultDescription', 'Direct farm harvest with high standard purity.')}
        </p>

        {/* Location */}
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-600">
          <MapPin className="w-3.5 h-3.5 text-forest-600 shrink-0" />
          <span className="truncate">{crop.location}</span>
        </div>

        {/* Metrics Grid */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 bg-slate-50/70 p-3 rounded-xl">
          <div>
            <span className="text-[11px] font-medium text-slate-600 block">{t('cropCard.unitPrice', 'Unit Price')}</span>
            <div className="text-base font-extrabold text-forest-800">
              ₹{formattedPrice} <span className="text-xs font-normal text-slate-500">{t('cropCard.perKg', '/ kg')}</span>
            </div>
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-600 block flex items-center gap-1">
              <Scale className="w-3 h-3 text-slate-600" />
              {t('cropCard.available', 'Available')}
            </span>
            <div className="text-base font-bold text-slate-800">
              {formattedQuantity} <span className="text-xs font-normal text-slate-500">{t('cropCard.kg', 'kg')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Action */}
      <div className="px-5 py-3 bg-forest-50/50 border-t border-forest-100/60 flex items-center justify-between gap-2">
        <button
          onClick={() => onSelect(crop)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-forest-700 hover:text-forest-900 transition"
        >
          <span>{t('cropCard.viewDetails', 'View Details')}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleQuickAdd}
          disabled={adding || Number(crop.availableQuantityKg) <= 0}
          className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-sm ${
            added
              ? 'bg-emerald-600 text-white'
              : 'bg-forest-700 hover:bg-forest-800 text-white disabled:bg-slate-300 disabled:cursor-not-allowed'
          }`}
          title={Number(crop.availableQuantityKg) <= 0 ? t('cropCard.outOfStock', 'Out of stock') : t('cropCard.addKgTitle', 'Add 1 kg to cart')}
        >
          {added ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>{t('cropCard.added', 'Added!')}</span>
            </>
          ) : adding ? (
            <>
              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{t('cropCard.adding', 'Adding...')}</span>
            </>
          ) : (
            <>
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>{t('cropCard.addToCart', 'Add to Cart')}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
