import React, { useState } from 'react';
import { 
  X, MapPin, Tag, Calendar, Scale, IndianRupee, ShieldCheck, 
  ShoppingCart, Plus, Minus, Check, ArrowRight 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatNumber, formatDateTime } from '../utils/formatters';

export default function CropDetailModal({ crop, onClose }) {
  const { t, i18n } = useTranslation();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [quantityKg, setQuantityKg] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState('');

  if (!crop) return null;

  const priceNum = Number(crop.pricePerKg);
  const stockNum = Number(crop.availableQuantityKg);
  const formattedPrice = formatNumber(priceNum, i18n.language, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const formattedStock = formatNumber(stockNum, i18n.language);

  const calculatedTotal = formatNumber(priceNum * (Number(quantityKg) || 0), i18n.language, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });

  const createdDate = crop.createdAt
    ? formatDateTime(crop.createdAt, i18n.language)
    : t('cropCard.recent', 'Recently listed');

  const localizedCategory = crop.category
    ? t(`categories.${crop.category}`, crop.category)
    : '';

  const handleQuantityChange = (val) => {
    setError('');
    const num = Number(val);
    if (isNaN(num)) return;
    if (num < 1) {
      setQuantityKg(1);
    } else if (num > stockNum) {
      setQuantityKg(stockNum);
      setError(t('cropModal.maxStockError', { stock: stockNum, defaultValue: `Maximum available stock is ${stockNum} kg.` }));
    } else {
      setQuantityKg(num);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'CUSTOMER') {
      setError(t('cropModal.customerOnlyError', { role: user.role, defaultValue: `Purchasing is only permitted for Customer accounts. You are currently logged in as a ${user.role}.` }));
      return;
    }
    if (quantityKg <= 0 || quantityKg > stockNum) {
      setError(t('cropModal.validQtyError', { stock: stockNum, defaultValue: `Please specify a valid quantity up to ${stockNum} kg.` }));
      return;
    }

    setAdding(true);
    setError('');
    try {
      await addToCart(crop.id, quantityKg);
      setAdded(true);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to add item to cart');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-forest-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-forest-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            aria-label={t('common.close', 'Close modal')}
          >
            <X className="w-5 h-5" />
          </button>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-forest-800 text-forest-200 text-xs font-semibold mb-2">
            <Tag className="w-3 h-3" />
            {localizedCategory}
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{crop.name}</h2>
          <div className="flex items-center gap-2 text-forest-200 text-xs mt-1.5">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span>{crop.location}</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-4 bg-forest-50/60 p-4 rounded-2xl border border-forest-100/60">
            <div>
              <span className="text-xs text-slate-500 font-medium block">{t('cropCard.unitPrice', 'Unit Price')}</span>
              <div className="text-xl font-extrabold text-forest-800 flex items-center">
                <span>₹{formattedPrice}</span>
                <span className="text-xs font-normal text-slate-500 ml-1">{t('cropCard.perKg', '/ kg')}</span>
              </div>
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">{t('cropCard.available', 'Available Stock')}</span>
              <div className="text-xl font-bold text-slate-800 flex items-center">
                <span>{formattedStock}</span>
                <span className="text-xs font-normal text-slate-500 ml-1">{t('cropCard.kg', 'kg')}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
              {t('cropModal.qualityDescription', 'Crop Quality & Description')}
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100">
              {crop.description || t('cropModal.defaultDesc', 'Verified pure harvest directly sourced from registered agricultural producers.')}
            </p>
          </div>

          {/* Purchase Quantity Selector & Calculation */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t('cropModal.selectQuantity', 'Select Quantity (kg)')}
              </label>
              <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm">
                <button
                  onClick={() => handleQuantityChange(quantityKg - 1)}
                  disabled={quantityKg <= 1}
                  className="p-1.5 hover:bg-slate-100 text-slate-600 transition disabled:opacity-40"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="1"
                  max={stockNum}
                  value={quantityKg}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  className="w-16 text-center text-sm font-bold text-slate-900 py-1 focus:outline-none"
                />
                <button
                  onClick={() => handleQuantityChange(quantityKg + 1)}
                  disabled={quantityKg >= stockNum}
                  className="p-1.5 hover:bg-slate-100 text-slate-600 transition disabled:opacity-40"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
              <span className="text-slate-600 font-medium">{t('cropModal.estimatedAmount', 'Estimated Purchase Amount:')}</span>
              <span className="text-base font-extrabold text-forest-800">₹{calculatedTotal}</span>
            </div>
          </div>

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200 font-medium">
              {error}
            </p>
          )}

          {/* Provenance & Metadata */}
          <div className="text-xs text-slate-500 space-y-1.5 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                {t('cropModal.batchId', 'Batch Listing ID:')}
              </span>
              <span className="font-mono font-medium text-slate-700">#{crop.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                {t('cropModal.listedDate', 'Listed Date:')}
              </span>
              <span className="font-medium text-slate-700">{createdDate}</span>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex gap-3">
            <button
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              {t('cropModal.close', 'Close')}
            </button>

            {added ? (
              <button
                onClick={() => {
                  onClose();
                  navigate('/cart');
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm transition flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>{t('cropModal.viewCart', 'Added to Cart — View Cart')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={adding || stockNum <= 0}
                className="flex-1 py-2.5 px-4 rounded-xl bg-forest-700 hover:bg-forest-800 disabled:bg-slate-300 text-white text-sm font-bold shadow-sm transition flex items-center justify-center gap-2"
              >
                {adding ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{t('cropModal.addingToCart', 'Adding to Cart...')}</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    <span>{t('cropModal.addKgToCart', { qty: quantityKg, defaultValue: `Add ${quantityKg} kg to Cart` })}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
