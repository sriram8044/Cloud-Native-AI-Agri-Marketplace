import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import { AuthProvider } from '../context/AuthContext';

describe('Frontend Authentication UI & Validation Tests', () => {
  it('renders login page with email, password inputs and demo account helpers', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByLabelText(/Email Address/i)).toBeDefined();
    expect(screen.getByLabelText(/Password/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeDefined();
    expect(screen.getByText(/Demo Farmer/i)).toBeDefined();
    expect(screen.getByText(/Demo Admin/i)).toBeDefined();
  });

  it('renders register page with name, email, password, and Customer/Farmer role options', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <RegisterPage />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByLabelText(/Full Name/i)).toBeDefined();
    expect(screen.getByLabelText(/Email Address/i)).toBeDefined();
    expect(screen.getByLabelText(/Password/i)).toBeDefined();
    expect(screen.getByText(/Buyer \/ Customer/i)).toBeDefined();
    expect(screen.getByText(/Farmer \/ Producer/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Register Account/i })).toBeDefined();
  });

  it('prohibits administrative role selection on public registration page', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <RegisterPage />
        </AuthProvider>
      </BrowserRouter>
    );

    // Verify ADMIN is not an option on the registration page
    expect(screen.queryByText(/Administrator/i)).toBeNull();
    expect(screen.getByText(/Administrative roles cannot be registered through public registration/i)).toBeDefined();
  });
});
