import { useState, useEffect } from 'react';

const DEFAULT_LOGO = '/assets/images/sunfyre_luxury_crest.jpg';
const STORAGE_KEY = 'sunfyre_brand_logo';

let currentGlobalLogo: string = typeof window !== 'undefined'
  ? (localStorage.getItem(STORAGE_KEY) || DEFAULT_LOGO)
  : DEFAULT_LOGO;

export function getBrandLogo(): string {
  return currentGlobalLogo;
}

export function setBrandLogo(url: string): void {
  currentGlobalLogo = url;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, url);
    window.dispatchEvent(new CustomEvent('brand_logo_changed', { detail: url }));
  }
}

export function resetBrandLogo(): void {
  currentGlobalLogo = DEFAULT_LOGO;
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('brand_logo_changed', { detail: DEFAULT_LOGO }));
  }
}

// Fetch the current server-authoritative brand logo
export async function syncBrandLogoFromServer(): Promise<string> {
  try {
    const res = await fetch('/api/brand/logo');
    if (res.ok) {
      const data = await res.json();
      if (data.logoUrl && data.logoUrl !== currentGlobalLogo) {
        setBrandLogo(data.logoUrl);
        return data.logoUrl;
      }
    }
  } catch {
    // Network fallback
  }
  return currentGlobalLogo;
}

export function useBrandLogo(): {
  logoUrl: string;
  isCustom: boolean;
  uploadCustomLogo: (file: File) => Promise<boolean>;
  resetToDefault: () => Promise<boolean>;
} {
  const [logoUrl, setLogoUrl] = useState<string>(currentGlobalLogo);
  const isCustom = logoUrl !== DEFAULT_LOGO && !logoUrl.includes('sunfyre_luxury_crest');

  useEffect(() => {
    // 1. Initial sync from server on mount
    syncBrandLogoFromServer();

    // 2. Listen for local change events
    const handleLogoChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setLogoUrl(customEvent.detail || currentGlobalLogo);
    };

    window.addEventListener('brand_logo_changed', handleLogoChange);

    // 3. Periodic synchronization so all connected users/admins get real-time updates
    const pollInterval = setInterval(() => {
      syncBrandLogoFromServer();
    }, 4000);

    // 4. Sync on window focus
    const handleFocus = () => {
      syncBrandLogoFromServer();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('brand_logo_changed', handleLogoChange);
      window.removeEventListener('focus', handleFocus);
      clearInterval(pollInterval);
    };
  }, []);

  const uploadCustomLogo = async (file: File): Promise<boolean> => {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;

        try {
          const token = localStorage.getItem('minibid_token');
          if (!token) {
            resolve(false);
            return;
          }

          const res = await fetch('/api/brand/logo', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ dataUrl: base64 }),
          });

          if (!res.ok) {
            const err = await res.json();
            alert(err.error || 'Failed to upload logo.');
            resolve(false);
            return;
          }

          const data = await res.json();
          const serverUrl = data.logoUrl || base64;
          setBrandLogo(serverUrl);
          setLogoUrl(serverUrl);
          resolve(true);
        } catch (err: any) {
          alert('Network error while uploading brand logo.');
          resolve(false);
        }
      };
      reader.onerror = () => resolve(false);
      reader.readAsDataURL(file);
    });
  };

  const resetToDefault = async (): Promise<boolean> => {
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
      resetBrandLogo();
      setLogoUrl(DEFAULT_LOGO);
      return true;
    } catch {
      resetBrandLogo();
      setLogoUrl(DEFAULT_LOGO);
      return false;
    }
  };

  return { logoUrl, isCustom, uploadCustomLogo, resetToDefault };
}
