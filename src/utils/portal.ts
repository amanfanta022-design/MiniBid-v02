import { useState, useEffect } from 'react';

export type PortalMode = 'admin' | 'player';

/**
 * Determines whether current visitor is accessing the dedicated Admin Workstation
 * (e.g., admin.minibid.et, /admin, or ?portal=admin) or the Public Player Site.
 */
export function detectPortal(): PortalMode {
  if (typeof window === 'undefined') return 'player';

  // 1. Hostname detection for production / staging subdomains (e.g., admin.minibid.et, admin.localhost)
  const hostname = window.location.hostname.toLowerCase();
  if (hostname.startsWith('admin.') || hostname.startsWith('admin-')) {
    return 'admin';
  }

  // 2. URL Path detection (e.g. /admin, /admin/radar, /admin/financials)
  const pathname = window.location.pathname.toLowerCase();
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return 'admin';
  }

  // 3. Query parameter for preview / testing (e.g. ?portal=admin)
  const params = new URLSearchParams(window.location.search);
  const portalParam = params.get('portal');
  if (portalParam === 'admin') return 'admin';
  if (portalParam === 'player') return 'player';

  // 4. Session storage override for interactive switching in preview environments
  const storedOverride = sessionStorage.getItem('minibid_portal_mode');
  if (storedOverride === 'admin' || storedOverride === 'player') {
    return storedOverride;
  }

  return 'player';
}

/**
 * Navigate seamlessly between portals without page reload in single-host setups,
 * or via real subdomain redirection in production environments.
 */
export function navigateToPortal(mode: PortalMode) {
  if (typeof window === 'undefined') return;

  const hostname = window.location.hostname.toLowerCase();
  const isDedicatedAdminSubdomain = hostname.startsWith('admin.');

  // If running in production with real subdomains (e.g. admin.minibid.et vs minibid.et / play.minibid.et)
  if (isDedicatedAdminSubdomain && mode === 'player') {
    const playerDomain = hostname.replace(/^admin\./, '');
    const targetUrl = `${window.location.protocol}//${playerDomain}${window.location.port ? ':' + window.location.port : ''}/`;
    window.location.href = targetUrl;
    return;
  } else if (!isDedicatedAdminSubdomain && mode === 'admin' && (hostname.includes('minibid.et') || hostname.includes('minibid.com'))) {
    const adminDomain = `admin.${hostname.replace(/^play\./, '')}`;
    const targetUrl = `${window.location.protocol}//${adminDomain}${window.location.port ? ':' + window.location.port : ''}/`;
    window.location.href = targetUrl;
    return;
  }

  // In single-host / dev / preview environment: update session & push state
  sessionStorage.setItem('minibid_portal_mode', mode);

  if (mode === 'admin') {
    const newPath = window.location.pathname.startsWith('/admin') ? window.location.pathname : '/admin';
    window.history.pushState({}, '', newPath);
  } else {
    const newPath = window.location.pathname.startsWith('/admin') ? '/' : window.location.pathname;
    window.history.pushState({}, '', newPath);
  }

  window.dispatchEvent(new CustomEvent('minibid_portal_change', { detail: { mode } }));
}

/**
 * React hook to observe and control portal mode
 */
export function usePortal() {
  const [portal, setPortal] = useState<PortalMode>(() => detectPortal());

  useEffect(() => {
    const handlePortalChange = () => {
      setPortal(detectPortal());
    };

    window.addEventListener('minibid_portal_change', handlePortalChange);
    window.addEventListener('popstate', handlePortalChange);

    return () => {
      window.removeEventListener('minibid_portal_change', handlePortalChange);
      window.removeEventListener('popstate', handlePortalChange);
    };
  }, []);

  const switchPortal = (mode: PortalMode) => {
    navigateToPortal(mode);
    setPortal(mode);
  };

  const isDedicatedSubdomain = typeof window !== 'undefined' && window.location.hostname.toLowerCase().startsWith('admin.');

  return {
    portal,
    switchPortal,
    isDedicatedSubdomain,
  };
}
