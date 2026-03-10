"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import Header from "@/components/Header";

interface Challenge {
  id: string;
  slug: string;
  title: string;
  description: string;
  visibility: "public" | "private" | "invite_only";
  status: "draft" | "active" | "ended" | "finalized" | "cancelled";
  participant_count: number;
  total_kg_burned: number;
  prize_pool_usdc: number;
  ends_at: string;
  starts_at: string;
}

type FilterTab = "all" | "active" | "ended";

const VISIBILITY_LABEL: Record<string, string> = {
  public: "Public",
  private: "Private",
  invite_only: "Invite Only",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  active: "Active",
  ended: "Ended",
  finalized: "Finalized",
  cancelled: "Cancelled",
};

function daysRemaining(dateStr: string): string {
  const end = new Date(dateStr);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / 86400000);
  if (diff <= 0) return "Ended";
  if (diff === 1) return "1 day left";
  return `${diff} days left`;
}

export default function ChallengesPage() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChallenges() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (filter === "active") params.set("status", "active");
        if (filter === "ended") params.set("status", "ended");

        const res = await fetch(`/api/challenges?${params.toString()}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to load challenges");
        }
        const data = await res.json();
        setChallenges(data.challenges || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load challenges");
      } finally {
        setLoading(false);
      }
    }

    fetchChallenges();
  }, [filter]);

  return (
    <>
      <Header />
      <div className="challenges page-body">
        <div className="challenges__header">
          <div className="challenges__header-top">
            <div>
              <h1 className="challenges__title">Challenges</h1>
              <p className="challenges__subtitle">Compete, burn fat, win prizes</p>
            </div>
            {user && (
              <Link href="/challenges/create" className="challenges__create-btn" aria-label="Create a new challenge">
                Create Challenge +
              </Link>
            )}
          </div>

          <div className="challenges__filters" role="tablist" aria-label="Filter challenges">
            {(["all", "active", "ended"] as FilterTab[]).map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={filter === tab}
                className={`challenges__filter-tab${filter === tab ? " challenges__filter-tab--active" : ""}`}
                onClick={() => setFilter(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="challenges__loading">Loading challenges...</p>
        ) : error ? (
          <p className="challenges__error">{error}</p>
        ) : challenges.length === 0 ? (
          <div className="challenges__empty">
            <p className="challenges__empty-text">No challenges found.</p>
            <Link href="/challenges/create" className="challenges__empty-cta">
              Create the first one →
            </Link>
          </div>
        ) : (
          <div className="challenges__grid">
            {challenges.map((challenge) => (
              <Link
                key={challenge.id}
                href={`/challenges/${challenge.slug}`}
                className={`challenge-card${challenge.status !== "active" ? " challenge-card--ended" : ""}`}
                aria-label={`${challenge.title} — ${STATUS_LABEL[challenge.status]}`}
              >
                <div className="challenge-card__top">
                  <h3 className="challenge-card__title">{challenge.title}</h3>
                  <div className="challenge-card__badges">
                    <span className="challenge-card__badge challenge-card__badge--visibility">
                      {VISIBILITY_LABEL[challenge.visibility] || challenge.visibility}
                    </span>
                    <span className={`challenge-card__badge challenge-card__badge--status challenge-card__badge--${challenge.status}`}>
                      {STATUS_LABEL[challenge.status] || challenge.status}
                    </span>
                  </div>
                </div>

                {challenge.description && (
                  <p className="challenge-card__desc">{challenge.description}</p>
                )}

                <div className="challenge-card__stats">
                  <div className="challenge-card__stat">
                    <span className="challenge-card__stat-value">{challenge.participant_count}</span>
                    <span className="challenge-card__stat-label">participants</span>
                  </div>
                  <div className="challenge-card__stat">
                    <span className="challenge-card__stat-value">{Number(challenge.total_kg_burned).toFixed(1)} kg</span>
                    <span className="challenge-card__stat-label">burned</span>
                  </div>
                  <div className="challenge-card__stat">
                    <span className="challenge-card__stat-value">${Number(challenge.prize_pool_usdc).toLocaleString()}</span>
                    <span className="challenge-card__stat-label">prize pool</span>
                  </div>
                </div>

                <div className="challenge-card__footer">
                  <span className="challenge-card__timer">
                    {challenge.status === "active" ? daysRemaining(challenge.ends_at) : STATUS_LABEL[challenge.status]}
                  </span>
                  <span className="challenge-card__arrow">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
