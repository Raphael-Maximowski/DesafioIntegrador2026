"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, TokenResponse, AuthState } from "@/types/auth";
import { logout as apiLogout } from "@/services/auth";

function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return {};
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,

      login: (tokens: TokenResponse) => {
        const payload = decodeJwtPayload(tokens.accessToken);
        const user: User = {
          id: String(payload.sub ?? ""),
          firstName: String(payload.firstName ?? ""),
          lastName: String(payload.lastName ?? ""),
          email: String(payload.email ?? ""),
          createdAt: new Date().toISOString(),
        };
        set({ tokens, user, isAuthenticated: true });
      },

      logout: async () => {
        try {
          if (get().isAuthenticated) {
            await apiLogout();
          }
        } catch {
          // ignore errors on logout
        } finally {
          set({ tokens: null, user: null, isAuthenticated: false });
        }
      },

      setTokens: (tokens: TokenResponse) => {
        set((state) => ({ ...state, tokens }));
      },
    }),
    {
      name: "datanexus-auth",
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
