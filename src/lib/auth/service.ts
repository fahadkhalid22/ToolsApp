import { createAuthError } from "./errors";
import type {
  AuthResult,
  AuthService,
  AuthSession,
  SignInInput,
  SignUpInput,
} from "./types";

const wait = (milliseconds = 650) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const unavailable = async <T>(): Promise<AuthResult<T>> => ({
  ok: false,
  error: createAuthError("not_configured"),
});

const unconfiguredAuthService: AuthService = {
  signIn: () => unavailable<AuthSession>(),
  signUp: () => unavailable<{ verificationRequired: boolean }>(),
  signInWithGoogle: () => unavailable<undefined>(),
  requestPasswordReset: () => unavailable<undefined>(),
  updatePassword: () => unavailable<undefined>(),
  resendVerification: () => unavailable<undefined>(),
  signOut: () => unavailable<undefined>(),
  getSession: async () => ({ ok: true, data: null }),
};

function emailDrivenError(email: string) {
  const normalized = email.toLowerCase();
  if (normalized.includes("wrong")) return createAuthError("invalid_credentials");
  if (normalized.includes("unverified")) return createAuthError("email_unverified");
  if (normalized.includes("locked")) return createAuthError("rate_limited");
  if (normalized.includes("offline")) return createAuthError("service_unavailable");
  if (normalized.includes("existing")) return createAuthError("email_in_use");
  return undefined;
}

const mockAuthService: AuthService = {
  async signIn(input: SignInInput): Promise<AuthResult<AuthSession>> {
    await wait();
    const error = emailDrivenError(input.email);
    if (error) return { ok: false, error };
    return {
      ok: true,
      data: {
        user: { id: "development-user", email: input.email.trim() },
      },
    };
  },
  async signUp(input: SignUpInput) {
    await wait();
    const error = emailDrivenError(input.email);
    if (error?.code === "email_in_use") return { ok: false as const, error };
    return { ok: true as const, data: { verificationRequired: true } };
  },
  async signInWithGoogle() {
    await wait(400);
    return { ok: false as const, error: createAuthError("not_configured") };
  },
  async requestPasswordReset() {
    await wait();
    return { ok: true as const, data: undefined };
  },
  async updatePassword() {
    await wait();
    return { ok: true as const, data: undefined };
  },
  async resendVerification() {
    await wait(450);
    return { ok: true as const, data: undefined };
  },
  async signOut() {
    await wait(250);
    return { ok: true as const, data: undefined };
  },
  async getSession() {
    return { ok: true as const, data: null };
  },
};

const hasPublicSupabaseConfig = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);
const explicitMockMode =
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_AUTH_MODE === "mock";
const developmentFallback =
  process.env.NODE_ENV === "development" && !hasPublicSupabaseConfig;

export const authService: AuthService =
  explicitMockMode || developmentFallback
    ? mockAuthService
    : unconfiguredAuthService;

export const authRuntime = {
  mode: explicitMockMode || developmentFallback ? "mock" : "unconfigured",
  supabaseConfigured: hasPublicSupabaseConfig,
} as const;
