"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, setTokens, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  // Listen for token refresh events from the axios interceptor
  useEffect(() => {
    function onRefreshed(e: Event) {
      const tokens = (e as CustomEvent).detail;
      setTokens(tokens);
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

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
