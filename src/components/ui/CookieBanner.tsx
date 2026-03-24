import { useState } from 'react';
import { X, ChevronUp, ChevronDown, Shield } from 'lucide-react';
import { useCookieConsent } from '../../hooks/useCookieConsent';
import { Link } from 'react-router-dom';

export default function CookieBanner() {
  const { hasConsented, updateConsent } = useCookieConsent();
  const [expanded, setExpanded] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(false);

  if (hasConsented) return null;

  function handleAcceptAll() {
    updateConsent({ analytics: true, marketing: true });
  }

  function handleRejectAll() {
    updateConsent({ analytics: false, marketing: false });
  }

  function handleSavePreferences() {
    updateConsent({ analytics: analyticsEnabled, marketing: marketingEnabled });
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{ borderTop: '3px solid #7BFF00' }}
    >
      <div className="bg-[#1C1C1E] px-4 py-4 md:px-8">
        <div className="max-w-screen-xl mx-auto">

          {/* Main row */}
          <div className="flex flex-col md:flex-row md:items-start gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <Shield size={18} className="text-[#7BFF00] mt-0.5 shrink-0" />
              <p className="text-white text-sm leading-relaxed">
                Usamos cookies propias y de terceros para mejorar tu experiencia y analizar el uso del servicio.
                Puedes aceptarlas, rechazarlas o personalizar tus preferencias. Más info en nuestra{' '}
                <Link
                  to="/privacy"
                  className="text-[#7BFF00] underline underline-offset-2 hover:opacity-80 transition-opacity"
                >
                  política de privacidad
                </Link>
                .
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                onClick={handleRejectAll}
                className="px-4 py-2 text-sm font-medium text-[#8E8E93] bg-transparent border border-[#3C3C3E] rounded-xl hover:border-[#7BFF00] hover:text-white transition-colors duration-150 cursor-pointer"
              >
                Rechazar todo
              </button>
              <button
                onClick={() => setExpanded((v) => !v)}
                className="px-4 py-2 text-sm font-medium text-white bg-[#2C2C2E] border border-[#3C3C3E] rounded-xl hover:bg-[#3C3C3E] transition-colors duration-150 cursor-pointer inline-flex items-center gap-1.5"
              >
                Personalizar
                {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 text-sm font-semibold text-black bg-[#7BFF00] rounded-xl hover:bg-[#6AEF00] active:bg-[#5ADE00] transition-colors duration-150 cursor-pointer"
              >
                Aceptar todo
              </button>
            </div>
          </div>

          {/* Expandable preferences panel */}
          {expanded && (
            <div className="mt-4 border-t border-[#2C2C2E] pt-4 space-y-3">
              {/* Necessary — always on */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">Cookies necesarias</p>
                  <p className="text-[#8E8E93] text-xs mt-0.5 leading-relaxed">
                    Imprescindibles para el funcionamiento de la plataforma. No pueden desactivarse.
                  </p>
                </div>
                <div className="shrink-0 flex items-center">
                  <span className="text-xs text-[#8E8E93] mr-2">Siempre activas</span>
                  <div className="w-10 h-5 rounded-full bg-[#7BFF00] flex items-center justify-end px-0.5 opacity-50 cursor-not-allowed">
                    <div className="w-4 h-4 rounded-full bg-black" />
                  </div>
                </div>
              </div>

              {/* Analytics */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">Cookies analíticas</p>
                  <p className="text-[#8E8E93] text-xs mt-0.5 leading-relaxed">
                    Nos permiten medir el uso del servicio y mejorar su rendimiento (Google Analytics, Mixpanel).
                  </p>
                </div>
                <button
                  role="switch"
                  aria-checked={analyticsEnabled}
                  onClick={() => setAnalyticsEnabled((v) => !v)}
                  className={`shrink-0 w-10 h-5 rounded-full flex items-center px-0.5 transition-colors duration-200 cursor-pointer ${
                    analyticsEnabled ? 'justify-end bg-[#7BFF00]' : 'justify-start bg-[#3C3C3E]'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full transition-colors duration-200 ${analyticsEnabled ? 'bg-black' : 'bg-[#8E8E93]'}`} />
                </button>
              </div>

              {/* Marketing */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">Cookies de marketing</p>
                  <p className="text-[#8E8E93] text-xs mt-0.5 leading-relaxed">
                    Utilizadas para mostrarte publicidad relevante y medir la eficacia de campañas (Meta Pixel, Google Ads).
                  </p>
                </div>
                <button
                  role="switch"
                  aria-checked={marketingEnabled}
                  onClick={() => setMarketingEnabled((v) => !v)}
                  className={`shrink-0 w-10 h-5 rounded-full flex items-center px-0.5 transition-colors duration-200 cursor-pointer ${
                    marketingEnabled ? 'justify-end bg-[#7BFF00]' : 'justify-start bg-[#3C3C3E]'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full transition-colors duration-200 ${marketingEnabled ? 'bg-black' : 'bg-[#8E8E93]'}`} />
                </button>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={handleSavePreferences}
                  className="px-5 py-2 text-sm font-semibold text-black bg-[#7BFF00] rounded-xl hover:bg-[#6AEF00] active:bg-[#5ADE00] transition-colors duration-150 cursor-pointer"
                >
                  Guardar preferencias
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
