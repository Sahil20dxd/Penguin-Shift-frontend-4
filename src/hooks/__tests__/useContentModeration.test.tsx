import { renderHook, act } from '@testing-library/react';
import { useContentModeration } from '../useContentModeration';
import { clearValidationCache } from '@/utils/contentModeration';

describe('useContentModeration', () => {
  beforeEach(() => {
    clearValidationCache();
  });

  it('should initialize with empty value', () => {
    const { result } = renderHook(() => useContentModeration());
    expect(result.current.value).toBe('');
    expect(result.current.error).toBeNull();
    expect(result.current.isValid).toBe(true);
  });

  it('should initialize with provided value', () => {
    const { result } = renderHook(() => useContentModeration('initial'));
    expect(result.current.value).toBe('initial');
  });

  it('should update value on handleChange', () => {
    const { result } = renderHook(() => useContentModeration());
    
    const event = {
      target: { value: 'new value' }
    } as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleChange(event);
    });

    expect(result.current.value).toBe('new value');
  });

  it('should validate valid input', () => {
    const { result } = renderHook(() => useContentModeration());
    
    const event = {
      target: { value: 'validusername' }
    } as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleChange(event);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.isValid).toBe(true);
  });

  it('should validate invalid input', () => {
    const { result } = renderHook(() => useContentModeration());
    
    const event = {
      target: { value: 'fuck' }
    } as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleChange(event);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.isValid).toBe(false);
  });

  it('should validate using validate method', () => {
    const { result } = renderHook(() => useContentModeration());
    
    act(() => {
      const isValid = result.current.validate('valid');
      expect(isValid).toBe(true);
    });

    act(() => {
      const isValid = result.current.validate('fuck');
      expect(isValid).toBe(false);
    });
  });

  it('should update error state when validate is called', () => {
    const { result } = renderHook(() => useContentModeration());
    
    act(() => {
      const isValid = result.current.validate('fuck'); // Use actual banned word
      expect(isValid).toBe(false);
    });

    // Error should be set after validation
    expect(result.current.error).toBeTruthy();
    expect(result.current.isValid).toBe(false);
  });

  it('should allow setting value directly', () => {
    const { result } = renderHook(() => useContentModeration());
    
    act(() => {
      result.current.setValue('direct value');
    });

    expect(result.current.value).toBe('direct value');
  });
});

