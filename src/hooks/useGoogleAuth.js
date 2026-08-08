import { useEffect, useRef } from "react";

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "43310980121-bfl0no7j0279bafitrei856brep713jv.apps.googleusercontent.com";

export function useGoogleAuth({ onSuccess, onError }) {
  const initialized = useRef(false);

  // Helper to remove any open Google Sign-In overlay modal
  const closeGoogleOverlay = () => {
    const overlay = document.getElementById("g-signin-overlay");
    if (overlay) overlay.remove();
  };

  useEffect(() => {
    const init = () => {
      if (initialized.current || window.__pharmaCareGoogleAuthInitialized) return;
      if (!window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          closeGoogleOverlay();
          if (response?.credential) {
            onSuccess(response.credential);
          } else {
            onError?.("Google sign-in failed. Please try again.");
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      initialized.current = true;
      window.__pharmaCareGoogleAuthInitialized = true;
    };

    // GIS script may already be loaded (async defer)
    if (window.google?.accounts?.id) {
      init();
    } else {
      // Poll until script loads (max ~5s)
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          init();
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [onSuccess, onError]);

  // Secure postMessage communication between popup windows and parent window
  useEffect(() => {
    const handlePopupMessage = (event) => {
      // Strict origin check to prevent cross-site request forgery
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === "GOOGLE_AUTH_SUCCESS" && event.data?.credential) {
        closeGoogleOverlay();
        onSuccess(event.data.credential);
      }
    };

    window.addEventListener("message", handlePopupMessage);
    return () => window.removeEventListener("message", handlePopupMessage);
  }, [onSuccess]);

  const triggerGoogleSignIn = () => {
    closeGoogleOverlay();

    if (!window.google?.accounts?.id) {
      onError?.("Google Sign-In is not available yet. Please wait a moment.");
      return;
    }

    // Re-initialize to ensure the callback is fresh before prompting
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        closeGoogleOverlay();
        if (response?.credential) {
          onSuccess(response.credential);
        } else {
          onError?.("Google sign-in failed. Please try again.");
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
      use_fedcm_for_prompt: false,
    });

    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // One Tap blocked — show a simple message instead of broken renderButton popup
        onError?.(
          "Google One Tap was blocked by your browser. Please allow pop-ups or try a different browser."
        );
      }
    });
  };

  return { triggerGoogleSignIn };
}
