import { publicApi, api } from "@/lib/api";
import type { TokenResponse } from "@/types/auth";

export interface UserResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
}

export async function register(
  firstName: string,
  lastName: string,
  email: string
): Promise<UserResponse> {
  const { data } = await publicApi.post<UserResponse>("/auth/register", {
    firstName,
    lastName,
    email,
  });
  return data;
}

export async function requestOtp(email: string): Promise<{ detail: string }> {
  const { data } = await publicApi.post<{ detail: string }>(
    "/auth/request-otp",
    { email }
  );
  return data;
}

export async function verifyOtp(
  email: string,
  code: string
): Promise<TokenResponse> {
  const { data } = await publicApi.post<TokenResponse>("/auth/verify-otp", {
    email,
    code,
  });
  return data;
}

export async function refreshTokens(
  refreshToken: string
): Promise<TokenResponse> {
  const { data } = await publicApi.post<TokenResponse>("/auth/refresh", {
    refreshToken,
  });
  return data;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}
