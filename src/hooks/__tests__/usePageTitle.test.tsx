import { renderHook } from '@testing-library/react';
import { usePageTitle } from '../usePageTitle';

describe('usePageTitle', () => {
  const originalTitle = document.title;

  afterEach(() => {
    document.title = originalTitle;
  });

  it('should set default title when no title provided', () => {
    renderHook(() => usePageTitle());
    expect(document.title).toBe('PenguinShift - Transfer Playlists Between Music Platforms');
  });

  it('should set title with provided string', () => {
    renderHook(() => usePageTitle('Dashboard'));
    expect(document.title).toBe('Dashboard | PenguinShift');
  });

  it('should update title when title changes', () => {
    const { rerender } = renderHook(({ title }) => usePageTitle(title), {
      initialProps: { title: 'Login' }
    });

    expect(document.title).toBe('Login | PenguinShift');

    rerender({ title: 'Register' });
    expect(document.title).toBe('Register | PenguinShift');
  });

  it('should restore previous title on unmount', () => {
    document.title = 'Previous Title';
    const { unmount } = renderHook(() => usePageTitle('Test'));
    
    expect(document.title).toBe('Test | PenguinShift');
    
    unmount();
    expect(document.title).toBe('Previous Title');
  });

  it('should handle empty string title', () => {
    // Empty string is falsy, so it should use DEFAULT_TITLE
    renderHook(() => usePageTitle(''));
    expect(document.title).toBe('PenguinShift - Transfer Playlists Between Music Platforms');
  });
});

