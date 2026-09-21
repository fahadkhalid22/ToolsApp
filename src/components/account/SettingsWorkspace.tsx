"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Bell, Check, ChevronRight, CreditCard, Database, LockKeyhole, Palette, ShieldCheck, UserRound } from "lucide-react";

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
  const [usage, setUsage] = useState<AiUsageStatus | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/ai/ugc-script", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const payload: unknown = await response.json();
        if (!response.ok || !payload || typeof payload !== "object" || !("usage" in payload) || !isUsageStatus(payload.usage)) throw new Error("usage unavailable");
        if (!controller.signal.aborted) setUsage(payload.usage);
      })
      .catch(() => { if (!controller.signal.aborted) setUnavailable(true); });
    return () => controller.abort();
  }, []);

  return (
    <section aria-labelledby="billing-heading" className={styles.panel}>
      <div className={styles.panelHeading}><div><span className={styles.eyebrow}>BILLING / PRO</span><h2 className="font-heading" id="billing-heading">A truthful view of your plan</h2><p>No payment provider or subscription system is connected.</p></div><span className={styles.planBadge}>Free plan</span></div>
      <div className={styles.billingGrid}>
        <article><span>Current plan</span><strong>Free</strong><p>All 15 current tools are available without a subscription.</p></article>
        <article><span>AI allowance</span><strong>{usage?.configured ? `${usage.remaining} / ${usage.limit}` : "Unavailable"}</strong><p>{usage?.configured ? "Successful generations remaining today. This is a soft limit." : unavailable ? "Usage status could not be loaded." : "Live AI generation needs a server provider key."}</p></article>
        <article><span>Billing details</span><strong>Not collected</strong><p>There are no invoices, saved cards, renewals, or cancellation actions.</p></article>
      </div>
      <div className={styles.callout}><ShieldCheck aria-hidden="true" size={20} /><div><strong>Pro is not enabled yet.</strong><p>The Pricing page separates available Free features from clearly labeled planned ideas.</p></div><Link href="/pricing">View pricing <ChevronRight aria-hidden="true" size={16} /></Link></div>
    </section>
  );
}

export function SettingsWorkspace({ initialTab = "account" }: { initialTab?: SettingsTab }) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [draft, setDraft] = useState<Partial<{ displayName: string; email: string }>>({});
  const [errors, setErrors] = useState<Partial<Record<"displayName" | "email", string>>>({});
  const [message, setMessage] = useState("");
  const [confirmClear, setConfirmClear] = useState<"history" | "favorites" | null>(null);
  const settings = useWorkspaceSettings();
  const favorites = useFavoriteToolIds();
  const history = useToolHistory();
  const displayName = draft.displayName ?? settings.profile.displayName;
  const email = draft.email ?? settings.profile.email;

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
    setMessage("Local profile saved on this browser.");
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

      {activeTab === "account" ? <section aria-labelledby="account-heading" className={styles.panel}><div className={styles.panelHeading}><div><span className={styles.eyebrow}>ACCOUNT</span><h2 className="font-heading" id="account-heading">Local profile</h2><p>This label and contact email stay in this browser. They do not create an online account.</p></div><span className={styles.avatar}><UserRound aria-hidden="true" size={24} /></span></div><form className={styles.form} noValidate onSubmit={saveProfile}><label>Display name<input aria-describedby={errors.displayName ? "display-name-error" : undefined} aria-invalid={!!errors.displayName} maxLength={80} onChange={(event) => setDraft((current) => ({ ...current, displayName: event.target.value }))} placeholder="Your workspace name" value={displayName} /></label>{errors.displayName ? <span className={styles.error} id="display-name-error">{errors.displayName}</span> : null}<label>Contact email <small>optional, stored locally</small><input aria-describedby={errors.email ? "profile-email-error" : undefined} aria-invalid={!!errors.email} inputMode="email" maxLength={254} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} placeholder="you@example.com" type="email" value={email} /></label>{errors.email ? <span className={styles.error} id="profile-email-error">{errors.email}</span> : null}<button className={styles.primaryButton} type="submit">Save local profile</button></form></section> : null}

      {activeTab === "security" ? <section aria-labelledby="security-heading" className={styles.panel}><div className={styles.panelHeading}><div><span className={styles.eyebrow}>SECURITY</span><h2 className="font-heading" id="security-heading">Account security is not connected</h2><p>The current production auth adapter is unconfigured. Password changes, two-factor authentication, and account deletion are therefore unavailable here.</p></div><span className={styles.stateIcon}><LockKeyhole aria-hidden="true" size={22} /></span></div><div className={styles.callout}><ShieldCheck aria-hidden="true" size={20} /><div><strong>No password is stored by this settings page.</strong><p>Development auth can simulate interface states, but it is not represented as a real account.</p></div><Link href="/login">Open sign in <ChevronRight aria-hidden="true" size={16} /></Link></div></section> : null}

      {activeTab === "appearance" ? <section aria-labelledby="appearance-heading" className={styles.panel}><div className={styles.panelHeading}><div><span className={styles.eyebrow}>APPEARANCE</span><h2 className="font-heading" id="appearance-heading">Light theme</h2><p>ToolsApp currently supports one carefully tuned Sunset Orange light appearance.</p></div><span className={styles.themeSwatch} aria-hidden="true" /></div><div className={styles.readonlyRow}><span><strong>Current appearance</strong><small>Light · Sunset Orange · Sora + Inter</small></span><span className={styles.activePill}><Check aria-hidden="true" size={14} /> Active</span></div></section> : null}

      {activeTab === "notifications" ? <section aria-labelledby="notifications-heading" className={styles.panel}><div className={styles.panelHeading}><div><span className={styles.eyebrow}>NOTIFICATIONS</span><h2 className="font-heading" id="notifications-heading">In-app product updates</h2><p>Control the existing notification drawer and notification page on this browser.</p></div></div><label className={styles.switchRow}><span><strong>Show in-app notifications</strong><small>When off, notification cards and unread counts are hidden. No email or push notifications are sent.</small></span><input checked={settings.inAppNotifications} onChange={(event) => { updateWorkspaceSettings({ ...settings, inAppNotifications: event.target.checked }); setMessage(event.target.checked ? "In-app notifications enabled." : "In-app notifications hidden."); }} type="checkbox" /></label><Link className={styles.textLink} href="/notifications">Review notification center <ChevronRight aria-hidden="true" size={15} /></Link></section> : null}

      {activeTab === "privacy" ? <section aria-labelledby="privacy-heading" className={styles.panel}><div className={styles.panelHeading}><div><span className={styles.eyebrow}>PRIVACY & DATA</span><h2 className="font-heading" id="privacy-heading">Data saved on this browser</h2><p>Favorites, tool history, notification choices, and this local profile use browser storage.</p></div><span className={styles.stateIcon}><Database aria-hidden="true" size={22} /></span></div><div className={styles.dataRows}><div><span><strong>Tool history</strong><small>{history.length} local {history.length === 1 ? "entry" : "entries"}</small></span><button className={confirmClear === "history" ? styles.dangerConfirm : styles.secondaryButton} onClick={() => clearLocalData("history")} type="button">{confirmClear === "history" ? "Confirm clear history" : "Clear history"}</button></div><div><span><strong>Favorites</strong><small>{favorites.length} saved {favorites.length === 1 ? "tool" : "tools"}</small></span><button className={confirmClear === "favorites" ? styles.dangerConfirm : styles.secondaryButton} onClick={() => clearLocalData("favorites")} type="button">{confirmClear === "favorites" ? "Confirm clear favorites" : "Clear favorites"}</button></div></div><div className={styles.inlineLinks}><Link href="/privacy">Privacy policy</Link><Link href="/cookies">Cookie & data handling</Link></div></section> : null}

      {activeTab === "billing" ? <BillingPanel /> : null}
      <div aria-live="polite" className={styles.feedback} role="status">{message ? <p><Check aria-hidden="true" size={16} /> {message}</p> : null}</div>
    </main>
  );
}
