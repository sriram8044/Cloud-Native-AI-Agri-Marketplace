import apiClient from './client';

export const cropService = {
  // Check backend health
  getHealth: async () => {
    const response = await apiClient.get('/api/health');
    return response.data;
  },

  // Fetch all crops with optional search term
  getAllCrops: async (searchTerm = '') => {
    const params = searchTerm ? { search: searchTerm } : {};
    const response = await apiClient.get('/api/crops', { params });
    return response.data;
  },

  // Fetch single crop by ID
  getCropById: async (id) => {
    const response = await apiClient.get(`/api/crops/${id}`);
    return response.data;
  },

  // Create new crop listing
  createCrop: async (cropData) => {
    const payload = {
      name: cropData.name,
      category: cropData.category,
      description: cropData.description || '',
      pricePerKg: parseFloat(cropData.pricePerKg),
      availableQuantityKg: parseFloat(cropData.availableQuantityKg),
      location: cropData.location,
    };
    const response = await apiClient.post('/api/crops', payload);
    return response.data;
  },
};
