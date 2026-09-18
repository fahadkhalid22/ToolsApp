export type FieldErrors<T extends string> = Partial<Record<T, string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string) {
  const value = email.trim();
  if (!value) return "Enter your email address.";
  if (!emailPattern.test(value)) return "Enter a valid email address.";
  return undefined;
}

export function validatePassword(password: string, mode: "current" | "new" = "current") {
  if (!password) return "Enter your password.";
  if (mode === "new" && password.length < 8) {
    return "Use at least 8 characters.";
  }
  return undefined;
}

export function validateName(name: string, label: string) {
  if (!name.trim()) return `Enter your ${label.toLowerCase()}.`;
  if (name.trim().length < 2) return `${label} must be at least 2 characters.`;
  return undefined;
}

export function validatePasswordConfirmation(password: string, confirmation: string) {
  if (!confirmation) return "Confirm your password.";
  if (password !== confirmation) return "Passwords do not match.";
  return undefined;
}
