"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import Header from "@/components/Header";

interface Challenge {
  id: string;
  slug: string;
  title: string;
  status: string;
  participant_count: number;
  total_kg_burned: number;
  prize_pool_usdc: number;
  creator_id: string;
  ends_at: string;
}

interface Participant {
  id: string;
  user_id: string;
  kg_burned: number;
  entry_count: number;
  reward_usdc: number | null;
  reward_claimed: boolean;
  joined_at: string;
  users?: { display_name: string | null; wallet_address: string } | null;
}

interface InviteCode {
  id: string;
  code: string;
  use_count: number;
  max_uses: number;
  created_at: string;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ChallengeAdminPage({ params }: PageProps) {
  const { user } = useAuth();
  const [slug, setSlug] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [generateCount, setGenerateCount] = useState(1);

  useEffect(() => {
    params.then(({ slug: s }) => setSlug(s));
  }, [params]);

  const fetchData = useCallback(async (challengeSlug: string) => {
    setLoading(true);
    setPageError(null);
    try {
      const [challengeRes, inviteRes] = await Promise.all([
        fetch(`/api/challenges/${challengeSlug}`),
        fetch(`/api/challenges/${challengeSlug}/invites`),
      ]);

      if (!challengeRes.ok) {
        const data = await challengeRes.json();
        throw new Error(data.error || "Challenge not found");
      }

      const challengeData = await challengeRes.json();
      setChallenge(challengeData.challenge);

      if (inviteRes.ok) {
        const inviteData = await inviteRes.json();
        setInviteCodes(inviteData.codes || []);
      }

      // Fetch participants via challenge_participants with user info
      try {
        const { createAdminClient } = await import("@/lib/supabase/admin");
        const supabase = createAdminClient();
        const { data: parts } = await supabase
          .from("challenge_participants")
          .select("id, user_id, kg_burned, entry_count, reward_usdc, reward_claimed, joined_at, users(display_name, wallet_address)")
          .eq("challenge_id", challengeData.challenge.id)
          .order("kg_burned", { ascending: false });
        setParticipants((parts as unknown as Participant[]) ?? []);
      } catch {
        setParticipants([]);
      }
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (slug) fetchData(slug);
  }, [slug, fetchData]);

  const handleFinalize = async () => {
    if (!slug) return;
    setActionLoading("finalize");
    setActionError(null);
    try {
      const res = await fetch(`/api/challenges/${slug}/finalize`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Finalize failed");
      }
      await fetchData(slug);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Finalize failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!slug) return;
    if (!confirmCancel) {
      setConfirmCancel(true);
      return;
    }
    setConfirmCancel(false);
    setActionLoading("cancel");
    setActionError(null);
    try {
      const res = await fetch(`/api/challenges/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Cancel failed");
      }
      await fetchData(slug);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Cancel failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerateCodes = async () => {
    if (!slug) return;
    setActionLoading("codes");
    setActionError(null);
    try {
      const res = await fetch(`/api/challenges/${slug}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: generateCount, max_uses: 1 }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate codes");
      }
      const data = await res.json();
      setInviteCodes((prev) => [...(data.codes || []), ...prev]);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to generate codes");
    } finally {
      setActionLoading(null);
    }
  };

  const isCreator = user && challenge && user.id === challenge.creator_id;

  if (loading) {
    return (
      <>
        <Header />
        <div className="challenge-admin page-body">
          <p className="challenge-admin__loading">Loading...</p>
        </div>
      </>
    );
  }

  if (pageError || !challenge || !slug) {
    return (
      <>
        <Header />
        <div className="challenge-admin page-body">
          <p className="challenge-admin__error">{pageError || "Challenge not found"}</p>
          <Link href="/challenges" className="challenge-admin__back">← Challenges</Link>
        </div>
      </>
    );
  }

  if (!isCreator) {
    return (
      <>
        <Header />
        <div className="challenge-admin page-body">
          <p className="challenge-admin__error">You do not have permission to manage this challenge.</p>
          <Link href={`/challenges/${challenge.slug}`} className="challenge-admin__back">← Back to Challenge</Link>
        </div>
      </>
    );
  }

  const isPastEnd = new Date(challenge.ends_at) < new Date();
  const canFinalize = challenge.status === "ended" || (challenge.status === "active" && isPastEnd);
  const canCancel = challenge.status !== "finalized" && challenge.status !== "cancelled";

  return (
    <>
      <Header />
      <div className="challenge-admin page-body">
        <Link href={`/challenges/${challenge.slug}`} className="challenge-admin__back">← {challenge.title}</Link>

        <div className="challenge-admin__header">
          <h1 className="challenge-admin__title">Manage Challenge</h1>
          <span className={`challenge-card__badge challenge-card__badge--status challenge-card__badge--${challenge.status}`}>
            {challenge.status}
          </span>
        </div>

        {/* Stats overview */}
        <div className="challenge-admin__stats">
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
        </div>

        {/* Participants table */}
        <section className="challenge-admin__section">
          <h2 className="challenge-admin__section-title">Participants</h2>
          {participants.length === 0 ? (
            <p className="challenge-admin__empty">No participant data available.</p>
          ) : (
            <div className="challenge-admin__table-wrap">
              <table className="challenge-admin__table">
                <thead>
                  <tr>
                    <th className="challenge-admin__th">Participant</th>
                    <th className="challenge-admin__th">Burned (kg)</th>
                    <th className="challenge-admin__th">Entries</th>
                    <th className="challenge-admin__th">Reward</th>
                    <th className="challenge-admin__th">Claimed</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p) => {
                    const name = p.users?.display_name || (p.users?.wallet_address ? `${p.users.wallet_address.slice(0, 6)}...${p.users.wallet_address.slice(-4)}` : "Anonymous");
                    return (
                      <tr key={p.id} className="challenge-admin__row">
                        <td className="challenge-admin__td">{name}</td>
                        <td className="challenge-admin__td">{Number(p.kg_burned).toFixed(1)}</td>
                        <td className="challenge-admin__td">{p.entry_count}</td>
                        <td className="challenge-admin__td">{p.reward_usdc !== null ? `$${Number(p.reward_usdc).toFixed(2)}` : "—"}</td>
                        <td className="challenge-admin__td">{p.reward_claimed ? "Yes" : "No"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Invite codes (only for active/ended challenges) */}
        {challenge.status !== "finalized" && challenge.status !== "cancelled" ? (
        <section className="challenge-admin__section">
          <h2 className="challenge-admin__section-title">Invite Codes</h2>
          <div className="challenge-admin__generate-row">
            <label className="challenge-admin__generate-label" htmlFor="admin-code-count">
              Count
            </label>
            <input
              id="admin-code-count"
              type="number"
              min={1}
              max={100}
              className="challenge-admin__generate-input"
              value={generateCount}
              onChange={(e) => setGenerateCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
              aria-label="Number of invite codes to generate"
            />
            <button
              className="challenge-admin__generate-btn"
              onClick={handleGenerateCodes}
              disabled={actionLoading === "codes"}
              aria-label="Generate invite codes"
            >
              {actionLoading === "codes" ? "Generating..." : "Generate Codes"}
            </button>
          </div>

          {inviteCodes.length > 0 ? (
            <ul className="challenge-admin__codes" aria-label="Invite codes list">
              {inviteCodes.map((code) => (
                <li key={code.id} className="challenge-admin__code-item">
                  <span className="challenge-admin__code-value">{code.code}</span>
                  <span className="challenge-admin__code-usage">
                    {code.use_count}/{code.max_uses} used
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="challenge-admin__empty">No invite codes generated yet.</p>
          )}
        </section>
        ) : null}

        {/* Actions */}
        <section className="challenge-admin__section">
          <h2 className="challenge-admin__section-title">Actions</h2>
          {actionError && <p className="challenge-admin__action-error">{actionError}</p>}
          <div className="challenge-admin__actions">
            {canFinalize ? (
              <button
                className="challenge-admin__action-btn challenge-admin__action-btn--finalize"
                onClick={handleFinalize}
                disabled={!!actionLoading}
                aria-label="Finalize this challenge and distribute rewards"
              >
                {actionLoading === "finalize" ? "Finalizing..." : "Finalize Challenge"}
              </button>
            ) : challenge.status === "active" && !isPastEnd ? (
              <p className="challenge-admin__action-note">
                Finalize will be available after the challenge ends ({new Date(challenge.ends_at).toLocaleDateString()}).
              </p>
            ) : null}
            {canCancel && (
              <>
                <button
                  className="challenge-admin__action-btn challenge-admin__action-btn--cancel"
                  onClick={handleCancel}
                  disabled={!!actionLoading}
                  aria-label="Cancel this challenge"
                >
                  {actionLoading === "cancel" ? "Cancelling..." : confirmCancel ? "Confirm Cancel" : "Cancel Challenge"}
                </button>
                {confirmCancel && (
                  <p className="challenge-admin__action-warn">Click again to confirm. This cannot be undone.</p>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
