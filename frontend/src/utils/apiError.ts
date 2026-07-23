import axios from "axios";

type ApiErrorPayload = {
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
};

const ERROR_MESSAGES: Record<string, string> = {
  "USER_ACCOUNT_DISABLED": "Your account has been disabled. Please contact support for assistance.",
  "INVALID_CREDENTIALS": "The email or password you entered is incorrect.",
  //"EMAIL_NOT_VERIFIED": "Please verify your email address before logging in.",
  "EMAIL_ALREADY_EXISTS": "An account with this email address already exists.",
  "PASSWORD_CONFIRMATION_MISMATCH": "The passwords you entered do not match.",
  "INVALID_PASSWORD_RESET_TOKEN": "The password reset link is invalid or has expired.",
  "EXPIRED_PASSWORD_RESET_TOKEN": "The password reset link has expired. Please request a new one.",
  "LOCKED_PASSWORD_RESET_TOKEN": "Too many attempts. Your password reset is temporarily locked.",
  "INVALID_EMAIL_VERIFICATION_TOKEN": "The email verification link is invalid.",
  "EXPIRED_EMAIL_VERIFICATION_TOKEN": "The email verification link has expired. Please request a new one.",
  "INVALID_GOOGLE_ID_TOKEN": "Failed to authenticate with Google. Please try again.",
  "REFRESH_TOKEN_REQUIRED": "Your session has expired. Please log in again.",
  "INVALID_REFRESH_TOKEN": "Your session is invalid. Please log in again.",
  "REFRESH_TOKEN_EXPIRED": "Your session has expired. Please log in again.",
  "SPECTATOR_ROLE_NOT_CONFIGURED": "Internal system configuration error. Please contact support.",
};

export function getApiErrorMessage(error: unknown, fallback = "Request failed. Please try again.") {
  if (!axios.isAxiosError<ApiErrorPayload>(error)) {
    return fallback;
  }

  const data = error.response?.data;
  const fieldMessages = data?.fieldErrors ? Object.values(data.fieldErrors).filter(Boolean) : [];

  if (fieldMessages.length > 0) {
    return fieldMessages.join(" ");
  }

  const rawMessage = data?.message || data?.error;
  if (rawMessage && ERROR_MESSAGES[rawMessage]) {
    return ERROR_MESSAGES[rawMessage];
  }

  return rawMessage || fallback;
}
