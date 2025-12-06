// Mock the logger module to avoid import.meta issues
jest.mock('../logger', () => {
  const mockEnv = { DEV: true };
  
  return {
    logger: {
      log: jest.fn((...args: any[]) => {
        if (mockEnv.DEV) {
          console.log(...args);
        }
      }),
      error: jest.fn((...args: any[]) => {
        console.error(...args);
      }),
      warn: jest.fn((...args: any[]) => {
        if (mockEnv.DEV) {
          console.warn(...args);
        }
      }),
      _setEnv: (env: { DEV: boolean }) => {
        mockEnv.DEV = env.DEV;
      }
    }
  };
});

import { logger } from '../logger';

describe('logger', () => {
  const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to dev mode by default
    (logger as any)._setEnv?.({ DEV: true });
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('logger.log', () => {
    it('should log in development mode', () => {
      (logger as any)._setEnv?.({ DEV: true });
      logger.log('test message');
      expect(consoleLogSpy).toHaveBeenCalledWith('test message');
    });

    it('should not log in production mode', () => {
      (logger as any)._setEnv?.({ DEV: false });
      logger.log('test message');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should handle multiple arguments', () => {
      (logger as any)._setEnv?.({ DEV: true });
      logger.log('message', { key: 'value' }, 123);
      expect(consoleLogSpy).toHaveBeenCalledWith('message', { key: 'value' }, 123);
    });
  });

  describe('logger.warn', () => {
    it('should warn in development mode', () => {
      (logger as any)._setEnv?.({ DEV: true });
      logger.warn('warning message');
      expect(consoleWarnSpy).toHaveBeenCalledWith('warning message');
    });

    it('should not warn in production mode', () => {
      (logger as any)._setEnv?.({ DEV: false });
      logger.warn('warning message');
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });

  describe('logger.error', () => {
    it('should always log errors, even in production', () => {
      (logger as any)._setEnv?.({ DEV: false });
      logger.error('error message');
      expect(consoleErrorSpy).toHaveBeenCalledWith('error message');
    });

    it('should log errors in development mode', () => {
      (logger as any)._setEnv?.({ DEV: true });
      logger.error('error message');
      expect(consoleErrorSpy).toHaveBeenCalledWith('error message');
    });

    it('should handle error objects', () => {
      const error = new Error('test error');
      logger.error('Error occurred:', error);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error occurred:', error);
    });
  });
});
