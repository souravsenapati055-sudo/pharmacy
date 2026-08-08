function getApiBaseUrl() {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:4000/api";
    }
  }
  return "/api";
}

const API_BASE_URL = getApiBaseUrl();

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

export async function apiRequest(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  }).catch((err) => {
    console.error("Network / fetch error:", err);
    throw new Error(`Unable to connect to the server at ${API_BASE_URL}. Please ensure the backend is running.`);
  });

  return parseResponse(response);
}

export function storeAuthSession({ user, token, rememberMe = false }) {
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("authToken", token);

  if (rememberMe && user?.email) {
    localStorage.setItem("rememberedEmail", user.email);
  } else {
    localStorage.removeItem("rememberedEmail");
  }
}

export function clearAuthSession() {
  localStorage.removeItem("user");
  localStorage.removeItem("authToken");
}
