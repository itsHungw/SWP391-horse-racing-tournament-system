import { httpClient } from "./httpClient";
import { LoginResponse } from "../types/auth";

export async function login(data: any): Promise<LoginResponse> {
  const response = await httpClient.post<LoginResponse>("/auth/login", data);
  return response.data;
}

export async function oauthLogin(provider: string, idToken: string): Promise<LoginResponse> {
  const response = await httpClient.post<LoginResponse>(`/auth/oauth/${provider}`, { idToken });
  return response.data;
}

export async function register(data: any): Promise<void> {
  await httpClient.post("/auth/register", data);
}

export async function resendVerificationEmail(email: string): Promise<void> {
  await httpClient.post("/auth/resend-verification-email", { email });
}

export async function verifyEmail(token: string): Promise<void> {
  await httpClient.post("/auth/verify-email", { token });
}

export type ResetPasswordPayload = {
  email: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
};

export type VerifyResetCodePayload = {
  email: string;
  token: string;
};

export async function forgotPassword(email: string): Promise<void> {
  await httpClient.post("/auth/forgot-password", { email });
}

export async function verifyResetCode(data: VerifyResetCodePayload): Promise<void> {
  await httpClient.post("/auth/verify-reset-code", data);
}

export async function resetPassword(data: ResetPasswordPayload): Promise<void> {
  await httpClient.post("/auth/reset-password", data);
}

export async function logoutRemote(): Promise<void> {
  await httpClient.post("/auth/logout");
}
