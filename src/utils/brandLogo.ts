import { useState, useEffect } from 'react';

const DEFAULT_LOGO = '/assets/images/sunfyre_luxury_crest.jpg';
const STORAGE_KEY = 'sunfyre_brand_logo';

export function getBrandLogo(): string {
  if (typeof window === 'undefined') return DEFAULT_LOGO;
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_LOGO;
}

export function setBrandLogo(url: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, url);
  window.dispatchEvent(new Event('brand_logo_changed'));
}

export function resetBrandLogo(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event('brand_logo_changed'));
}

export function useBrandLogo(): {
  logoUrl: string;
  isCustom: boolean;
  uploadCustomLogo: (file: File) => Promise<boolean>;
  resetToDefault: () => void;
} {
  const [logoUrl, setLogoUrl] = useState<string>(getBrandLogo());
  const isCustom = logoUrl !== DEFAULT_LOGO;

  useEffect(() => {
    const handleLogoChange = () => {
      setLogoUrl(getBrandLogo());
    };

    window.addEventListener('brand_logo_changed', handleLogoChange);
    return () => window.removeEventListener('brand_logo_changed', handleLogoChange);
  }, []);

  const uploadCustomLogo = async (file: File): Promise<boolean> => {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        setBrandLogo(base64);

        // Also persist to server if authorized as superadmin
        try {
          const token = localStorage.getItem('minibid_token');
          if (token) {
            await fetch('/api/brand/logo', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ dataUrl: base64 }),
            });
          }
        } catch {
          // Local storage is sufficient fallback
        }
        resolve(true);
      };
      reader.onerror = () => resolve(false);
      reader.readAsDataURL(file);
    });
  };

  const resetToDefault = async () => {
    resetBrandLogo();
    try {
      const token = localStorage.getItem('minibid_token');
      if (token) {
        await fetch('/api/brand/logo', {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch {
      // ignore
    }
  };

  return { logoUrl, isCustom, uploadCustomLogo, resetToDefault };
}
