"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { ChallengeFeed } from "@/components/ChallengeFeed";
import Header from "@/components/Header";

interface Challenge {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  creator_id: string;
  visibility: "public" | "private" | "invite_only";
  email_domain: string | null;
  starts_at: string;
  ends_at: string;
  claim_deadline: string;
  prize_pool_usdc: number;
  status: string;
  min_entries: number;
  min_positive_deltas: number;
  participant_count: number;
  total_kg_burned: number;
}

interface Participation {
  id: string;
  kg_burned: number;
  entry_count: number;
  reward_usdc: number | null;
  reward_claimed: boolean;
}

type JoinStep = "idle" | "email-input" | "email-sent" | "code-input" | "invite-input" | "joining" | "joined" | "error";

function daysRemaining(dateStr: string): number {
  const end = new Date(dateStr);
  const now = new Date();
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  active: "Active",
  ended: "Ended",
  finalized: "Finalized",
  cancelled: "Cancelled",
};

export default function ChallengeDetailPage({ params }: PageProps) {
  const { user, loading: authLoading } = useAuth();
  const [slug, setSlug] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [participation, setParticipation] = useState<Participation | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [joinStep, setJoinStep] = useState<JoinStep>("idle");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [inviteCodeInput, setInviteCodeInput] = useState("");

  useEffect(() => {
    params.then(({ slug: s }) => setSlug(s));
  }, [params]);

  const fetchChallenge = useCallback(async (challengeSlug: string) => {
    try {
      const res = await fetch(`/api/challenges/${challengeSlug}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Challenge not found");
      }
      const data = await res.json();
      setChallenge(data.challenge);
      setParticipation(data.participation ?? null);
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Failed to load challenge");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (slug) fetchChallenge(slug);
  }, [slug, fetchChallenge]);

  const handleJoinPublic = async () => {
    if (!slug) return;
    setJoinStep("joining");
    setJoinError(null);
    try {
      const res = await fetch(`/api/challenges/${slug}/join`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to join");
      }
      const data = await res.json();
      setParticipation(data.participant);
      setJoinStep("joined");
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "Failed to join");
      setJoinStep("error");
    }
  };

  const handleSendEmailCode = async () => {
    if (!emailInput.trim() || !slug) return;
    setJoinError(null);
    try {
      const res = await fetch("/api/email-verify/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput, slug }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send code");
      }
      setJoinStep("code-input");
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "Failed to send code");
    }
  };

  const handleVerifyEmailCode = async () => {
    if (!codeInput.trim() || !slug) return;
    setJoinStep("joining");
    setJoinError(null);
    try {
      const verifyRes = await fetch("/api/email-verify/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput, code: codeInput }),
      });
      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        throw new Error(data.error || "Invalid code");
      }
      const joinRes = await fetch(`/api/challenges/${slug}/join`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      if (!joinRes.ok) {
        const data = await joinRes.json();
        throw new Error(data.error || "Failed to join");
      }
      const data = await joinRes.json();
      setParticipation(data.participant);
      setJoinStep("joined");
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "Failed to join");
      setJoinStep("error");
    }
  };

  const handleJoinWithInvite = async () => {
    if (!inviteCodeInput.trim() || !slug) return;
    setJoinStep("joining");
    setJoinError(null);
    try {
      const res = await fetch(`/api/challenges/${slug}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite_code: inviteCodeInput.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to join");
      }
      const data = await res.json();
      setParticipation(data.participant);
      setJoinStep("joined");
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "Invalid invite code");
      setJoinStep("error");
    }
  };

  const isCreator = user && challenge && user.id === challenge.creator_id;

  if (loading) {
    return (
      <>
        <Header />
        <div className="challenge-detail page-body">
          <p className="challenge-detail__loading">Loading...</p>
        </div>
      </>
    );
  }

  if (pageError || !challenge || !slug) {
    return (
      <>
        <Header />
        <div className="challenge-detail page-body">
          <p className="challenge-detail__error">{pageError || "Challenge not found"}</p>
          <Link href="/challenges" className="challenge-detail__back">← Back to Challenges</Link>
        </div>
      </>
    );
  }

  const daysLeft = daysRemaining(challenge.ends_at);
  const isActive = challenge.status === "active";
  const isParticipant = !!participation;

  return (
    <>
      <Header />
      <div className="challenge-detail page-body">
        <Link href="/challenges" className="challenge-detail__back">← Challenges</Link>

        <div className="challenge-detail__header">
          <div className="challenge-detail__header-top">
            <div>
              <div className="challenge-detail__badges">
                <span className={`challenge-card__badge challenge-card__badge--status challenge-card__badge--${challenge.status}`}>
                  {STATUS_LABEL[challenge.status] || challenge.status}
                </span>
                <span className="challenge-card__badge challenge-card__badge--visibility">
                  {challenge.visibility === "invite_only" ? "Invite Only" : challenge.visibility.charAt(0).toUpperCase() + challenge.visibility.slice(1)}
                </span>
              </div>
              <h1 className="challenge-detail__title">{challenge.title}</h1>
            </div>
            {isCreator && (
              <Link href={`/challenges/${challenge.slug}/admin`} className="challenge-detail__admin-link" aria-label="Manage this challenge">
                Manage →
              </Link>
            )}
          </div>

          {challenge.description && (
            <p className="challenge-detail__desc">{challenge.description}</p>
          )}

          <div className="challenge-detail__dates">
            <span>{formatDate(challenge.starts_at)} – {formatDate(challenge.ends_at)}</span>
            <span className="challenge-detail__dates-sep">·</span>
            <span>Claims until {formatDate(challenge.claim_deadline)}</span>
          </div>
        </div>

        <div className="challenge-detail__stats">
          <div className="challenge-detail__stat">
            <span className="challenge-detail__stat-value">{challenge.participant_count}</span>
            <span className="challenge-detail__stat-label">participants</span>
          </div>
          <div className="challenge-detail__stat">
            <span className="challenge-detail__stat-value">{Number(challenge.total_kg_burned).toFixed(1)} kg</span>
            <span className="challenge-detail__stat-label">total burned</span>
          </div>
          <div className="challenge-detail__stat">
            <span className="challenge-detail__stat-value">${Number(challenge.prize_pool_usdc).toLocaleString()}</span>
            <span className="challenge-detail__stat-label">prize pool</span>
          </div>
          <div className="challenge-detail__stat">
            <span className="challenge-detail__stat-value">{isActive ? daysLeft : "—"}</span>
            <span className="challenge-detail__stat-label">{isActive ? "days left" : challenge.status}</span>
          </div>
        </div>

        {/* Eligibility note — visible to everyone */}
        <p className="challenge-detail__eligibility">
          Eligibility: {challenge.min_entries} weigh-in{challenge.min_entries !== 1 ? "s" : ""} and {challenge.min_positive_deltas} positive delta{challenge.min_positive_deltas !== 1 ? "s" : ""} required to qualify for rewards.
        </p>

        {/* Participation section */}
        {user && isActive && (
          <div className="challenge-detail__join-section">
            {isParticipant ? (
              <div className="challenge-detail__participant-info">
                <span className="challenge-detail__participant-badge">You&apos;re in!</span>
                <div className="challenge-detail__personal-stats">
                  <div className="challenge-detail__stat">
                    <span className="challenge-detail__stat-value">{Number(participation.kg_burned).toFixed(1)} kg</span>
                    <span className="challenge-detail__stat-label">your burned</span>
                  </div>
                  <div className="challenge-detail__stat">
                    <span className="challenge-detail__stat-value">{participation.entry_count}</span>
                    <span className="challenge-detail__stat-label">your entries</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="challenge-detail__join-flow">
                {/* Public challenge */}
                {challenge.visibility === "public" && joinStep === "idle" && (
                  <button
                    className="challenge-detail__join-btn"
                    onClick={handleJoinPublic}
                    aria-label="Join this challenge"
                  >
                    Join Challenge
                  </button>
                )}

                {/* Private challenge — email verification */}
                {challenge.visibility === "private" && joinStep === "idle" && (
                  <div className="email-verify">
                    <p className="email-verify__label">
                      This challenge requires a verified @{challenge.email_domain} email.
                    </p>
                    <div className="email-verify__row">
                      <input
                        type="email"
                        className="email-verify__input"
                        placeholder={`you@${challenge.email_domain}`}
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        aria-label="Work email address"
                      />
                      <button
                        className="email-verify__btn"
                        onClick={handleSendEmailCode}
                        disabled={!emailInput.trim()}
                        aria-label="Send verification code"
                      >
                        Send Code
                      </button>
                    </div>
                  </div>
                )}

                {challenge.visibility === "private" && joinStep === "code-input" && (
                  <div className="email-verify">
                    <p className="email-verify__label">Enter the 6-digit code sent to {emailInput}</p>
                    <div className="email-verify__row">
                      <input
                        type="text"
                        className="email-verify__input"
                        placeholder="123456"
                        maxLength={6}
                        value={codeInput}
                        onChange={(e) => setCodeInput(e.target.value)}
                        aria-label="Verification code"
                      />
                      <button
                        className="email-verify__btn"
                        onClick={handleVerifyEmailCode}
                        disabled={codeInput.length < 6}
                        aria-label="Verify code and join"
                      >
                        Verify & Join
                      </button>
                    </div>
                  </div>
                )}

                {/* Invite-only challenge */}
                {challenge.visibility === "invite_only" && joinStep === "idle" && (
                  <div className="invite-codes">
                    <p className="invite-codes__label">Enter your invite code to join.</p>
                    <div className="invite-codes__row">
                      <input
                        type="text"
                        className="invite-codes__input"
                        placeholder="XXXXXXXX"
                        maxLength={12}
                        value={inviteCodeInput}
                        onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                        aria-label="Invite code"
                      />
                      <button
                        className="invite-codes__btn"
                        onClick={handleJoinWithInvite}
                        disabled={!inviteCodeInput.trim()}
                        aria-label="Join with invite code"
                      >
                        Join
                      </button>
                    </div>
                  </div>
                )}

                {joinStep === "joining" && (
                  <p className="challenge-detail__join-loading">Joining...</p>
                )}

                {joinStep === "error" && (
                  <div>
                    {joinError && <p className="challenge-detail__join-error">{joinError}</p>}
                    <button
                      className="challenge-detail__join-retry"
                      onClick={() => {
                        setJoinError(null);
                        setJoinStep("idle");
                      }}
                    >
                      Try again
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!user && !authLoading && isActive && (
          <div className="challenge-detail__signin-prompt">
            <p>Sign in to join this challenge.</p>
            <Link href="/profile" className="challenge-detail__signin-btn" aria-label="Sign in to join">
              Sign In →
            </Link>
          </div>
        )}

        {/* Activity feed */}
        <ChallengeFeed slug={challenge.slug} />
      </div>
    </>
  );
}
