// src/hooks/usePageTitle.tsx
import { useEffect } from 'react';

const DEFAULT_TITLE = 'PenguinShift - Transfer Playlists Between Music Platforms';

export function usePageTitle(title?: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title ? `${title} | PenguinShift` : DEFAULT_TITLE;
    
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}

