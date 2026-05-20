import { httpClient } from "./httpClient";
import { LoginResponse } from "../types/auth";

export async function login(data: any): Promise<LoginResponse> {
  const response = await httpClient.post<LoginResponse>("/auth/login", data);
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
