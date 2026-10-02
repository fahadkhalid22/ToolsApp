"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Bell, Check, ChevronRight, CircleCheck, CreditCard, Database, LockKeyhole, Palette, RefreshCw, ShieldCheck, Sparkles, UserRound } from "lucide-react";

import type { AiUsageStatus } from "@/lib/ai/http";
import { clearFavoriteTools, clearToolHistory, updateWorkspaceSettings, useFavoriteToolIds, useToolHistory, useWorkspaceSettings } from "@/lib/discovery/local-state";
import { validateWorkspaceProfile } from "@/lib/discovery/state";

import styles from "./SettingsWorkspace.module.css";

type SettingsTab = "account" | "security" | "appearance" | "notifications" | "privacy" | "billing";

const tabs = [
  { id: "account", label: "Account", icon: UserRound },
  { id: "security", label: "Security", icon: LockKeyhole },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy & Data", icon: ShieldCheck },
  { id: "billing", label: "Billing / Pro", icon: CreditCard },
] as const;

function isUsageStatus(value: unknown): value is AiUsageStatus {
  if (!value || typeof value !== "object") return false;
  const status = value as Partial<AiUsageStatus>;
  return typeof status.configured === "boolean" && typeof status.remaining === "number" && typeof status.limit === "number" && typeof status.softLimit === "boolean";
}

function BillingPanel() {
  const [usageState, setUsageState] = useState<
    | { status: "loading" }
    | { status: "ready"; usage: AiUsageStatus }
    | { status: "error" }
  >({ status: "loading" });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/ai/ugc-script", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const payload: unknown = await response.json();
        if (!response.ok || !payload || typeof payload !== "object" || !("usage" in payload) || !isUsageStatus(payload.usage)) throw new Error("usage unavailable");
        if (!controller.signal.aborted) setUsageState({ status: "ready", usage: payload.usage });
      })
      .catch(() => { if (!controller.signal.aborted) setUsageState({ status: "error" }); });
    return () => controller.abort();
  }, [refreshKey]);

  const allowanceValue = usageState.status === "ready" && usageState.usage.configured
    ? `${usageState.usage.remaining} of ${usageState.usage.limit} remaining`
    : usageState.status === "loading"
      ? "Checking allowance…"
      : usageState.status === "error"
        ? "Allowance unavailable"
        : "AI provider not connected";

  const allowanceDescription = usageState.status === "ready" && usageState.usage.configured
    ? `Successful generations reset daily at ${new Date(usageState.usage.resetAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", timeZoneName: "short" })}. This soft limit is not a paid entitlement.`
    : usageState.status === "loading"
      ? "Loading the current browser session allowance."
      : usageState.status === "error"
        ? "The current allowance could not be loaded. Your plan has not changed."
        : "Live AI generation requires a server provider key. This does not affect access to the other tools.";

  return (
    <section aria-labelledby="billing-heading" className={`${styles.panel} ${styles.billingPanel}`}>
      <div className={styles.panelHeading}>
        <div><span className={styles.eyebrow}>BILLING / PRO</span><h2 className="font-heading" id="billing-heading">Your plan is Free</h2><p>Every current ToolsApp utility is available without a paid subscription.</p></div>
        <span className={styles.planBadge}><CircleCheck aria-hidden="true" size={14} /> Current plan</span>
      </div>

      <div className={styles.billingOverview}>
        <article className={styles.currentPlanCard}>
          <span className={styles.billingLabel}>Current plan</span>
          <strong className="font-heading">Free</strong>
          <p>All 15 current tools are included. No subscription is required.</p>
          <dl className={styles.planFacts}>
            <div><dt>Plan status</dt><dd><span className={styles.statusDot} aria-hidden="true" /> Active</dd></div>
            <div><dt>Subscription</dt><dd>None</dd></div>
            <div><dt>Billing details</dt><dd>Not collected</dd></div>
          </dl>
        </article>

        <article className={styles.allowanceCard} aria-labelledby="allowance-heading">
          <span className={styles.allowanceIcon}><Sparkles aria-hidden="true" size={18} /></span>
          <div aria-live="polite">
            <span className={styles.billingLabel}>AI allowance</span>
            <h3 id="allowance-heading">{allowanceValue}</h3>
            <p>{allowanceDescription}</p>
            {usageState.status === "error" ? <button className={styles.retryButton} onClick={() => { setUsageState({ status: "loading" }); setRefreshKey((key) => key + 1); }} type="button"><RefreshCw aria-hidden="true" size={14} /> Try again</button> : null}
          </div>
        </article>
      </div>

      <div className={styles.billingNotice}>
        <ShieldCheck aria-hidden="true" size={20} />
        <div><strong>No payment information is stored.</strong><p>There are no invoices, saved cards, renewals, charges, or cancellation actions because billing is not connected.</p></div>
      </div>

      <div className={styles.proRow}>
        <div><strong>Pro is planned, not for sale.</strong><p>Review what is available now and which ideas are clearly marked for the future.</p></div>
        <Link href="/pricing">View pricing details <ChevronRight aria-hidden="true" size={16} /></Link>
      </div>
    </section>
  );
}

export function SettingsWorkspace({ initialTab = "account" }: { initialTab?: SettingsTab }) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [draft, setDraft] = useState<Partial<{ displayName: string; email: string }>>({});
  const [errors, setErrors] = useState<Partial<Record<"displayName" | "email", string>>>({});
  const [profileMessage, setProfileMessage] = useState("");
  const [message, setMessage] = useState("");
  const [confirmClear, setConfirmClear] = useState<"history" | "favorites" | null>(null);
  const settings = useWorkspaceSettings();
  const favorites = useFavoriteToolIds();
  const history = useToolHistory();
  const displayName = draft.displayName ?? settings.profile.displayName;
  const email = draft.email ?? settings.profile.email;
  const profileDirty = displayName !== settings.profile.displayName || email !== settings.profile.email;

  function updateProfileField(field: "displayName" | "email", value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setProfileMessage("");
  }

  function discardProfileChanges() {
    setDraft({});
    setErrors({});
    setProfileMessage("");
  }

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateWorkspaceProfile(displayName, email);
    if (result.displayName || result.email) {
      setErrors({ displayName: result.displayName, email: result.email });
      setMessage("");
      return;
    }
    updateWorkspaceSettings({ ...settings, profile: result.value });
    setDraft({});
    setErrors({});
    setProfileMessage("Profile saved on this browser.");
  }

  function clearLocalData(kind: "history" | "favorites") {
    if (confirmClear !== kind) { setConfirmClear(kind); return; }
    if (kind === "history") clearToolHistory(); else clearFavoriteTools();
    setConfirmClear(null);
    setMessage(`${kind === "history" ? "History" : "Favorites"} cleared from this browser.`);
  }

  return (
    <main className={styles.main} id="main-content">
      <header className={styles.header}><div><span className={styles.eyebrow}>YOUR WORKSPACE</span><h1 className="font-heading">Settings</h1><p>Manage browser-local preferences and see which account features are actually connected.</p></div><span className={styles.localBadge}><Database aria-hidden="true" size={15} /> Local workspace</span></header>
      <nav aria-label="Settings sections" className={styles.tabs}>{tabs.map(({ id, label, icon: Icon }) => <button aria-current={activeTab === id ? "page" : undefined} key={id} onClick={() => { setActiveTab(id); setMessage(""); }} type="button"><Icon aria-hidden="true" size={16} /> {label}</button>)}</nav>

      {activeTab === "account" ? (
        <section aria-labelledby="account-heading" className={`${styles.panel} ${styles.profilePanel}`}>
          <div className={styles.panelHeading}>
            <div><span className={styles.eyebrow}>ACCOUNT</span><h2 className="font-heading" id="account-heading">Local profile</h2><p>Choose how this workspace identifies you. These details stay in this browser and do not create an online account.</p></div>
            <span className={styles.avatar}><UserRound aria-hidden="true" size={24} /></span>
          </div>
          <form className={styles.form} noValidate onSubmit={saveProfile}>
            <label htmlFor="profile-display-name">
              <span className={styles.fieldHeading}><span>Display name</span><small>Required · up to 80 characters</small></span>
              <input
                aria-describedby={errors.displayName ? "display-name-error" : "display-name-help"}
                aria-invalid={!!errors.displayName}
                autoComplete="name"
                id="profile-display-name"
                maxLength={80}
                onChange={(event) => updateProfileField("displayName", event.target.value)}
                placeholder="Your workspace name"
                value={displayName}
              />
            </label>
            <span className={styles.fieldHelp} id="display-name-help">Shown only in your local ToolsApp workspace.</span>
            {errors.displayName ? <span className={styles.error} id="display-name-error" role="alert">{errors.displayName}</span> : null}

            <label htmlFor="profile-email">
              <span className={styles.fieldHeading}><span>Contact email</span><small>Optional</small></span>
              <input
                aria-describedby={errors.email ? "profile-email-error" : "profile-email-help"}
                aria-invalid={!!errors.email}
                autoComplete="email"
                id="profile-email"
                inputMode="email"
                maxLength={254}
                onChange={(event) => updateProfileField("email", event.target.value)}
                placeholder="you@example.com"
                type="email"
                value={email}
              />
            </label>
            <span className={styles.fieldHelp} id="profile-email-help">Stored locally for display only. ToolsApp does not send email.</span>
            {errors.email ? <span className={styles.error} id="profile-email-error" role="alert">{errors.email}</span> : null}

            <div className={styles.profileActions}>
              <div aria-live="polite" className={styles.profileStatus} role="status">
                <span className={profileDirty ? styles.unsavedDot : styles.savedDot} aria-hidden="true" />
                {profileDirty ? "Unsaved changes" : profileMessage || "No unsaved changes"}
              </div>
              <div className={styles.actionButtons}>
                <button className={styles.discardButton} disabled={!profileDirty} onClick={discardProfileChanges} type="button">Discard changes</button>
                <button className={styles.primaryButton} disabled={!profileDirty} type="submit">Save profile</button>
              </div>
            </div>
          </form>
        </section>
      ) : null}

      {activeTab === "security" ? <section aria-labelledby="security-heading" className={styles.panel}><div className={styles.panelHeading}><div><span className={styles.eyebrow}>SECURITY</span><h2 className="font-heading" id="security-heading">Account security is not connected</h2><p>The current production auth adapter is unconfigured. Password changes, two-factor authentication, and account deletion are therefore unavailable here.</p></div><span className={styles.stateIcon}><LockKeyhole aria-hidden="true" size={22} /></span></div><div className={styles.callout}><ShieldCheck aria-hidden="true" size={20} /><div><strong>No password is stored by this settings page.</strong><p>Development auth can simulate interface states, but it is not represented as a real account.</p></div><Link href="/login">Open sign in <ChevronRight aria-hidden="true" size={16} /></Link></div></section> : null}

      {activeTab === "appearance" ? <section aria-labelledby="appearance-heading" className={styles.panel}><div className={styles.panelHeading}><div><span className={styles.eyebrow}>APPEARANCE</span><h2 className="font-heading" id="appearance-heading">Light theme</h2><p>ToolsApp currently supports one carefully tuned Sunset Orange light appearance.</p></div><span className={styles.themeSwatch} aria-hidden="true" /></div><div className={styles.readonlyRow}><span><strong>Current appearance</strong><small>Light · Sunset Orange · Sora + Inter</small></span><span className={styles.activePill}><Check aria-hidden="true" size={14} /> Active</span></div></section> : null}

      {activeTab === "notifications" ? <section aria-labelledby="notifications-heading" className={styles.panel}><div className={styles.panelHeading}><div><span className={styles.eyebrow}>NOTIFICATIONS</span><h2 className="font-heading" id="notifications-heading">In-app product updates</h2><p>Control the existing notification drawer and notification page on this browser.</p></div></div><label className={styles.switchRow}><span><strong>Show in-app notifications</strong><small>When off, notification cards and unread counts are hidden. No email or push notifications are sent.</small></span><input checked={settings.inAppNotifications} onChange={(event) => { updateWorkspaceSettings({ ...settings, inAppNotifications: event.target.checked }); setMessage(event.target.checked ? "In-app notifications enabled." : "In-app notifications hidden."); }} type="checkbox" /></label><Link className={styles.textLink} href="/notifications">Review notification center <ChevronRight aria-hidden="true" size={15} /></Link></section> : null}

      {activeTab === "privacy" ? <section aria-labelledby="privacy-heading" className={styles.panel}><div className={styles.panelHeading}><div><span className={styles.eyebrow}>PRIVACY & DATA</span><h2 className="font-heading" id="privacy-heading">Data saved on this browser</h2><p>Favorites, tool history, notification choices, and this local profile use browser storage.</p></div><span className={styles.stateIcon}><Database aria-hidden="true" size={22} /></span></div><div className={styles.dataRows}><div><span><strong>Tool history</strong><small>{history.length} local {history.length === 1 ? "entry" : "entries"}</small></span><button className={confirmClear === "history" ? styles.dangerConfirm : styles.secondaryButton} onClick={() => clearLocalData("history")} type="button">{confirmClear === "history" ? "Confirm clear history" : "Clear history"}</button></div><div><span><strong>Favorites</strong><small>{favorites.length} saved {favorites.length === 1 ? "tool" : "tools"}</small></span><button className={confirmClear === "favorites" ? styles.dangerConfirm : styles.secondaryButton} onClick={() => clearLocalData("favorites")} type="button">{confirmClear === "favorites" ? "Confirm clear favorites" : "Clear favorites"}</button></div></div><div className={styles.inlineLinks}><Link href="/privacy">Privacy policy</Link><Link href="/cookies">Cookie & data handling</Link></div></section> : null}

      {activeTab === "billing" ? <BillingPanel /> : null}
      {activeTab !== "account" ? <div aria-live="polite" className={styles.feedback} role="status">{message ? <p><Check aria-hidden="true" size={16} /> {message}</p> : null}</div> : null}
    </main>
  );
}
