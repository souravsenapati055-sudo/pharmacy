import { useEffect, useRef } from "react";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

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

    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // One Tap was blocked/dismissed — fall back to renderButton approach via popup modal
        const overlay = document.createElement("div");
        overlay.id = "g-signin-overlay";
        overlay.style.cssText =
          "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(15,23,42,0.65);z-index:99999;display:flex;align-items:center;justify-content:center;";

        const card = document.createElement("div");
        card.style.cssText =
          "background:#fff;border-radius:16px;padding:32px;min-width:340px;box-shadow:0 24px 48px rgba(0,0,0,0.2);text-align:center;position:relative;";

        const title = document.createElement("h3");
        title.innerText = "Sign in with Google";
        title.style.cssText = "font-size:18px;font-weight:800;color:#0F172A;margin:0 0 8px 0;";

        const sub = document.createElement("p");
        sub.innerText = "Choose your Google account to continue with PharmaCare";
        sub.style.cssText = "font-size:13px;color:#64748B;margin:0 0 24px 0;";

        const btnContainer = document.createElement("div");
        btnContainer.id = "g-signin-btn-container";
        btnContainer.style.cssText = "display:flex;justify-content:center;margin-bottom:16px;";

        const cancelBtn = document.createElement("button");
        cancelBtn.innerText = "Cancel";
        cancelBtn.style.cssText =
          "border:none;background:none;color:#64748B;font-size:13px;cursor:pointer;padding:8px 16px;";
        cancelBtn.onclick = () => overlay.remove();

        card.appendChild(title);
        card.appendChild(sub);
        card.appendChild(btnContainer);
        card.appendChild(cancelBtn);
        overlay.appendChild(card);
        document.body.appendChild(overlay);

        // Render official Google button inside our modal
        window.google.accounts.id.renderButton(btnContainer, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "signin_with",
          shape: "rectangular",
          logo_alignment: "left",
          width: 280,
        });

        overlay.addEventListener("click", (e) => {
          if (e.target === overlay) overlay.remove();
        });
      }
    });
  };

  return { triggerGoogleSignIn };
}
