import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';

// Mock useAuth
jest.mock('@/context/useAuth', () => ({
  useAuth: jest.fn()
}));

import { useAuth } from '@/context/useAuth';

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state when loading', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      loading: true,
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      authFetch: jest.fn(),
    } as any);

    render(
      <TestWrapper>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </TestWrapper>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should redirect to login when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      authFetch: jest.fn(),
    } as any);

    render(
      <TestWrapper>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </TestWrapper>
    );

    // Protected content should not be visible (redirect happens)
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should render children when authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: { id: 1, email: 'test@example.com', username: 'testuser' },
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      authFetch: jest.fn(),
    } as any);

    render(
      <TestWrapper>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </TestWrapper>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
