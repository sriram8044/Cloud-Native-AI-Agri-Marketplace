import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import FarmerInsightsPage from '../pages/FarmerInsightsPage';
import { AuthContext } from '../context/AuthContext';
import { cropService } from '../api/cropService';
import { aiService } from '../api/aiService';

// Mock API modules
vi.mock('../api/cropService', () => ({
  cropService: {
    getAllCrops: vi.fn(),
  },
}));

vi.mock('../api/aiService', () => ({
  aiService: {
    getDemandForecast: vi.fn(),
    getPriceRecommendation: vi.fn(),
    getProfitSummary: vi.fn(),
  },
}));

describe('Phase 6 Frontend AI Insights UI Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders farmer sign-in prompt when unauthenticated', () => {
    const mockAuth = {
      user: null,
      isFarmer: () => false,
      login: vi.fn(),
      logout: vi.fn(),
    };

    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuth}>
          <FarmerInsightsPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Farmer Access Required/i)).toBeDefined();
    expect(screen.getByText(/Sign In as Farmer/i)).toBeDefined();
  });

  it('renders insights dashboard with crop selection and data limitation notice when data is sparse', async () => {
    const mockFarmer = {
      id: 1,
      name: 'Ramesh Patel',
      role: 'FARMER',
    };

    const mockAuth = {
      user: mockFarmer,
      isFarmer: () => true,
    };

    cropService.getAllCrops.mockResolvedValue([
      {
        id: 1,
        name: 'Organic Sharbati Wheat',
        category: 'Grains',
        pricePerKg: 42.5,
        availableQuantityKg: 1485.0,
        farmerId: 1,
        farmerName: 'Ramesh Patel',
      },
    ]);

    aiService.getDemandForecast.mockResolvedValue({
      crop_id: 1,
      crop_name: 'Organic Sharbati Wheat',
      status: 'INSUFFICIENT_DATA',
      has_sufficient_data: false,
      historical_points_count: 1,
      minimum_points_required: 5,
      forecast_horizon_days: 7,
      forecast: [
        { date: '2026-10-28', predicted_demand_kg: 15.0, is_fallback: true },
      ],
      baseline_model: {
        name: 'Historical Moving Average Baseline',
        mae: null,
        rmse: null,
        description: 'Fallback projection',
      },
      evaluated_model: {
        name: 'Ridge Autoregressive Model',
        mae: null,
        rmse: null,
        description: 'Evaluation withheld',
      },
      data_limitations: ['Only 1 historical point available.'],
    });

    aiService.getPriceRecommendation.mockResolvedValue({
      crop_id: 1,
      crop_name: 'Organic Sharbati Wheat',
      current_price_per_kg: 42.5,
      suggested_price_per_kg: 43.5,
      price_range: { min_price_per_kg: 38.0, max_price_per_kg: 46.5 },
      methodology: 'EXPLAINABLE_RULE_ENGINE',
      factors: [
        {
          factor: 'Production Cost Protection',
          impact: 'PROTECTIVE',
          description: 'Cost floor maintained.',
        },
      ],
      action_required: 'Farmer review required. Prices will NOT be modified automatically.',
    });

    aiService.getProfitSummary.mockResolvedValue({
      farmer_id: 1,
      total_gross_revenue: 637.5,
      profit_available: false,
      total_estimated_cost: null,
      total_estimated_profit: null,
      overall_profit_margin_percent: null,
      crop_summaries: [
        {
          crop_id: 1,
          crop_name: 'Organic Sharbati Wheat',
          quantity_sold_kg: 15.0,
          gross_revenue: 637.5,
          cost_per_kg: null,
          estimated_cost: null,
          estimated_profit: null,
          profit_margin_percent: null,
          status: 'COST_DATA_MISSING',
        },
      ],
      guidance: 'Production costs were never inferred.',
    });

    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuth}>
          <FarmerInsightsPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Farmer AI Intelligence & Profit Dashboard/i)).toBeDefined();
      expect(screen.getByText(/Crop Demand Forecast/i)).toBeDefined();
      expect(screen.getByText(/Data Limitation Notice/i)).toBeDefined();
      expect(screen.getByText(/Explainable Price Recommendation/i)).toBeDefined();
      expect(screen.getByText(/Farmer Approval Required/i)).toBeDefined();
      expect(screen.getByText(/Gross Sales Revenue/i)).toBeDefined();
    });
  });

  it('renders service error alert when AI microservice is offline', async () => {
    const mockFarmer = {
      id: 1,
      name: 'Ramesh Patel',
      role: 'FARMER',
    };

    const mockAuth = {
      user: mockFarmer,
      isFarmer: () => true,
    };

    cropService.getAllCrops.mockResolvedValue([
      {
        id: 1,
        name: 'Organic Sharbati Wheat',
        farmerId: 1,
      },
    ]);

    aiService.getDemandForecast.mockRejectedValue(
      new Error('AI forecasting service is currently unreachable.')
    );
    aiService.getPriceRecommendation.mockRejectedValue(
      new Error('AI forecasting service is currently unreachable.')
    );
    aiService.getProfitSummary.mockResolvedValue({
      total_gross_revenue: 0,
      crop_summaries: [],
    });

    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuth}>
          <FarmerInsightsPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/AI Service Connection Notice/i)).toBeDefined();
      expect(screen.getByText(/currently unreachable/i)).toBeDefined();
    });
  });
});
