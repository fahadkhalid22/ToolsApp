export type FaqCategoryId = "general" | "account-security" | "image-tools" | "pdf-tools" | "ai-tools" | "calculators" | "billing-pro" | "privacy-files";

export const faqCategories = [
  { id: "general", label: "General" },
  { id: "account-security", label: "Account & Security" },
  { id: "image-tools", label: "Image Tools" },
  { id: "pdf-tools", label: "PDF Tools" },
  { id: "ai-tools", label: "AI Tools" },
  { id: "calculators", label: "Calculators" },
  { id: "billing-pro", label: "Billing & Pro" },
  { id: "privacy-files", label: "Privacy & Files" },
] as const satisfies readonly { id: FaqCategoryId; label: string }[];

export const faqItems = [
  { category: "general", question: "What is ToolsApp for?", answer: "ToolsApp brings 15 focused image, PDF, calculator, student, text, developer, utility, and AI workflows into one calm workspace." },
  { category: "general", question: "Do I need an account to use the tools?", answer: "No. The current tools work in a guest workspace. Favorites, history, notification choices, and local profile settings are stored in this browser." },
  { category: "account-security", question: "Is account sign-in connected?", answer: "Not in production yet. The repository has an auth service boundary and a development-only mock, but no persistent production account adapter is currently enabled." },
  { category: "account-security", question: "Can I change a password or enable two-factor authentication?", answer: "No. Password changes, two-factor authentication, and account deletion remain unavailable until a real authentication provider is connected." },
  { category: "image-tools", question: "Where are image files processed?", answer: "The current image workflows run in your browser. Files are not uploaded to a ToolsApp storage service." },
  { category: "image-tools", question: "Why can an output sometimes be larger?", answer: "Changing format, dimensions, or quality can produce a larger file. The result screen reports the actual output size instead of claiming savings that did not occur." },
  { category: "pdf-tools", question: "Does PDF to Word preserve the original design?", answer: "No. PDF to Word extracts page text into a real DOCX document; it does not promise pixel-perfect reconstruction of complex layouts." },
  { category: "pdf-tools", question: "Are PDF files sent to a server?", answer: "The implemented PDF workflows run locally in your browser. Practical page, file-count, memory, and size limits still apply." },
  { category: "ai-tools", question: "Why is AI generation unavailable?", answer: "Live UGC generation requires a server-side OpenAI API key. Without it, ToolsApp shows an unavailable state and never substitutes a fake production script." },
  { category: "ai-tools", question: "How does the AI allowance work?", answer: "When a provider is configured, the current anonymous allowance is a soft limit of three successful generations per UTC day. It is process-memory based, can reset, and is not a billing entitlement." },
  { category: "calculators", question: "Are calculator results professional advice?", answer: "No. Results are informational calculations based on the values and grading scale you enter. Verify decisions that carry academic, financial, medical, or legal consequences." },
  { category: "calculators", question: "How is GPA calculated?", answer: "GPA uses credit-weighted quality points. CGPA uses the semester GPA and credit values you provide; custom scales are validated before calculation." },
  { category: "billing-pro", question: "Is there a paid Pro plan?", answer: "No active paid plan exists. Free is the only current plan, while Pro is labeled as a future direction with no announced price or launch date." },
  { category: "billing-pro", question: "Where can I find invoices or cancel a subscription?", answer: "There are no invoices, saved cards, renewals, or subscriptions to cancel because no payment provider is connected." },
  { category: "privacy-files", question: "What does browser-local history contain?", answer: "History stores minimal tool metadata such as tool ID, time, and opened or completed status. It does not store full file contents, AI briefs, generated scripts, text, or JSON payloads." },
  { category: "privacy-files", question: "Do AI prompts stay on my device?", answer: "No. If live AI generation is configured and you submit a brief, the server sends the validated prompt to the configured AI provider. The request sets provider storage off, but provider processing still occurs." },
] as const satisfies readonly { category: FaqCategoryId; question: string; answer: string }[];

export const supportTopics = [
  { title: "Account help", description: "Understand guest mode, local profiles, and unconfigured production auth.", href: "/faq?category=account-security#account-security", keywords: "login sign in password security profile" },
  { title: "Tool issues", description: "Review practical input limits, errors, retries, and output expectations.", href: "/faq?category=general#general", keywords: "broken error retry output tools" },
  { title: "AI tools", description: "Check provider requirements, prompt handling, and the soft daily allowance.", href: "/faq?category=ai-tools#ai-tools", keywords: "openai ugc generation prompt rate limit" },
  { title: "Billing / Pro", description: "See the real Free plan state and which Pro ideas remain planned.", href: "/pricing", keywords: "price invoice card upgrade subscription" },
  { title: "Privacy & files", description: "Learn what stays in the browser and what AI processing sends onward.", href: "/privacy", keywords: "local storage files upload cookies data" },
  { title: "Report a bug", description: "Open a public issue in the ToolsApp GitHub repository.", href: "https://github.com/fahadkhalid22/ToolsApp/issues/new", keywords: "github problem defect feedback", external: true },
] as const;
