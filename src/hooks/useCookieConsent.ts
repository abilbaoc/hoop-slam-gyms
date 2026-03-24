import { useState, useCallback } from 'react';

const STORAGE_KEY = 'gdpr_consent';
const CONSENT_VERSION = '1.0';

export interface ConsentPreferences {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
  version: string;
}

function readFromStorage(): ConsentPreferences | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentPreferences;
    if (!parsed.version || !parsed.timestamp) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeToStorage(prefs: ConsentPreferences): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function useCookieConsent() {
  const [consent, setConsent] = useState<ConsentPreferences | null>(() =>
    readFromStorage()
  );

  const hasConsented = consent !== null;

  const updateConsent = useCallback(
    (prefs: Omit<ConsentPreferences, 'necessary' | 'timestamp' | 'version'>) => {
      const updated: ConsentPreferences = {
        necessary: true,
        analytics: prefs.analytics,
        marketing: prefs.marketing,
        timestamp: new Date().toISOString(),
        version: CONSENT_VERSION,
      };
      writeToStorage(updated);
      setConsent(updated);
    },
    []
  );

  const resetConsent = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setConsent(null);
  }, []);

  return {
    consent,
    updateConsent,
    hasConsented,
    resetConsent,
  };
}
