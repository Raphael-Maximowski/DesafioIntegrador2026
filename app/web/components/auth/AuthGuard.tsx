"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, setTokens, logout } = useAuthStore();

  // Wait for Zustand persist to rehydrate from localStorage before checking auth.
  // On first render, isAuthenticated is always false (initial state) even if the
  // user has a valid token — the store hasn't read localStorage yet.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [hydrated, isAuthenticated, router]);

  // Listen for token refresh / session expiry events from axios interceptor
  useEffect(() => {
    function onRefreshed(e: Event) {
      setTokens((e as CustomEvent).detail);
    }
    function onExpired() {
      logout();
    }
    window.addEventListener("auth:tokens-refreshed", onRefreshed);
    window.addEventListener("auth:session-expired", onExpired);
    return () => {
      window.removeEventListener("auth:tokens-refreshed", onRefreshed);
      window.removeEventListener("auth:session-expired", onExpired);
    };
  }, [setTokens, logout]);

  // Still hydrating or not authenticated — render nothing (avoid flash)
  if (!hydrated || !isAuthenticated) return null;

  return <>{children}</>;
}
