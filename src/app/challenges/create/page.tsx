"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useChallengeCreate } from "@/hooks/useChallengeCreate";
import Header from "@/components/Header";

type Visibility = "public" | "private" | "invite_only";

interface FormData {
  title: string;
  slug: string;
  description: string;
  visibility: Visibility;
  email_domain: string;
  starts_at: string;
  ends_at: string;
  claim_deadline: string;
  min_entries: number;
  min_positive_deltas: number;
  prize_pool_usdc: string;
}

const STEP_LABELS = ["Info", "Access", "Timing", "Prize Pool"];

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 64);
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function addDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

export default function CreateChallengePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<FormData>({
    title: "",
    slug: "",
    description: "",
    visibility: "public",
    email_domain: "",
    starts_at: todayStr(),
    ends_at: addDays(30),
    claim_deadline: addDays(60),
    min_entries: 3,
    min_positive_deltas: 1,
    prize_pool_usdc: "",
  });

  const prizePoolBigInt = (() => {
    const n = parseFloat(form.prize_pool_usdc);
    if (!n || n <= 0) return BigInt(0);
    return BigInt(Math.floor(n * 1_000_000));
  })();

  const endsAtTimestamp = Math.floor(new Date(form.ends_at).getTime() / 1000);
  const claimDeadlineTimestamp = Math.floor(new Date(form.claim_deadline).getTime() / 1000);

  const { submit: submitOnChain, state: chainState, error: chainError, reset: resetChain } = useChallengeCreate({
    prizePoolUsdc: prizePoolBigInt,
    endsAt: endsAtTimestamp,
    claimDeadline: claimDeadlineTimestamp,
  });

  const handleTitleChange = useCallback((value: string) => {
    setForm((prev) => ({
      ...prev,
      title: value,
      slug: slugify(value),
    }));
  }, []);

  const handleField = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const validateStep = (): string | null => {
    if (step === 0) {
      if (!form.title.trim()) return "Title is required";
      if (!form.slug.trim()) return "Slug is required";
      if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(form.slug) && form.slug.length > 1) {
        return "Slug must contain only lowercase letters, numbers, and hyphens";
      }
    }
    if (step === 1) {
      if (form.visibility === "private" && !form.email_domain.trim()) {
        return "Email domain is required for private challenges";
      }
    }
    if (step === 2) {
      if (!form.starts_at) return "Start date required";
      if (!form.ends_at) return "End date required";
      if (!form.claim_deadline) return "Claim deadline required";
      if (new Date(form.ends_at) <= new Date(form.starts_at)) return "End date must be after start date";
      if (new Date(form.claim_deadline) <= new Date(form.ends_at)) return "Claim deadline must be after end date";
    }
    if (step === 3) {
      if (!form.prize_pool_usdc || parseFloat(form.prize_pool_usdc) <= 0) {
        return "Prize pool amount required";
      }
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) {
      setSubmitError(err);
      return;
    }
    setSubmitError(null);
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setSubmitError(null);
    setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    const err = validateStep();
    if (err) {
      setSubmitError(err);
      return;
    }

    setSubmitError(null);
    setSubmitting(true);
    resetChain();

    try {
      // Step 1: on-chain transaction
      const result = await submitOnChain();
      if (!result) {
        setSubmitting(false);
        return;
      }

      // Step 2: record in DB
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: form.slug,
          title: form.title,
          description: form.description || null,
          visibility: form.visibility,
          email_domain: form.visibility === "private" ? form.email_domain : null,
          starts_at: new Date(form.starts_at).toISOString(),
          ends_at: new Date(form.ends_at).toISOString(),
          claim_deadline: new Date(form.claim_deadline).toISOString(),
          prize_pool_usdc: parseFloat(form.prize_pool_usdc),
          pool_tx_hash: result.txHash,
          contract_challenge_id: result.contractChallengeId,
          min_entries: form.min_entries,
          min_positive_deltas: form.min_positive_deltas,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create challenge");
      }

      router.push(`/challenges/${form.slug}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to create challenge");
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <>
        <Header />
        <div className="challenge-create page-body">
          <p className="challenge-create__auth-prompt">Sign in to create a challenge.</p>
          <Link href="/profile" className="challenge-create__signin-btn" aria-label="Sign in">
            Sign In →
          </Link>
        </div>
      </>
    );
  }

  const isChainPending = chainState === "pending" || chainState === "confirming" || chainState === "verifying";
  const chainLabel: Record<string, string> = {
    pending: "Preparing...",
    confirming: "Confirm in wallet...",
    verifying: "Verifying on-chain...",
  };

  return (
    <>
      <Header />
      <div className="challenge-create page-body">
        <h1 className="challenge-create__title">Create Challenge</h1>

        {/* Progress indicator */}
        <div className="challenge-create__progress" aria-label="Form progress">
          {STEP_LABELS.map((label, index) => (
            <div
              key={label}
              className={`challenge-create__step${index === step ? " challenge-create__step--active" : ""}${index < step ? " challenge-create__step--done" : ""}`}
            >
              <span className="challenge-create__step-num">{index + 1}</span>
              <span className="challenge-create__step-label">{label}</span>
            </div>
          ))}
        </div>

        <div className="challenge-create__form">
          {/* Step 0: Info */}
          {step === 0 && (
            <div className="challenge-create__fields">
              <div className="challenge-create__field">
                <label className="challenge-create__label" htmlFor="cc-title">Title</label>
                <input
                  id="cc-title"
                  type="text"
                  className="challenge-create__input"
                  placeholder="March Burn Challenge"
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  aria-label="Challenge title"
                />
              </div>
              <div className="challenge-create__field">
                <label className="challenge-create__label" htmlFor="cc-slug">
                  Slug <span className="challenge-create__hint">(URL identifier)</span>
                </label>
                <input
                  id="cc-slug"
                  type="text"
                  className="challenge-create__input challenge-create__input--mono"
                  placeholder="march-burn-challenge"
                  value={form.slug}
                  onChange={(e) => handleField("slug", slugify(e.target.value))}
                  aria-label="URL slug"
                />
                <span className="challenge-create__preview">burnfat.fun/challenges/{form.slug || "your-slug"}</span>
              </div>
              <div className="challenge-create__field">
                <label className="challenge-create__label" htmlFor="cc-desc">
                  Description <span className="challenge-create__hint">(optional)</span>
                </label>
                <textarea
                  id="cc-desc"
                  className="challenge-create__textarea"
                  placeholder="Describe your challenge..."
                  rows={4}
                  value={form.description}
                  onChange={(e) => handleField("description", e.target.value)}
                  aria-label="Challenge description"
                />
              </div>
            </div>
          )}

          {/* Step 1: Access */}
          {step === 1 && (
            <div className="challenge-create__fields">
              <div className="challenge-create__field">
                <label className="challenge-create__label">Visibility</label>
                <div className="challenge-create__radio-group" role="radiogroup" aria-label="Challenge visibility">
                  {(["public", "private", "invite_only"] as Visibility[]).map((vis) => (
                    <label key={vis} className="challenge-create__radio-label">
                      <input
                        type="radio"
                        name="visibility"
                        value={vis}
                        checked={form.visibility === vis}
                        onChange={() => handleField("visibility", vis)}
                        aria-label={vis === "invite_only" ? "Invite only" : vis.charAt(0).toUpperCase() + vis.slice(1)}
                      />
                      <span className="challenge-create__radio-text">
                        {vis === "public" && "Public — Anyone can join"}
                        {vis === "private" && "Private — Email domain verification required"}
                        {vis === "invite_only" && "Invite Only — Invite code required"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {form.visibility === "private" && (
                <div className="challenge-create__field">
                  <label className="challenge-create__label" htmlFor="cc-domain">Email Domain</label>
                  <input
                    id="cc-domain"
                    type="text"
                    className="challenge-create__input"
                    placeholder="coinbase.com"
                    value={form.email_domain}
                    onChange={(e) => handleField("email_domain", e.target.value.toLowerCase().replace(/^@/, ""))}
                    aria-label="Required email domain"
                  />
                  <span className="challenge-create__hint-text">Participants must verify a @{form.email_domain || "domain.com"} email</span>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Timing */}
          {step === 2 && (
            <div className="challenge-create__fields">
              <div className="challenge-create__field">
                <label className="challenge-create__label" htmlFor="cc-starts">Start Date</label>
                <input
                  id="cc-starts"
                  type="date"
                  className="challenge-create__input"
                  value={form.starts_at}
                  onChange={(e) => handleField("starts_at", e.target.value)}
                  aria-label="Challenge start date"
                />
              </div>
              <div className="challenge-create__field">
                <label className="challenge-create__label" htmlFor="cc-ends">End Date</label>
                <input
                  id="cc-ends"
                  type="date"
                  className="challenge-create__input"
                  value={form.ends_at}
                  onChange={(e) => handleField("ends_at", e.target.value)}
                  aria-label="Challenge end date"
                />
              </div>
              <div className="challenge-create__field">
                <label className="challenge-create__label" htmlFor="cc-deadline">Claim Deadline</label>
                <input
                  id="cc-deadline"
                  type="date"
                  className="challenge-create__input"
                  value={form.claim_deadline}
                  onChange={(e) => handleField("claim_deadline", e.target.value)}
                  aria-label="Reward claim deadline"
                />
                <span className="challenge-create__hint-text">Winners must claim their rewards before this date</span>
              </div>
              <div className="challenge-create__row">
                <div className="challenge-create__field">
                  <label className="challenge-create__label" htmlFor="cc-min-entries">Min Weigh-ins</label>
                  <input
                    id="cc-min-entries"
                    type="number"
                    min={1}
                    max={100}
                    className="challenge-create__input"
                    value={form.min_entries}
                    onChange={(e) => handleField("min_entries", Math.max(1, parseInt(e.target.value) || 1))}
                    aria-label="Minimum weight entries to join"
                  />
                </div>
                <div className="challenge-create__field">
                  <label className="challenge-create__label" htmlFor="cc-min-deltas">Min Positive Deltas</label>
                  <input
                    id="cc-min-deltas"
                    type="number"
                    min={0}
                    max={50}
                    className="challenge-create__input"
                    value={form.min_positive_deltas}
                    onChange={(e) => handleField("min_positive_deltas", Math.max(0, parseInt(e.target.value) || 0))}
                    aria-label="Minimum positive weight loss entries required"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Prize Pool */}
          {step === 3 && (
            <div className="challenge-create__fields">
              <div className="challenge-create__field">
                <label className="challenge-create__label" htmlFor="cc-prize">Prize Pool (USDC)</label>
                <input
                  id="cc-prize"
                  type="number"
                  step="1"
                  min="1"
                  className="challenge-create__input"
                  placeholder="1000"
                  value={form.prize_pool_usdc}
                  onChange={(e) => handleField("prize_pool_usdc", e.target.value)}
                  aria-label="Prize pool amount in USDC"
                />
              </div>
              <div className="challenge-create__summary">
                <div className="challenge-create__summary-row">
                  <span>Challenge</span>
                  <span>{form.title || "Untitled"}</span>
                </div>
                <div className="challenge-create__summary-row">
                  <span>Duration</span>
                  <span>{form.starts_at} – {form.ends_at}</span>
                </div>
                <div className="challenge-create__summary-row">
                  <span>Visibility</span>
                  <span>{form.visibility}</span>
                </div>
                <div className="challenge-create__summary-row challenge-create__summary-row--total">
                  <span>Prize Pool</span>
                  <span>${parseFloat(form.prize_pool_usdc) > 0 ? parseFloat(form.prize_pool_usdc).toLocaleString() : "—"} USDC</span>
                </div>
              </div>
              <p className="challenge-create__on-chain-note">
                One wallet popup will approve + create the prize pool on-chain. Requires USDC on Base.
              </p>

              {(chainError || submitError) && (
                <p className="challenge-create__error">{chainError || submitError}</p>
              )}

              {isChainPending && (
                <p className="challenge-create__chain-state">{chainLabel[chainState] || "Processing..."}</p>
              )}
            </div>
          )}

          {submitError && step < 3 && (
            <p className="challenge-create__error">{submitError}</p>
          )}

          <div className="challenge-create__nav">
            {step > 0 && (
              <button
                type="button"
                className="challenge-create__back-btn"
                onClick={handleBack}
                disabled={submitting || isChainPending}
                aria-label="Go to previous step"
              >
                ← Back
              </button>
            )}
            <div className="challenge-create__nav-right">
              {step < 3 ? (
                <button
                  type="button"
                  className="challenge-create__next-btn"
                  onClick={handleNext}
                  aria-label="Go to next step"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="button"
                  className="challenge-create__submit-btn"
                  onClick={handleSubmit}
                  disabled={submitting || isChainPending}
                  aria-label="Create challenge on-chain"
                >
                  {submitting || isChainPending ? (chainLabel[chainState] || "Creating...") : "Create Challenge"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
