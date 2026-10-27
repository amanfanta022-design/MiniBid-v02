import { useState, useEffect } from 'react';

// Render free services sleep after 15 minutes of inactivity.
// Client-side auto-ping interval: 8.5 minutes (510,000 ms) ensures Render never sleeps when any tab is open.
const PING_INTERVAL_MS = 8.5 * 60 * 1000;
const REFRESH_ON_FOCUS_THRESHOLD_MS = 4 * 60 * 1000;

interface KeepAliveState {
  isActive: boolean;
  lastPingTimestamp: number | null;
  pingCount: number;
  serverUptimeSeconds: number | null;
  status: 'connected' | 'pinging' | 'idle' | 'error';
}

let globalState: KeepAliveState = {
  isActive: true,
  lastPingTimestamp: null,
  pingCount: 0,
  serverUptimeSeconds: null,
  status: 'idle',
};

const listeners = new Set<(state: KeepAliveState) => void>();

function notifyListeners() {
  listeners.forEach(listener => listener({ ...globalState }));
}

/**
 * Pings the server heartbeat endpoint to keep Render server awake and verify connectivity
 */
export async function pingHeartbeat(): Promise<boolean> {
  try {
    globalState.status = 'pinging';
    notifyListeners();

    const response = await fetch('/api/heartbeat', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Client-KeepAlive': 'render-anti-sleep',
      },
      keepalive: true,
    });

    if (response.ok) {
      const data = await response.json();
      globalState.lastPingTimestamp = Date.now();
      globalState.pingCount += 1;
      globalState.serverUptimeSeconds = data.uptime_seconds || null;
      globalState.status = 'connected';
      notifyListeners();
      return true;
    } else {
      globalState.status = 'error';
      notifyListeners();
      return false;
    }
  } catch {
    globalState.status = 'error';
    notifyListeners();
    return false;
  }
}

let isInitialized = false;

export function initKeepAliveEngine(): () => void {
  if (typeof window === 'undefined' || isInitialized) {
    return () => {};
  }
  isInitialized = true;

  const initialTimeout = setTimeout(() => {
    pingHeartbeat();
  }, 3000);

  const intervalId = setInterval(() => {
    pingHeartbeat();
  }, PING_INTERVAL_MS);

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      const now = Date.now();
      if (!globalState.lastPingTimestamp || (now - globalState.lastPingTimestamp) > REFRESH_ON_FOCUS_THRESHOLD_MS) {
        pingHeartbeat();
      }
    }
  };

  const handleWindowFocus = () => {
    const now = Date.now();
    if (!globalState.lastPingTimestamp || (now - globalState.lastPingTimestamp) > REFRESH_ON_FOCUS_THRESHOLD_MS) {
      pingHeartbeat();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('focus', handleWindowFocus);

  return () => {
    clearTimeout(initialTimeout);
    clearInterval(intervalId);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', handleWindowFocus);
  };
}

export function useKeepAliveStatus(): KeepAliveState & { triggerManualPing: () => Promise<boolean> } {
  const [state, setState] = useState<KeepAliveState>({ ...globalState });

  useEffect(() => {
    const listener = (newState: KeepAliveState) => {
      setState(newState);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    ...state,
    triggerManualPing: pingHeartbeat,
  };
}
