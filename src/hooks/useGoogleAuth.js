import { useCallback, useEffect, useRef } from "react";

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "43310980121-bfl0no7j0279bafitrei856brep713jv.apps.googleusercontent.com";

export function useGoogleAuth({ onSuccess, onError }) {
  const initialized = useRef(false);
  const callbackRef = useRef(null);

  // Keep callbackRef in sync so the stable initialize callback can call latest onSuccess/onError
  useEffect(() => {
    callbackRef.current = { onSuccess, onError };
  }, [onSuccess, onError]);

  // Stable callback passed to Google — never changes reference
  const stableCallback = useCallback((response) => {
    if (response?.credential) {
      callbackRef.current?.onSuccess(response.credential);
    } else {
      callbackRef.current?.onError?.("Google sign-in failed. Please try again.");
    }
  }, []);

  useEffect(() => {
    const init = () => {
      if (initialized.current) return;
      if (!window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: stableCallback,
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: false,
      });

      initialized.current = true;
    };

    if (window.google?.accounts?.id) {
      init();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          init();
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [stableCallback]);

  const triggerGoogleSignIn = useCallback(() => {
    if (!window.google?.accounts?.id) {
      callbackRef.current?.onError?.("Google Sign-In is not available yet. Please wait a moment.");
      return;
    }

    // Make sure initialized before prompting
    if (!initialized.current) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: stableCallback,
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: false,
      });
      initialized.current = true;
    }

    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        callbackRef.current?.onError?.(
          "Google One Tap was blocked by your browser. Try disabling browser extensions or use Chrome without ad-blockers."
        );
      }
    });
  }, [stableCallback]);

  return { triggerGoogleSignIn };
}
