import axios from "axios";
import { useAuthStore } from "@/stores/authStore";

// Preserve empty string from env to avoid duplicating '/api' when using Vite proxy
const rawBase = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
const baseURL = rawBase === undefined ? "http://localhost:8080" : (rawBase || undefined);

export const apiClient = axios.create({
  // If baseURL is undefined, axios will use the request URL as-is (e.g., '/api/...')
  baseURL,
  withCredentials: true,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

let accessToken: string | null = null;

export function setAuthTokens(access: string | null) {
  accessToken = access;
}

export function clearAuthTokens() {
  accessToken = null;
}

apiClient.interceptors.request.use(async (config) => {
  if (accessToken) {
    config.headers = config.headers || {};
    config.headers["Authorization"] = `Bearer ${accessToken}`;
  }
  return config;
});

// Single-flight refresh handling to avoid storm & loops
let activeRefresh: Promise<string | null> | null = null;

apiClient.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original: any = error.config;
    // If no config, or we've already retried, or this request opts out, just reject
    if (!original || original._retry || original._skipAuthRefresh)
      return Promise.reject(error);

    // Don't attempt refresh for auth endpoints themselves to avoid loops
    const url: string = original.url || "";
    if (
      url.includes("/api/auth/refresh") ||
      url.includes("/api/auth/login") ||
      url.includes("/api/auth/verify-2fa")
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      original._retry = true;
      try {
        if (!activeRefresh) {
          activeRefresh = refreshAccessToken().finally(() => {
            activeRefresh = null;
          });
        }
        const newAccess = await activeRefresh;
        if (newAccess) {
          original.headers = original.headers || {};
          original.headers["Authorization"] = `Bearer ${newAccess}`;
          return apiClient(original);
        }
      } catch {
        /* swallow */
      }
    }
    return Promise.reject(error);
  }
);

export async function refreshAccessToken() {
  // Mark this request so the interceptor does not recurse
  const res = await apiClient.post("/api/auth/refresh", undefined, {
    _skipAuthRefresh: true,
  } as any);
  const { access_token } = res.data || {};
  if (access_token) {
    const auth = useAuthStore.getState().auth;
    if (auth.user) {
      auth.setSession({
        user: auth.user,
        accessToken: access_token,
        refreshToken: "cookie",
      });
    } else {
      // No user loaded yet; still set token for subsequent authenticated calls
      setAuthTokens(access_token);
    }
    return access_token;
  }
  return null;
}

export async function logoutRequest() {
  try {
    await apiClient.post("/api/auth/logout");
  } catch {}
}
