import { apiClient, logoutRequest, refreshAccessToken } from "@/api/http";
import { useAuthStore } from "@/stores/authStore";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "farmer" | "mandi_owner";
  profile_picture?: string;
}

export interface GoogleLoginResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export async function googleLogin(
  token: string,
  role: "farmer" | "mandi_owner"
): Promise<GoogleLoginResponse> {
  const res = await apiClient.post("/api/auth/google", { token, role });
  const data: GoogleLoginResponse = res.data;

  if (data.access_token && data.user) {
    const auth = useAuthStore.getState().auth;
    auth.setSession({
      user: {
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.name,
        role: data.user.role,
      },
      accessToken: data.access_token,
      refreshToken: "cookie", // Refresh token is HttpOnly cookie
    });
  }

  return data;
}

export async function fetchMe() {
  try {
    const res = await apiClient.get("/api/auth/me");
    return res.data;
  } catch (err: any) {
    if (err?.response?.status === 401) {
      try {
        const newTok = await refreshAccessToken();
        if (newTok) {
          const res2 = await apiClient.get("/api/auth/me");
          return res2.data;
        }
      } catch {
        /* ignore */
      }
    }
    throw err;
  }
}

export async function logout() {
  await logoutRequest();
  const auth = useAuthStore.getState().auth;
  auth.reset();
}
