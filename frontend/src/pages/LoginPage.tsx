import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, GraduationCap, AlertCircle, Loader2 } from 'lucide-react';

interface LoginPageProps {
  navigate: (route: string) => void;
}

declare global {
  interface Window {
    google?: any;
  }
}

export const LoginPage: React.FC<LoginPageProps> = ({ navigate }) => {
  const { isAuthenticated, allowedDomain, loginGoogle } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // If already authenticated, redirect to /timer
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/timer');
    }
  }, [isAuthenticated, navigate]);

  // Load and initialize Google Identity Services script
  useEffect(() => {
    let isCancelled = false;

    const renderGoogleButton = () => {
      const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!window.google?.accounts?.id || !googleClientId) return;

      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response: any) => {
            if (response?.credential && !isCancelled) {
              try {
                setIsSubmitting(true);
                setErrorMsg(null);
                await loginGoogle(response.credential);
                navigate('/timer');
              } catch (err: any) {
                if (!isCancelled) {
                  setErrorMsg(err.message || 'Google authentication failed.');
                }
              } finally {
                if (!isCancelled) {
                  setIsSubmitting(false);
                }
              }
            }
          },
        });

        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(containerRef.current, {
            theme: 'filled_black',
            size: 'large',
            shape: 'rectangular',
            text: 'signin_with',
            width: 320,
          });
        }
      } catch (err) {
        console.error('Failed to initialize Google Sign-in button:', err);
      }
    };

    if (window.google?.accounts?.id) {
      renderGoogleButton();
    } else {
      const scriptId = 'google-identity-client-script';
      let script = document.getElementById(scriptId) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
      }
      script.addEventListener('load', renderGoogleButton);
    }

    return () => {
      isCancelled = true;
    };
  }, [loginGoogle, navigate]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Architectural Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ink-900 border border-ink-800 text-xs font-mono text-ink-300">
            <GraduationCap className="w-3.5 h-3.5 text-signal" />
            <span>AHMEDABAD UNIVERSITY</span>
          </div>
          <h1 className="text-3xl font-display font-black tracking-tight text-white uppercase">
            SANCTUM
          </h1>
          <p className="text-xs sm:text-sm text-ink-400 max-w-xs mx-auto">
            University Library Focus Challenge. Put away distractions and log unbroken focus sessions.
          </p>
        </div>

        {/* Verification Requirements Card */}
        <div className="p-4 rounded-xl bg-ink-900/60 border border-ink-800 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-signal shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-semibold text-ink-200">
              Verified University Email Required
            </div>
            <div className="text-ink-400 leading-relaxed">
              Only verified university accounts with the domain <strong className="text-white font-mono">@{allowedDomain}</strong> can enter the challenge and record scores.
            </div>
          </div>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Google OAuth Button Container */}
        <div className="p-6 rounded-2xl bg-ink-900/80 border border-ink-800 space-y-4 shadow-xl flex flex-col items-center justify-center">
          <div className="text-xs text-ink-400 font-mono uppercase tracking-wider text-center">
            Sign in with Ahmedabad University Account
          </div>

          <div className="w-full flex flex-col items-center justify-center min-h-[44px]">
            {isSubmitting ? (
              <div className="flex items-center gap-2 text-sm text-ink-300 font-mono py-2">
                <Loader2 className="w-4 h-4 animate-spin text-signal" />
                <span>Authorizing university session...</span>
              </div>
            ) : (
              <div ref={containerRef} id="google-signin-btn-container" className="min-h-[44px] flex justify-center" />
            )}
          </div>

          <div className="text-[11px] text-ink-500 text-center leading-relaxed">
            Name is derived automatically from your university email ID (e.g. <span className="font-mono text-ink-300">bhumika.j</span>).
          </div>
        </div>
      </div>
    </div>
  );
};
