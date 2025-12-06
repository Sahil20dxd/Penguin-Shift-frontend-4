import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts, ESC_KEY, ENTER_KEY } from '../useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  let mockHandler: jest.Mock;

  beforeEach(() => {
    mockHandler = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call handler when key is pressed', () => {
    renderHook(() => useKeyboardShortcuts([
      { key: 'k', handler: mockHandler }
    ]));

    const event = new KeyboardEvent('keydown', { key: 'k' });
    window.dispatchEvent(event);

    expect(mockHandler).toHaveBeenCalledTimes(1);
  });

  it('should not call handler when different key is pressed', () => {
    renderHook(() => useKeyboardShortcuts([
      { key: 'k', handler: mockHandler }
    ]));

    const event = new KeyboardEvent('keydown', { key: 'j' });
    window.dispatchEvent(event);

    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('should handle Ctrl key modifier', () => {
    renderHook(() => useKeyboardShortcuts([
      { key: 's', ctrlKey: true, handler: mockHandler }
    ]));

    const event = new KeyboardEvent('keydown', { key: 's', ctrlKey: true });
    window.dispatchEvent(event);

    expect(mockHandler).toHaveBeenCalledTimes(1);
  });

  it('should not trigger when Ctrl is required but not pressed', () => {
    renderHook(() => useKeyboardShortcuts([
      { key: 's', ctrlKey: true, handler: mockHandler }
    ]));

    const event = new KeyboardEvent('keydown', { key: 's', ctrlKey: false });
    window.dispatchEvent(event);

    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('should not trigger when typing in input field', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    renderHook(() => useKeyboardShortcuts([
      { key: 'k', handler: mockHandler }
    ]));

    const event = new KeyboardEvent('keydown', { key: 'k', bubbles: true });
    input.dispatchEvent(event);

    expect(mockHandler).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it('should not trigger when typing in textarea', () => {
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    textarea.focus();

    renderHook(() => useKeyboardShortcuts([
      { key: 'k', handler: mockHandler }
    ]));

    const event = new KeyboardEvent('keydown', { key: 'k', bubbles: true });
    textarea.dispatchEvent(event);

    expect(mockHandler).not.toHaveBeenCalled();

    document.body.removeChild(textarea);
  });

  it('should prevent default when shortcut matches', () => {
    renderHook(() => useKeyboardShortcuts([
      { key: 'k', handler: mockHandler }
    ]));

    const event = new KeyboardEvent('keydown', { key: 'k', cancelable: true });
    const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
    window.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should handle multiple shortcuts', () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();

    renderHook(() => useKeyboardShortcuts([
      { key: 'k', handler: handler1 },
      { key: 'j', handler: handler2 }
    ]));

    const event1 = new KeyboardEvent('keydown', { key: 'k' });
    window.dispatchEvent(event1);

    const event2 = new KeyboardEvent('keydown', { key: 'j' });
    window.dispatchEvent(event2);

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it('should cleanup event listener on unmount', () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useKeyboardShortcuts([
      { key: 'k', handler: mockHandler }
    ]));

    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('should export ESC_KEY constant', () => {
    expect(ESC_KEY).toBe('Escape');
  });

  it('should export ENTER_KEY constant', () => {
    expect(ENTER_KEY).toBe('Enter');
  });
});

