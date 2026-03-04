"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useClaimReward } from "@/hooks/useClaimReward";

interface Challenge {
  id: string;
  slug: string;
  title: string;
  status: string;
  prize_pool_usdc: number;
  ends_at: string;
}

interface Participation {
  id: string;
  challenge_id: string;
  kg_burned: number;
  entry_count: number;
  reward_usdc: number | null;
  reward_claimed: boolean;
  joined_at: string;
  challenge: Challenge | null;
}

function daysRemaining(dateStr: string): string {
  const end = new Date(dateStr);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / 86400000);
  if (diff <= 0) return "Ended";
  if (diff === 1) return "1 day left";
  return `${diff} days left`;
}

function ClaimButton({ slug, onClaimed }: { slug: string; onClaimed: () => void }) {
  const { claim, state, error } = useClaimReward({ slug, onSuccess: onClaimed });

  const isPending = state === "fetching" || state === "confirming" || state === "verifying";

  const stateLabel: Record<string, string> = {
    fetching: "Fetching proof...",
    confirming: "Confirm in wallet...",
    verifying: "Verifying...",
    success: "Claimed!",
  };

  return (
    <div className="challenges-tab__claim-wrap">
      <button
        className="challenges-tab__claim-btn"
        onClick={claim}
        disabled={isPending || state === "success"}
        aria-label="Claim reward"
      >
        {isPending ? (stateLabel[state] || "Processing...") : state === "success" ? "Claimed!" : "Claim Reward"}
      </button>
      {error && <p className="challenges-tab__claim-error">{error}</p>}
    </div>
  );
}

export function ChallengesTab() {
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchParticipations = useCallback(async () => {
    try {
      const res = await fetch("/api/challenges/my");
      if (!res.ok) {
        if (res.status === 401) {
          setParticipations([]);
          setLoading(false);
          return;
        }
        const data = await res.json();
        throw new Error(data.error || "Failed to load challenges");
      }
      const data = await res.json();
      setParticipations(data.participations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load challenges");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParticipations();
  }, [fetchParticipations]);

  const active = participations.filter((p) => p.challenge?.status === "active");
  const past = participations.filter((p) => {
    const status = p.challenge?.status;
    return status && status !== "active" && status !== "draft";
  });

  if (loading) {
    return (
      <div className="challenges-tab">
        <p className="challenges-tab__loading">Loading challenges...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="challenges-tab">
        <p className="challenges-tab__error">{error}</p>
        <button className="challenges-tab__retry-btn" onClick={() => { setError(null); setLoading(true); fetchParticipations(); }}>
          Retry
        </button>
      </div>
    );
  }

  if (participations.length === 0) {
    return (
      <div className="challenges-tab">
        <p className="challenges-tab__empty">You have not joined any challenges yet.</p>
        <Link href="/challenges" className="challenges-tab__browse-link">
          Browse Challenges →
        </Link>
      </div>
    );
  }

  return (
    <div className="challenges-tab">
      {active.length > 0 && (
        <section className="challenges-tab__section">
          <h3 className="challenges-tab__section-title">Active</h3>
          <ul className="challenges-tab__list" aria-label="Active challenges">
            {active.map((participation) => {
              const challenge = participation.challenge;
              if (!challenge) return null;
              return (
                <li key={participation.id} className="challenges-tab__item">
                  <div className="challenges-tab__item-header">
                    <Link href={`/challenges/${challenge.slug}`} className="challenges-tab__item-title">
                      {challenge.title}
                    </Link>
                    <span className="challenges-tab__badge challenges-tab__badge--active">Active</span>
                  </div>
                  <div className="challenges-tab__item-stats">
                    <span className="challenges-tab__stat">
                      <span className="challenges-tab__stat-value">{Number(participation.kg_burned).toFixed(1)} kg</span>
                      <span className="challenges-tab__stat-label">burned</span>
                    </span>
                    <span className="challenges-tab__stat">
                      <span className="challenges-tab__stat-value">{participation.entry_count}</span>
                      <span className="challenges-tab__stat-label">entries</span>
                    </span>
                    <span className="challenges-tab__stat">
                      <span className="challenges-tab__stat-value">${challenge.prize_pool_usdc.toLocaleString()}</span>
                      <span className="challenges-tab__stat-label">prize pool</span>
                    </span>
                  </div>
                  <p className="challenges-tab__timer">{daysRemaining(challenge.ends_at)}</p>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {past.length > 0 && (
        <section className="challenges-tab__section">
          <h3 className="challenges-tab__section-title">Past</h3>
          <ul className="challenges-tab__list" aria-label="Past challenges">
            {past.map((participation) => {
              const challenge = participation.challenge;
              if (!challenge) return null;
              const canClaim =
                challenge.status === "finalized" &&
                participation.reward_usdc !== null &&
                !participation.reward_claimed;
              return (
                <li key={participation.id} className="challenges-tab__item challenges-tab__item--past">
                  <div className="challenges-tab__item-header">
                    <Link href={`/challenges/${challenge.slug}`} className="challenges-tab__item-title">
                      {challenge.title}
                    </Link>
                    <span className={`challenges-tab__badge challenges-tab__badge--${challenge.status}`}>
                      {challenge.status}
                    </span>
                  </div>
                  <div className="challenges-tab__item-stats">
                    <span className="challenges-tab__stat">
                      <span className="challenges-tab__stat-value">{Number(participation.kg_burned).toFixed(1)} kg</span>
                      <span className="challenges-tab__stat-label">burned</span>
                    </span>
                    {participation.reward_usdc !== null && (
                      <span className="challenges-tab__stat">
                        <span className="challenges-tab__stat-value challenges-tab__stat-value--reward">
                          ${participation.reward_usdc.toFixed(2)} USDC
                        </span>
                        <span className="challenges-tab__stat-label">reward</span>
                      </span>
                    )}
                  </div>
                  {participation.reward_claimed && (
                    <p className="challenges-tab__claimed">Reward claimed</p>
                  )}
                  {canClaim && (
                    <ClaimButton
                      slug={challenge.slug}
                      onClaimed={fetchParticipations}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
