import apiClient from './client';

export const orderService = {
  async placeOrder(deliveryAddress) {
    const response = await apiClient.post('/api/orders', {
      deliveryAddress,
    });
    return response.data;
  },

  async getMyOrders() {
    const response = await apiClient.get('/api/orders/my');
    return response.data;
  },

  async getOrderById(id) {
    const response = await apiClient.get(`/api/orders/${id}`);
    return response.data;
  },

  async getFarmerOrders() {
    const response = await apiClient.get('/api/orders/farmer');
    return response.data;
  },

  async updateOrderStatus(id, status) {
    const response = await apiClient.patch(`/api/orders/${id}/status`, {
      status,
    });
    return response.data;
  },
};
