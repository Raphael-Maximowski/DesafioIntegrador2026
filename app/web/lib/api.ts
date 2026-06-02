import axios from "axios";

const BASE_URL =
  process.env.NEXT_PUBLIC_NEST_API ?? "http://localhost:3001/api";

export const publicApi = axios.create({ baseURL: BASE_URL });

export const api = axios.create({ baseURL: BASE_URL });

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((p) => {
    if (error) {
      p.reject(error);
    } else {
      p.resolve(token!);
    }
  });
  failedQueue = [];
}

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("datanexus-auth");
      if (stored) {
        const { state } = JSON.parse(stored) as {
          state: { tokens?: { accessToken: string } };
        };
        if (state?.tokens?.accessToken) {
          config.headers.Authorization = `Bearer ${state.tokens.accessToken}`;
        }
      }
    } catch {
      // ignore parse errors
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const stored = localStorage.getItem("datanexus-auth");
      if (!stored) throw new Error("no tokens");

      const { state } = JSON.parse(stored) as {
        state: { tokens?: { refreshToken: string } };
      };
      const refreshToken = state?.tokens?.refreshToken;
      if (!refreshToken) throw new Error("no refresh token");

      const { data } = await publicApi.post<{
        accessToken: string;
        refreshToken: string;
      }>("/auth/refresh", { refreshToken });

      // Update stored tokens via a custom event so authStore can react
      window.dispatchEvent(
        new CustomEvent("auth:tokens-refreshed", { detail: data })
      );

      processQueue(null, data.accessToken);
      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(original);
    } catch (refreshError) {
      processQueue(refreshError, null);
      window.dispatchEvent(new Event("auth:session-expired"));
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
