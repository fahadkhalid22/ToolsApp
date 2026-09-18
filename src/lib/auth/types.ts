export type AuthErrorCode =
  | "invalid_credentials"
  | "email_unverified"
  | "rate_limited"
  | "service_unavailable"
  | "email_in_use"
  | "invalid_token"
  | "expired_token"
  | "not_configured"
  | "unknown";

export type AuthError = {
  code: AuthErrorCode;
  message: string;
};

export type AuthResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: AuthError };

export type AuthUser = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
};

export type AuthSession = {
  user: AuthUser;
};

export type SignInInput = {
  email: string;
  password: string;
  remember?: boolean;
};

export type SignUpInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  preferences: readonly string[];
};

export type AuthService = {
  signIn(input: SignInInput): Promise<AuthResult<AuthSession>>;
  signUp(
    input: SignUpInput,
  ): Promise<AuthResult<{ verificationRequired: boolean }>>;
  signInWithGoogle(): Promise<AuthResult>;
  requestPasswordReset(email: string): Promise<AuthResult>;
  updatePassword(password: string): Promise<AuthResult>;
  resendVerification(email: string): Promise<AuthResult>;
  signOut(): Promise<AuthResult>;
  getSession(): Promise<AuthResult<AuthSession | null>>;
};
