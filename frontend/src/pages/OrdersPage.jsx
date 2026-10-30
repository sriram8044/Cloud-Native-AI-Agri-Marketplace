import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Package, Calendar, MapPin, AlertCircle, XCircle, 
  ArrowRight, Store, CheckCircle, Clock, Truck, CheckCheck 
} from 'lucide-react';
import { orderService } from '../api/orderService';
import { useAuth } from '../context/AuthContext';
import { formatNumber, formatDateTime } from '../utils/formatters';

export default function OrdersPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelMessage, setCancelMessage] = useState('');

  useEffect(() => {
    if (user && user.role === 'CUSTOMER') {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await orderService.getMyOrders();
      setOrders(data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load your order history');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    const confirmPrompt = t('orders.confirmCancel', 'Are you sure you want to cancel this order? The reserved stock will be automatically restored to the marketplace.');
    if (!window.confirm(confirmPrompt)) {
      return;
    }
    setCancellingId(orderId);
    setCancelMessage('');
    try {
      await orderService.updateOrderStatus(orderId, 'CANCELLED');
      setCancelMessage(t('orders.cancelSuccess', { id: orderId, defaultValue: `Order #${orderId} was cancelled successfully and crop stock has been restored.` }));
      await fetchOrders();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancellingId(null);
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
          {t('orders.signInToView', 'Sign In to View Orders')}
        </h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
          {t('orders.signInDesc', 'Please log in to track your current harvest shipments and review past orders.')}
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 bg-forest-700 hover:bg-forest-800 text-white px-6 py-2.5 rounded-xl font-semibold shadow-sm transition"
        >
          <span>{t('orders.signInBtn', 'Sign In')}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  if (user.role !== 'CUSTOMER') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {t('orders.customerOrderHistory', 'Customer Order History')}
        </h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
          {t('orders.customerOnlyDesc', { role: user.role, defaultValue: `This page shows purchases made by customer accounts. You are currently logged in as a ${user.role}.` })}
        </p>
        <Link
          to="/farmer/orders"
          className="inline-flex items-center gap-2 bg-forest-700 hover:bg-forest-800 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition"
        >
          <span>{t('orders.viewFarmerOrders', 'View Farmer Fulfillment Orders')}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 pb-4 border-b border-forest-100">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t('orders.title', 'My Order History')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          {t('orders.subtitle', 'Review details, tracking lifecycle, and historical crop receipts.')}
        </p>
      </div>

      {cancelMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{cancelMessage}</span>
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
          <p className="text-sm text-slate-500">{t('orders.loadingOrders', 'Loading your orders...')}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-forest-100 p-8 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-forest-50 text-forest-600 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">{t('orders.noOrdersTitle', 'No Orders Placed Yet')}</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
            {t('orders.noOrdersDesc', "You haven't placed any harvest orders yet. Browse through our catalog to source high quality crops directly from farmers.")}
          </p>
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 bg-forest-700 hover:bg-forest-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow transition"
          >
            <Store className="w-4 h-4" />
            <span>{t('orders.browseCatalog', 'Browse Marketplace')}</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const formattedDate = order.createdAt
              ? formatDateTime(order.createdAt, i18n.language)
              : t('cropCard.recent', 'Recent');

            const canCancel = order.status === 'PLACED' || order.status === 'CONFIRMED';
            const formattedTotal = formatNumber(order.totalAmount, i18n.language, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-forest-100/90 shadow-sm overflow-hidden hover:shadow-md transition"
              >
                {/* Order Top Bar */}
                <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-slate-900">
                      {t('orders.orderNumber', { id: order.id, defaultValue: `Order #${order.id}` })}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formattedDate}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(order.status)}
                    {canCancel && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={cancellingId === order.id}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 transition disabled:opacity-50"
                      >
                        {cancellingId === order.id ? t('orders.cancelling', 'Cancelling...') : t('orders.cancelOrder', 'Cancel Order')}
                      </button>
                    )}
                  </div>
                </div>

                {/* Items & Address Body */}
                <div className="p-6">
                  <div className="space-y-3 mb-4">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0 text-sm"
                      >
                        <div>
                          <span className="font-bold text-slate-900">{item.cropName}</span>
                          <span className="text-xs text-slate-500 block">
                            {t('cart.farmerLabel', 'Farmer:')} {item.farmerName} • ₹{formatNumber(item.pricePerKg, i18n.language, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / kg
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium text-slate-700 block">
                            {formatNumber(item.quantityKg, i18n.language)} {t('cropCard.kg', 'kg')}
                          </span>
                          <span className="font-bold text-forest-800 text-sm">
                            ₹{formatNumber(item.lineTotal, i18n.language, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Footer */}
                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5 max-w-md">
                      <MapPin className="w-4 h-4 text-forest-600 shrink-0" />
                      <span>{t('orders.deliveryTo', 'Delivery:')} <strong>{order.deliveryAddress}</strong></span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 mr-2 uppercase tracking-wider font-semibold text-[10px]">
                        {t('orders.orderTotal', 'Order Total')}
                      </span>
                      <span className="text-lg font-extrabold text-forest-900">
                        ₹{formattedTotal}
                      </span>
                    </div>
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
