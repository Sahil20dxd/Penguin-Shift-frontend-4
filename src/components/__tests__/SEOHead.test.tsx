import { render } from '@testing-library/react';
import { SEOHead } from '../SEOHead';

describe('SEOHead', () => {
  beforeEach(() => {
    // Clear document head before each test
    document.head.innerHTML = '';
    document.title = '';
  });

  it('should set default title and meta tags', () => {
    render(<SEOHead />);

    expect(document.title).toBe('PenguinShift - Transfer Playlists Between Music Platforms');
    
    const description = document.querySelector('meta[name="description"]');
    expect(description?.getAttribute('content')).toContain('Transfer your music playlists');
  });

  it('should set custom title', () => {
    render(<SEOHead title="Custom Page Title" />);
    expect(document.title).toBe('Custom Page Title');
  });

  it('should set custom description', () => {
    render(<SEOHead description="Custom description" />);
    
    const description = document.querySelector('meta[name="description"]');
    expect(description?.getAttribute('content')).toBe('Custom description');
  });

  it('should set Open Graph tags', () => {
    render(<SEOHead title="OG Title" description="OG Description" />);
    
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    
    expect(ogTitle?.getAttribute('content')).toBe('OG Title');
    expect(ogDescription?.getAttribute('content')).toBe('OG Description');
  });

  it('should set Twitter Card tags', () => {
    render(<SEOHead title="Twitter Title" description="Twitter Description" />);
    
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    
    expect(twitterTitle?.getAttribute('content')).toBe('Twitter Title');
    expect(twitterDescription?.getAttribute('content')).toBe('Twitter Description');
  });

  it('should set canonical URL', () => {
    // Test with explicit URL prop to avoid window.location issues
    render(<SEOHead url="https://example.com/page" />);
    
    const canonical = document.querySelector('link[rel="canonical"]');
    expect(canonical?.getAttribute('href')).toBe('https://example.com/page');
  });

  it('should update meta tags when props change', () => {
    const { rerender } = render(<SEOHead title="Initial Title" />);
    expect(document.title).toBe('Initial Title');

    rerender(<SEOHead title="Updated Title" />);
    expect(document.title).toBe('Updated Title');
  });

  it('should set custom image', () => {
    render(<SEOHead image="/custom-image.png" />);
    
    const ogImage = document.querySelector('meta[property="og:image"]');
    expect(ogImage?.getAttribute('content')).toBe('/custom-image.png');
  });

  it('should set custom URL', () => {
    render(<SEOHead url="https://example.com/custom" />);
    
    const ogUrl = document.querySelector('meta[property="og:url"]');
    expect(ogUrl?.getAttribute('content')).toBe('https://example.com/custom');
  });
});

