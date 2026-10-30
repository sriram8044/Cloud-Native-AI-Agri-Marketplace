import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ShoppingCart, Trash2, Plus, Minus, ArrowRight, ShieldCheck, 
  MapPin, AlertCircle, PackageCheck, Store
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../api/orderService';
import { formatNumber } from '../utils/formatters';

export default function CartPage() {
  const { t, i18n } = useTranslation();
  const { cart, loading, error, updateQuantity, removeItem, clearCart, refreshCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [addressError, setAddressError] = useState('');
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(null);

  // If not logged in
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-forest-100 text-forest-700 flex items-center justify-center mx-auto mb-4">
          <ShoppingCart className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {t('cart.signInToView', 'Sign In to View Your Cart')}
        </h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
          {t('cart.signInToViewDesc', 'Please log in with your customer account to manage your shopping cart and place farm-direct crop orders.')}
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 bg-forest-700 hover:bg-forest-800 text-white px-6 py-2.5 rounded-xl font-semibold shadow-sm transition"
        >
          <span>{t('cart.signInBtn', 'Sign In to Account')}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  // If logged in as FARMER or non-CUSTOMER
  if (user.role !== 'CUSTOMER') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {t('cart.customerAccountRequired', 'Customer Account Required')}
        </h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
          {t('cart.customerAccountDesc', { role: user.role, defaultValue: `You are currently logged in as a ${user.role}. Shopping carts and customer checkout are only available for customer accounts.` })}
        </p>
        <div className="flex justify-center gap-3">
          <Link
            to="/farmer/orders"
            className="inline-flex items-center gap-2 bg-forest-700 hover:bg-forest-800 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition"
          >
            {t('cart.manageProduceOrders', 'Manage Your Produce Orders')}
          </Link>
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-semibold text-sm transition"
          >
            {t('cart.browseMarketplace', 'Browse Marketplace')}
          </Link>
        </div>
      </div>
    );
  }

  // Order placed successfully view
  if (orderSuccess) {
    const formattedSuccessTotal = formatNumber(orderSuccess.totalAmount, i18n.language, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-5 shadow-inner">
          <PackageCheck className="w-10 h-10" />
        </div>
        <span className="text-xs font-bold tracking-wider uppercase text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          {t('cart.orderConfirmed', 'Order Confirmed')}
        </span>
        <h2 className="text-3xl font-extrabold text-slate-900 mt-3 mb-2">
          {t('cart.thankYou', 'Thank you for your order!')}
        </h2>
        <p className="text-slate-600 max-w-lg mx-auto text-sm mb-6">
          {t('cart.orderPlacedSuccess', {
            id: orderSuccess.id,
            total: `₹${formattedSuccessTotal}`,
            defaultValue: `Your order #${orderSuccess.id} for ₹${formattedSuccessTotal} has been placed successfully and the farmer has been notified to pack your harvest.`,
          })}
        </p>

        <div className="bg-white rounded-2xl border border-forest-100 p-6 max-w-lg mx-auto text-left mb-8 shadow-sm">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            {t('cart.orderDetails', 'Order Details')}
          </h4>
          <div className="text-sm space-y-2 text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">{t('cart.orderId', 'Order ID:')}</span>
              <span className="font-mono font-bold">#{orderSuccess.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t('cart.status', 'Status:')}</span>
              <span className="font-semibold text-emerald-700">
                {t(`status.${orderSuccess.status}`, orderSuccess.status)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t('cart.deliveryAddress', 'Delivery Address:')}</span>
              <span className="font-medium text-right max-w-[240px] truncate">{orderSuccess.deliveryAddress}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-100 font-bold text-slate-900">
              <span>{t('cart.totalAmount', 'Total Amount:')}</span>
              <span className="text-forest-700">₹{formattedSuccessTotal}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 bg-forest-700 hover:bg-forest-800 text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow transition"
          >
            <span>{t('cart.viewAllOrders', 'View All Orders')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-semibold text-sm transition"
          >
            <span>{t('cart.continueShopping', 'Continue Shopping')}</span>
          </Link>
        </div>
      </div>
    );
  }

  // Handle Checkout submission
  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!deliveryAddress.trim()) {
      setAddressError(t('cart.addressError', 'Please enter a valid delivery address'));
      return;
    }
    setAddressError('');
    setCheckoutError('');
    setCheckoutSubmitting(true);

    try {
      const createdOrder = await orderService.placeOrder(deliveryAddress.trim());
      setOrderSuccess(createdOrder);
      await refreshCart();
    } catch (err) {
      setCheckoutError(err?.response?.data?.message || 'Failed to place order. Please check stock and try again.');
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  const handleQuantityChange = async (item, delta) => {
    const newQty = Number(item.quantityKg) + delta;
    if (newQty <= 0) {
      await removeItem(item.id);
    } else if (newQty > Number(item.availableStockKg)) {
      alert(`Cannot exceed available stock of ${item.availableStockKg} kg for ${item.cropName}`);
    } else {
      await updateQuantity(item.id, newQty);
    }
  };

  // Empty cart view
  if (!loading && (!cart.items || cart.items.length === 0)) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-forest-50 text-forest-600 flex items-center justify-center mx-auto mb-4 border border-forest-100">
          <ShoppingCart className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {t('cart.emptyTitle', 'Your Shopping Cart is Empty')}
        </h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
          {t('cart.emptyDesc', 'Explore fresh produce listings directly from certified local farmers and add items to your cart.')}
        </p>
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-2 bg-forest-700 hover:bg-forest-800 text-white px-6 py-3 rounded-xl font-semibold text-sm shadow transition"
        >
          <Store className="w-4 h-4" />
          <span>{t('cart.exploreMarketplace', 'Explore Marketplace')}</span>
        </Link>
      </div>
    );
  }

  const formattedSubtotal = formatNumber(cart.subtotal, i18n.language, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-forest-100">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('cart.title', 'Shopping Cart')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {t('cart.subtitle', 'Review your harvest selections directly sourced from local farmers.')}
          </p>
        </div>
        <button
          onClick={clearCart}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{t('cart.clearCart', 'Clear Cart')}</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {checkoutError && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{checkoutError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          {cart.items.map((item) => {
            const formattedItemPrice = formatNumber(item.pricePerKg, i18n.language, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
            const formattedItemTotal = formatNumber(item.lineTotal, i18n.language, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
            const formattedItemStock = formatNumber(item.availableStockKg, i18n.language);

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-forest-100 p-5 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-forest-50 text-forest-700 border border-forest-200">
                      {t(`categories.${item.category}`, item.category)}
                    </span>
                    <span className="text-xs text-slate-400">
                      {t('cart.crop', 'Crop')} #{item.cropId}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{item.cropName}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span>{t('cart.farmerLabel', 'Farmer:')} <strong className="text-slate-700">{item.farmerName}</strong></span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-forest-600" />
                      {item.location}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-2">
                    {t('cart.priceLabel', 'Price:')} <strong className="text-forest-700">₹{formattedItemPrice}</strong> {t('cropCard.perKg', '/ kg')}
                    <span className="ml-2 text-slate-400">
                      ({t('cart.maxStock', 'Max in stock:')} {formattedItemStock} {t('cropCard.kg', 'kg')})
                    </span>
                  </div>
                </div>

                {/* Quantity controls & Line total */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
                      <button
                        onClick={() => handleQuantityChange(item, -1)}
                        className="p-1.5 hover:bg-slate-200 text-slate-600 transition"
                        title="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 py-1 text-xs font-bold text-slate-800 min-w-[40px] text-center">
                        {item.quantityKg} {t('cropCard.kg', 'kg')}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item, 1)}
                        className="p-1.5 hover:bg-slate-200 text-slate-600 transition"
                        title="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                      {t('cart.subtotal', 'Subtotal')}
                    </span>
                    <span className="text-lg font-extrabold text-forest-800">
                      ₹{formattedItemTotal}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary & Checkout Card */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-3xl border border-forest-100 p-6 shadow-sm sticky top-24">
            <h2 className="text-lg font-bold text-slate-900 pb-4 border-b border-slate-100">
              {t('cart.orderSummary', 'Order Summary')}
            </h2>

            <div className="py-4 space-y-2.5 text-sm text-slate-600 border-b border-slate-100">
              <div className="flex justify-between">
                <span>{t('cart.uniqueCropItems', 'Unique Crop Items:')}</span>
                <span className="font-semibold text-slate-800">{formatNumber(cart.totalItems, i18n.language)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('cart.totalQuantity', 'Total Quantity:')}</span>
                <span className="font-semibold text-slate-800">{formatNumber(cart.totalQuantityKg, i18n.language)} {t('cropCard.kg', 'kg')}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('cart.delivery', 'Delivery:')}</span>
                <span className="font-semibold text-emerald-600">{t('cart.directDispatch', 'Direct Farm Dispatch')}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-100 text-base font-extrabold text-slate-900">
                <span>{t('cart.totalAmount', 'Total Amount:')}</span>
                <span className="text-xl text-forest-700">₹{formattedSubtotal}</span>
              </div>
            </div>

            {/* Delivery address form */}
            <form onSubmit={handleCheckout} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t('cart.deliveryAddress', 'Delivery Address')} <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows="3"
                  value={deliveryAddress}
                  onChange={(e) => {
                    setDeliveryAddress(e.target.value);
                    if (addressError) setAddressError('');
                  }}
                  placeholder={t('cart.addressPlaceholder', 'Enter complete delivery street address, city, pincode, state...')}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-800 focus:outline-none focus:ring-2 transition resize-none ${
                    addressError
                      ? 'border-rose-300 focus:ring-rose-200'
                      : 'border-slate-200 focus:ring-forest-200 focus:border-forest-500'
                  }`}
                />
                {addressError && (
                  <p className="text-xs text-rose-600 mt-1">{addressError}</p>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{t('cart.stockLockingNotice', 'Pessimistic stock locking & atomic transaction checkout')}</span>
              </div>

              <button
                type="submit"
                disabled={checkoutSubmitting || cart.items.length === 0}
                className="w-full py-3.5 px-4 rounded-xl bg-forest-700 hover:bg-forest-800 disabled:bg-slate-300 text-white font-bold text-sm shadow hover:shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {checkoutSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{t('cart.processingOrder', 'Processing Order...')}</span>
                  </>
                ) : (
                  <>
                    <span>
                      {t('cart.placeOrder', {
                        amount: `₹${formattedSubtotal}`,
                        defaultValue: `Place Order (₹${cart.subtotal})`,
                      })}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
