import apiClient from './client';

export const aiService = {
  /**
   * Fetch demand forecast for a specific crop listing
   * @param {number|string} cropId
   * @param {number} horizonDays
   */
  async getDemandForecast(cropId, horizonDays = 7) {
    const response = await apiClient.get(`/api/ai/forecast/${cropId}`, {
      params: { horizon: horizonDays },
    });
    return response.data;
  },

  /**
   * Fetch dynamic pricing recommendation with explainable factors
   * @param {number|string} cropId
   * @param {number|null} costPerKg
   */
  async getPriceRecommendation(cropId, costPerKg = null) {
    const payload = costPerKg !== null && costPerKg !== '' ? { costPerKg: parseFloat(costPerKg) } : {};
    const response = await apiClient.post(`/api/ai/pricing/${cropId}`, payload);
    return response.data;
  },

  /**
   * Fetch farmer profit intelligence summary
   * @param {Object|null} cropCosts Map of cropId -> costPerKg
   */
  async getProfitSummary(cropCosts = null) {
    if (cropCosts && Object.keys(cropCosts).length > 0) {
      const response = await apiClient.post('/api/ai/profit/summary', {
        cropCosts,
      });
      return response.data;
    }
    const response = await apiClient.get('/api/ai/profit/summary');
    return response.data;
  },
};
