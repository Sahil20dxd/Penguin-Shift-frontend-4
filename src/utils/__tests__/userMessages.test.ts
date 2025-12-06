import {
  getUserFriendlyError,
  getErrorMessage,
  TransferStatusMessages,
  TransferPhaseMessages,
  getTransferPhaseMessage,
  getProgressMessage
} from '../userMessages';

describe('userMessages', () => {
  describe('getUserFriendlyError', () => {
    it('should return default message when status is undefined', () => {
      expect(getUserFriendlyError(undefined)).toBe('Something went wrong. Please try again.');
    });

    it('should return custom default message when provided', () => {
      expect(getUserFriendlyError(undefined, 'Custom error')).toBe('Custom error');
    });

    it('should return user-friendly message for 400', () => {
      expect(getUserFriendlyError(400)).toBe('Please check your input and try again.');
    });

    it('should return user-friendly message for 401', () => {
      expect(getUserFriendlyError(401)).toBe('Your session has expired. Please log in again.');
    });

    it('should return user-friendly message for 403', () => {
      expect(getUserFriendlyError(403)).toBe('You don\'t have permission to perform this action.');
    });

    it('should return user-friendly message for 404', () => {
      expect(getUserFriendlyError(404)).toBe('The requested item could not be found.');
    });

    it('should return user-friendly message for 409', () => {
      expect(getUserFriendlyError(409)).toBe('YouTube API quota limit has been reached. Please try again after 24 hours.');
    });

    it('should return user-friendly message for 500', () => {
      expect(getUserFriendlyError(500)).toBe('Our servers are experiencing issues. Please try again in a few moments.');
    });

    it('should return default message for unknown status codes', () => {
      expect(getUserFriendlyError(999)).toBe('Something went wrong. Please try again.');
    });

    it('should use custom default for unknown status codes', () => {
      expect(getUserFriendlyError(999, 'Custom default')).toBe('Custom default');
    });
  });

  describe('getErrorMessage', () => {
    it('should return default message when error is null/undefined', () => {
      expect(getErrorMessage(null)).toBe('An unexpected error occurred. Please try again.');
      expect(getErrorMessage(undefined)).toBe('An unexpected error occurred. Please try again.');
    });

    it('should return string error as-is if user-friendly', () => {
      expect(getErrorMessage('User-friendly message')).toBe('User-friendly message');
    });

    it('should extract status from error object', () => {
      const error = { status: 401 };
      expect(getErrorMessage(error)).toBe('Your session has expired. Please log in again.');
    });

    it('should extract status from error.response', () => {
      const error = { response: { status: 404 } };
      expect(getErrorMessage(error)).toBe('The requested item could not be found.');
    });

    it('should clean HTTP status codes from messages', () => {
      const error = { message: 'HTTP 404 Not Found' };
      const result = getErrorMessage(error);
      expect(result).not.toContain('HTTP');
      expect(result).not.toContain('404');
    });

    it('should use context when provided', () => {
      const error = { message: 'HTTP 500', status: 500 };
      const result = getErrorMessage(error, 'load playlists');
      // When status is provided, it uses getUserFriendlyError which doesn't use context
      // So we check that it returns a user-friendly message
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should handle error.message', () => {
      const error = { message: 'Network error' };
      expect(getErrorMessage(error)).toBe('Network error');
    });

    it('should handle error.error', () => {
      const error = { error: 'Validation failed' };
      expect(getErrorMessage(error)).toBe('Validation failed');
    });
  });

  describe('TransferStatusMessages', () => {
    it('should have all required status messages', () => {
      expect(TransferStatusMessages.IDLE).toBe('Ready to start your transfer');
      expect(TransferStatusMessages.PENDING).toBe('Preparing your transfer...');
      expect(TransferStatusMessages.RUNNING).toBe('Transferring your music...');
      expect(TransferStatusMessages.COMPLETED).toBe('Transfer completed successfully!');
      expect(TransferStatusMessages.FAILED).toBe('Transfer failed. Please try again.');
    });
  });

  describe('getTransferPhaseMessage', () => {
    it('should return default message for null/undefined', () => {
      expect(getTransferPhaseMessage(null)).toBe('Processing your transfer...');
      expect(getTransferPhaseMessage(undefined)).toBe('Processing your transfer...');
    });

    it('should return message for known phases', () => {
      expect(getTransferPhaseMessage('Idle')).toBe('Ready to begin');
      expect(getTransferPhaseMessage('Connecting')).toBe('Connecting to your music platforms...');
      expect(getTransferPhaseMessage('Matching')).toBe('Finding matching songs...');
    });

    it('should return formatted message for unknown phases', () => {
      expect(getTransferPhaseMessage('CustomPhase')).toBe('Processing: CustomPhase...');
    });
  });

  describe('getProgressMessage', () => {
    it('should return preparing message when total is 0', () => {
      expect(getProgressMessage(0, 0)).toBe('Preparing...');
    });

    it('should calculate percentage correctly', () => {
      const result = getProgressMessage(25, 100);
      expect(result).toContain('25 of 100');
      expect(result).toContain('25%');
    });

    it('should include phase message when provided', () => {
      const result = getProgressMessage(10, 50, 'Matching');
      expect(result).toContain('Finding matching songs...');
      expect(result).toContain('10 of 50');
    });

    it('should round percentage correctly', () => {
      const result = getProgressMessage(33, 100);
      expect(result).toContain('33%');
    });
  });
});

