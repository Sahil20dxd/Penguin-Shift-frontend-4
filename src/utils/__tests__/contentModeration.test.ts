import { 
  isUsernameAllowed, 
  validateTextInput, 
  validateInput, 
  clearValidationCache 
} from '../contentModeration';

describe('contentModeration', () => {
  beforeEach(() => {
    clearValidationCache();
  });

  describe('isUsernameAllowed', () => {
    it('should return true for valid usernames', () => {
      expect(isUsernameAllowed('john_doe')).toBe(true);
      expect(isUsernameAllowed('musiclover123')).toBe(true);
      expect(isUsernameAllowed('user-name')).toBe(true);
    });

    it('should return false for banned words', () => {
      expect(isUsernameAllowed('fuck')).toBe(false);
      expect(isUsernameAllowed('testfuck')).toBe(false);
      expect(isUsernameAllowed('bitch123')).toBe(false);
      expect(isUsernameAllowed('shithead')).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(isUsernameAllowed('')).toBe(true);
      expect(isUsernameAllowed('   ')).toBe(true);
    });

    it('should handle null and undefined', () => {
      expect(isUsernameAllowed(null as any)).toBe(true);
      expect(isUsernameAllowed(undefined as any)).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(isUsernameAllowed('FUCK')).toBe(false);
      expect(isUsernameAllowed('BiTcH')).toBe(false);
    });

    it('should use cache for repeated calls', () => {
      const username = 'testuser';
      const result1 = isUsernameAllowed(username);
      const result2 = isUsernameAllowed(username);
      expect(result1).toBe(result2);
    });
  });

  describe('validateTextInput', () => {
    it('should return null for valid text', () => {
      expect(validateTextInput('valid text')).toBeNull();
      expect(validateTextInput('hello world')).toBeNull();
    });

    it('should return error message for invalid text', () => {
      const result = validateTextInput('fuck');
      expect(result).toBe('This text contains inappropriate content. Please use different wording.');
    });

    it('should return null for empty or null input', () => {
      expect(validateTextInput('')).toBeNull();
      expect(validateTextInput(null as any)).toBeNull();
      expect(validateTextInput(undefined as any)).toBeNull();
    });
  });

  describe('validateInput', () => {
    it('should return isValid true for valid input', () => {
      const result = validateInput('validusername');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should return isValid false for invalid input', () => {
      const result = validateInput('fuck');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('This text contains inappropriate content. Please use different wording.');
    });
  });

  describe('clearValidationCache', () => {
    it('should clear the validation cache', () => {
      isUsernameAllowed('testuser');
      expect(isUsernameAllowed('testuser')).toBe(true); // Should use cache
      
      clearValidationCache();
      // Cache should be cleared, but result should still be the same
      expect(isUsernameAllowed('testuser')).toBe(true);
    });
  });
});

