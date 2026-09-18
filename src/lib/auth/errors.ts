import type { AuthError, AuthErrorCode } from "./types";

const safeMessages: Record<AuthErrorCode, string> = {
  invalid_credentials: "The email or password you entered is incorrect.",
  email_unverified: "Verify your email before signing in.",
  rate_limited: "Too many attempts. Please wait a moment and try again.",
  service_unavailable: "We could not reach the authentication service. Try again shortly.",
  email_in_use: "An account with this email already exists. Try signing in instead.",
  invalid_token: "This link is not valid. Request a new email to continue.",
  expired_token: "This link has expired. Request a new email to continue.",
  not_configured: "Authentication is not connected yet. Please try again later.",
  unknown: "Something went wrong. Please try again.",
};

export function createAuthError(code: AuthErrorCode): AuthError {
  return { code, message: safeMessages[code] };
}

export function mapAuthProviderError(error: unknown): AuthError {
  if (!error || typeof error !== "object") return createAuthError("unknown");

  const candidate = error as { code?: unknown; status?: unknown };
  const code = typeof candidate.code === "string" ? candidate.code : "";
  const status = typeof candidate.status === "number" ? candidate.status : 0;

  if (code.includes("invalid_credentials")) {
    return createAuthError("invalid_credentials");
  }
  if (code.includes("email_not_confirmed")) {
    return createAuthError("email_unverified");
  }
  if (code.includes("over_email_send_rate_limit") || status === 429) {
    return createAuthError("rate_limited");
  }
  if (code.includes("user_already_exists")) {
    return createAuthError("email_in_use");
  }
  if (status >= 500) return createAuthError("service_unavailable");

  return createAuthError("unknown");
}
