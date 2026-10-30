import apiClient from './client';

export const cartService = {
  async getCart() {
    const response = await apiClient.get('/api/cart');
    return response.data;
  },

  async addToCart(cropId, quantityKg) {
    const response = await apiClient.post('/api/cart/items', {
      cropId,
      quantityKg,
    });
    return response.data;
  },

  async updateCartItem(itemId, quantityKg) {
    const response = await apiClient.put(`/api/cart/items/${itemId}`, {
      quantityKg,
    });
    return response.data;
  },

  async removeCartItem(itemId) {
    const response = await apiClient.delete(`/api/cart/items/${itemId}`);
    return response.data;
  },

  async clearCart() {
    const response = await apiClient.delete('/api/cart');
    return response.data;
  },
};
