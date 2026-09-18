import styles from "./AuthForm.module.css";

type AuthDividerProps = {
  children?: string;
};

export function AuthDivider({ children = "or continue with" }: AuthDividerProps) {
  return <div className={styles.divider}>{children}</div>;
}
