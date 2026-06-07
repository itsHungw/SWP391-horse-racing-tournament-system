import axios from "axios";

type ApiErrorPayload = {
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
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

  return data?.message || data?.error || fallback;
}
