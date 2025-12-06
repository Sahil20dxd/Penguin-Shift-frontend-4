import { renderHook, act, render, screen } from '@testing-library/react';
import { useToast } from '../useToast';
import * as ToastPrimitive from '@radix-ui/react-toast';

// Mock Radix UI Toast
jest.mock('@radix-ui/react-toast', () => ({
  Root: ({ children, open, onOpenChange, className }: any) => (
    <div data-testid="toast-root" data-open={open} className={className}>
      {children}
    </div>
  ),
  Title: ({ children, className }: any) => (
    <div data-testid="toast-title" className={className}>{children}</div>
  ),
  Close: ({ className, 'aria-label': ariaLabel }: any) => (
    <button data-testid="toast-close" className={className} aria-label={ariaLabel}>×</button>
  ),
  Provider: ({ children }: any) => <div>{children}</div>
}));

describe('useToast', () => {
  it('should initialize with closed state', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.showToast).toBeDefined();
    expect(result.current.Toast).toBeDefined();
  });

  it('should show toast with message', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showToast('Test message');
    });

    const { container } = render(result.current.Toast);
    expect(container.querySelector('[data-testid="toast-title"]')).toHaveTextContent('Test message');
  });

  it('should show success toast with correct styling', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showToast('Success!', 'success');
    });

    const { container } = render(result.current.Toast);
    const root = container.querySelector('[data-testid="toast-root"]');
    expect(root).toHaveClass('bg-green-600');
  });

  it('should show error toast with correct styling', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showToast('Error!', 'error');
    });

    const { container } = render(result.current.Toast);
    const root = container.querySelector('[data-testid="toast-root"]');
    expect(root).toHaveClass('bg-red-600');
  });

  it('should show warning toast with correct styling', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showToast('Warning!', 'warning');
    });

    const { container } = render(result.current.Toast);
    const root = container.querySelector('[data-testid="toast-root"]');
    expect(root).toHaveClass('bg-amber-500');
  });

  it('should show info toast with correct styling', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showToast('Info!', 'info');
    });

    const { container } = render(result.current.Toast);
    const root = container.querySelector('[data-testid="toast-root"]');
    expect(root).toHaveClass('bg-indigo-600');
  });

  it('should default to info variant when type not specified', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showToast('Message');
    });

    const { container } = render(result.current.Toast);
    const root = container.querySelector('[data-testid="toast-root"]');
    expect(root).toHaveClass('bg-indigo-600');
  });

  it('should update message when showToast is called multiple times', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showToast('First message');
    });

    let { container } = render(result.current.Toast);
    expect(container.querySelector('[data-testid="toast-title"]')).toHaveTextContent('First message');

    act(() => {
      result.current.showToast('Second message');
    });

    container = render(result.current.Toast).container;
    expect(container.querySelector('[data-testid="toast-title"]')).toHaveTextContent('Second message');
  });
});

