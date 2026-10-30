import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Package, Calendar, MapPin, AlertCircle, CheckCircle, 
  Clock, Truck, CheckCheck, XCircle, ArrowRight, User 
} from 'lucide-react';
import { orderService } from '../api/orderService';
import { useAuth } from '../context/AuthContext';
import { formatNumber, formatDateTime } from '../utils/formatters';

export default function FarmerOrdersPage() {
  const { t, i18n } = useTranslation();
  const { user, isFarmer } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (user && isFarmer()) {
      fetchFarmerOrders();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchFarmerOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await orderService.getFarmerOrders();
      setItems(data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load farmer fulfillment orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    setSuccessMessage('');
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      setSuccessMessage(`Order #${orderId} successfully transitioned to ${newStatus}.`);
      await fetchFarmerOrders();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const label = t(`status.${status}`, status);
    switch (status) {
      case 'PLACED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3.5 h-3.5" />
            {label}
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            <CheckCircle className="w-3.5 h-3.5" />
            {label}
          </span>
        );
      case 'PACKED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <Package className="w-3.5 h-3.5" />
            {label}
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            <Truck className="w-3.5 h-3.5" />
            {label}
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCheck className="w-3.5 h-3.5" />
            {label}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            {label}
          </span>
        );
      default:
        return (
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
            {label}
          </span>
        );
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-forest-100 text-forest-700 flex items-center justify-center mx-auto mb-4">
          <Package className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {t('farmerOrders.signInRequired', 'Farmer Sign In Required')}
        </h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
          {t('farmerOrders.signInDesc', 'Please log in with your registered producer / farmer account to manage incoming crop orders.')}
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 bg-forest-700 hover:bg-forest-800 text-white px-6 py-2.5 rounded-xl font-semibold shadow-sm transition"
        >
          <span>{t('farmerOrders.signInBtn', 'Sign In as Farmer')}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  if (!isFarmer()) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {t('farmerOrders.portalAccessOnly', 'Farmer Portal Access Only')}
        </h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
          {t('farmerOrders.portalAccessDesc', 'You are currently logged in as a CUSTOMER. Only registered farmers and administrators can view producer fulfillment requests.')}
        </p>
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 bg-forest-700 hover:bg-forest-800 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition"
        >
          <span>{t('farmerOrders.viewCustomerOrders', 'View Your Customer Orders')}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 pb-4 border-b border-forest-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('farmerOrders.title', 'Farmer Fulfillment Management')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {t('farmerOrders.subtitle', 'Fulfill and track orders for your listed crop harvest batches.')}
          </p>
        </div>
        <div className="text-xs bg-forest-50 border border-forest-200 text-forest-800 px-3 py-1.5 rounded-xl font-medium">
          {t('farmerOrders.loggedInAs', 'Logged in as')} <strong>{user.name}</strong> ({user.role})
        </div>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16">
          <div className="w-10 h-10 border-4 border-forest-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-500">{t('farmerOrders.loadingItems', 'Loading your fulfillment items...')}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-forest-100 p-8 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-forest-50 text-forest-600 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">{t('farmerOrders.noOrdersTitle', 'No Customer Orders Yet')}</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
            {t('farmerOrders.noOrdersDesc', 'When customers purchase your listed produce, their fulfillment requests will appear here for packing and dispatch.')}
          </p>
          <Link
            to="/sell"
            className="inline-flex items-center gap-2 bg-forest-700 hover:bg-forest-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow transition"
          >
            <span>{t('farmerOrders.listMoreCrops', 'List More Crops')}</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const orderDate = item.orderDate
              ? formatDateTime(item.orderDate, i18n.language)
              : t('cropCard.recent', 'Recent');

            const formattedLineTotal = formatNumber(item.lineTotal, i18n.language, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
            const formattedPrice = formatNumber(item.pricePerKg, i18n.language, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
            const formattedQuantity = formatNumber(item.quantityKg, i18n.language);

            return (
              <div
                key={item.orderItemId}
                className="bg-white rounded-2xl border border-forest-100 p-6 shadow-sm hover:shadow transition flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
              >
                {/* Left crop & buyer details */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      Order #{item.orderId}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {orderDate}
                    </span>
                    {getStatusBadge(item.orderStatus)}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">
                    {item.cropName} — <span className="text-forest-700">{formattedQuantity} {t('cropCard.kg', 'kg')}</span>
                  </h3>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-forest-600" />
                      {t('farmerOrders.customer', 'Customer:')} <strong>{item.customerName}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-forest-600" />
                      {t('farmerOrders.shipTo', 'Ship to:')} <strong>{item.deliveryAddress}</strong>
                    </span>
                  </div>
                </div>

                {/* Right financial & lifecycle progression buttons */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      {t('farmerOrders.payoutValue', 'Payout Value')}
                    </span>
                    <span className="text-xl font-extrabold text-forest-800">
                      ₹{formattedLineTotal}
                    </span>
                    <span className="text-xs text-slate-400 block">
                      (₹{formattedPrice} / kg)
                    </span>
                  </div>

                  {/* Order Status Action Controls */}
                  <div className="flex items-center gap-2">
                    {item.orderStatus === 'PLACED' && (
                      <button
                        onClick={() => handleUpdateStatus(item.orderId, 'CONFIRMED')}
                        disabled={updatingId === item.orderId}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition disabled:opacity-50"
                      >
                        {updatingId === item.orderId ? t('farmerOrders.updating', 'Updating...') : t('farmerOrders.confirmOrder', 'Confirm Order')}
                      </button>
                    )}

                    {item.orderStatus === 'CONFIRMED' && (
                      <button
                        onClick={() => handleUpdateStatus(item.orderId, 'PACKED')}
                        disabled={updatingId === item.orderId}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition disabled:opacity-50"
                      >
                        {updatingId === item.orderId ? t('farmerOrders.updating', 'Updating...') : t('farmerOrders.markPacked', 'Mark as Packed')}
                      </button>
                    )}

                    {item.orderStatus === 'PACKED' && (
                      <button
                        onClick={() => handleUpdateStatus(item.orderId, 'SHIPPED')}
                        disabled={updatingId === item.orderId}
                        className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition disabled:opacity-50"
                      >
                        {updatingId === item.orderId ? t('farmerOrders.updating', 'Updating...') : t('farmerOrders.markShipped', 'Mark as Shipped')}
                      </button>
                    )}

                    {item.orderStatus === 'SHIPPED' && (
                      <button
                        onClick={() => handleUpdateStatus(item.orderId, 'DELIVERED')}
                        disabled={updatingId === item.orderId}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition disabled:opacity-50"
                      >
                        {updatingId === item.orderId ? t('farmerOrders.updating', 'Updating...') : t('farmerOrders.markDelivered', 'Mark as Delivered')}
                      </button>
                    )}

                    {item.orderStatus === 'DELIVERED' && (
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                        {t('farmerOrders.fulfilledCompleted', 'Fulfilled & Completed')}
                      </span>
                    )}

                    {item.orderStatus === 'CANCELLED' && (
                      <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl">
                        {t('farmerOrders.orderCancelled', 'Order Cancelled')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
