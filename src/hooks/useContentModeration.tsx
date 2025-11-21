// src/hooks/useContentModeration.tsx
import { useState, useCallback } from 'react';
import { validateTextInput } from '@/utils/contentModeration';

/**
 * Hook for content moderation validation
 * Returns validation state and handlers for input fields
 */
export function useContentModeration(initialValue: string = '') {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    
    // Validate on change
    const validationError = validateTextInput(newValue);
    setError(validationError);
    
    // Call original onChange if provided
    if (e.target.onchange) {
      e.target.onchange(e as any);
    }
  }, []);

  const validate = useCallback((text: string) => {
    const validationError = validateTextInput(text);
    setError(validationError);
    return validationError === null;
  }, []);

  return {
    value,
    setValue,
    error,
    handleChange,
    validate,
    isValid: error === null
  };
}

