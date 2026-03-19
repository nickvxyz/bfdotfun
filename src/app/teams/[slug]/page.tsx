"use client";

import { useState, useEffect, useMemo, use } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import TeamCounter from "@/components/TeamCounter";
import ProgressBar from "@/components/ProgressBar";
import { useAuth } from "@/lib/auth";

interface TeamData {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  total_kg_burned: number;
  total_kg_submitted: number;
  member_count: number;
  owner_id: string;
  owner_name: string;
}

interface MemberData {
  user_id: string;
  display_name: string;
  starting_weight: number | null;
  goal_weight: number | null;
  total_burned: number;
  last_weight: number | null;
  joined_at: string | null;
}

type SortKey = "joined" | "burned" | "progress";

function calcProgress(member: MemberData): number {
  if (!member.starting_weight || !member.goal_weight || !member.last_weight) return 0;
  const total = member.starting_weight - member.goal_weight;
  if (total <= 0) return 0;
  const lost = member.starting_weight - member.last_weight;
  return Math.min(100, Math.max(0, Math.round((lost / total) * 100)));
}

export default function TeamDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { user } = useAuth();

  const [team, setTeam] = useState<TeamData | null>(null);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Join flow
  const [joinStatus, setJoinStatus] = useState<"idle" | "pending" | "submitting">("idle");
  const [inviteCode, setInviteCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [showInviteInput, setShowInviteInput] = useState(false);

  // Leave flow
  const [leaveConfirm, setLeaveConfirm] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Sort
  const [sortKey, setSortKey] = useState<SortKey>("burned");

  useEffect(() => {
    async function fetchTeam() {
      try {
        const res = await fetch(`/api/teams/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setTeam(data.team);
          setMembers(data.members || []);
        } else {
          const data = await res.json();
          setError(data.error || "Team not found");
        }
      } catch {
        setError("Failed to load team");
      }
      setLoading(false);
    }
    fetchTeam();
  }, [slug]);

  // Check if user has pending/active membership for this team
  useEffect(() => {
    if (!user || !team) return;
    async function checkMembership() {
      try {
        const res = await fetch("/api/teams/my");
        if (res.ok) {
          const data = await res.json();
          if (data.team?.id === team?.id && data.membership?.status === "pending") {
            setJoinStatus("pending");
          }
        }
      } catch { /* ignore */ }
    }
    checkMembership();
  }, [user, team]);

  const isOwner = user && team && user.id === team.owner_id;
  const isMember = user && team && members.some((m) => m.user_id === user.id);
  const hasTeam = !!user?.group_id;

  const canJoin = user && !hasTeam && !isMember && joinStatus !== "pending";

  const sortedMembers = useMemo(() => {
    const sorted = [...members];
    switch (sortKey) {
      case "burned":
        sorted.sort((a, b) => b.total_burned - a.total_burned);
        break;
      case "progress":
        sorted.sort((a, b) => calcProgress(b) - calcProgress(a));
        break;
      case "joined":
      default:
        sorted.sort((a, b) => {
          if (!a.joined_at || !b.joined_at) return 0;
          return a.joined_at.localeCompare(b.joined_at);
        });
    }
    return sorted;
  }, [members, sortKey]);

  const handleJoin = async () => {
    setJoinError("");
    setJoinStatus("submitting");
    try {
      const res = await fetch(`/api/teams/${slug}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteCode ? { invite_code: inviteCode } : {}),
      });
      if (res.ok) {
        setJoinStatus("pending");
      } else {
        const data = await res.json();
        setJoinError(data.error || "Failed to join");
        setJoinStatus("idle");
      }
    } catch {
      setJoinError("Network error");
      setJoinStatus("idle");
    }
  };

  const handleLeave = async () => {
    setLeaving(true);
    try {
      const res = await fetch(`/api/teams/${slug}/leave`, { method: "POST" });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        setJoinError(data.error || "Failed to leave");
      }
    } catch {
      setJoinError("Network error");
    }
    setLeaving(false);
    setLeaveConfirm(false);
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="team-detail"><p className="team-detail__loading">Loading...</p></main>
      </>
    );
  }

  if (error || !team) {
    return (
      <>
        <Header />
        <main className="team-detail">
          <p className="team-detail__error">{error || "Team not found"}</p>
          <Link href="/teams" className="back-link">&larr; Back to Teams</Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="team-detail">
        {/* Coach Hero */}
        <section className="coach-hero">
          <div className="coach-hero__avatar">
            {team.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="coach-hero__name">{team.name}</h1>
          {team.description && (
            <p className="coach-hero__tagline">{team.description}</p>
          )}
          <div className="coach-hero__proof">
            <span className="coach-hero__proof-item">
              {team.member_count} {team.member_count === 1 ? "member" : "members"}
            </span>
            <span className="coach-hero__proof-sep">&middot;</span>
            <span className="coach-hero__proof-item">
              {Number(team.total_kg_burned).toFixed(1)} kg burned together
            </span>
            <span className="coach-hero__proof-sep">&middot;</span>
            <span className="coach-hero__proof-item">
              by {team.owner_name}
            </span>
          </div>
        </section>

        {/* Join CTA — above the fold */}
        <section className="coach-cta">
          {joinStatus === "pending" && (
            <div className="coach-cta__pending">
              <span className="coach-cta__pending-icon">&#9203;</span>
              <span>Your request is pending — the coach will review it soon.</span>
            </div>
          )}

          {canJoin && (joinStatus === "idle" || joinStatus === "submitting") && (
            <div className="coach-cta__join">
              <button
                className="cta coach-cta__btn"
                onClick={handleJoin}
                disabled={joinStatus === "submitting"}
                aria-label={`Join ${team.name}`}
              >
                {joinStatus === "submitting" ? "Submitting..." : `Join ${team.name}`}
              </button>
              <p className="coach-cta__sub">Free to join. Your burns pool to the team.</p>
              {!showInviteInput ? (
                <button
                  className="coach-cta__invite-toggle"
                  onClick={() => setShowInviteInput(true)}
                >
                  Have an invite code?
                </button>
              ) : (
                <div className="coach-cta__invite-form">
                  <label htmlFor="invite-code" className="sr-only">Invite code</label>
                  <input
                    id="invite-code"
                    type="text"
                    className="coach-cta__invite-input"
                    placeholder="Enter invite code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    disabled={joinStatus === "submitting"}
                  />
                </div>
              )}
            </div>
          )}

          {isMember && !isOwner && (
            <div className="coach-cta__member">
              <p className="coach-cta__member-badge">You&apos;re a member of this team</p>
              {leaveConfirm ? (
                <div className="coach-cta__leave-confirm">
                  <p>Leave {team.name}? Your existing burns stay on the ledger.</p>
                  <button className="cta cta--inverted" onClick={handleLeave} disabled={leaving}>
                    {leaving ? "Leaving..." : "Confirm Leave"}
                  </button>
                  <button className="coach-cta__cancel" onClick={() => setLeaveConfirm(false)}>Cancel</button>
                </div>
              ) : (
                <button className="coach-cta__leave-btn" onClick={() => setLeaveConfirm(true)}>Leave Team</button>
              )}
            </div>
          )}

          {isOwner && (
            <Link href={`/teams/${slug}/admin`} className="cta">
              Team Admin
            </Link>
          )}

          {joinError && <p className="coach-cta__error">{joinError}</p>}
        </section>

        {/* Counter */}
        <TeamCounter totalKg={Number(team.total_kg_burned)} />

        {/* Stats */}
        <div className="coach-stats">
          <div className="coach-stats__card">
            <span className="coach-stats__value">{Number(team.total_kg_burned).toFixed(1)}</span>
            <span className="coach-stats__label">Fat Burned</span>
            <span className="coach-stats__unit">kg</span>
          </div>
          <div className="coach-stats__card">
            <span className="coach-stats__value">{Number(team.total_kg_submitted).toFixed(1)}</span>
            <span className="coach-stats__label">On Global Ledger</span>
            <span className="coach-stats__unit">kg</span>
          </div>
          <div className="coach-stats__card">
            <span className="coach-stats__value">{team.member_count}</span>
            <span className="coach-stats__label">Team Members</span>
            <span className="coach-stats__unit">&nbsp;</span>
          </div>
        </div>

        {/* Leaderboard */}
        <section className="coach-leaderboard">
          <div className="coach-leaderboard__header">
            <h2 className="coach-leaderboard__title">Leaderboard</h2>
            <div className="coach-leaderboard__filters">
              <button
                className={`coach-leaderboard__filter${sortKey === "burned" ? " coach-leaderboard__filter--active" : ""}`}
                onClick={() => setSortKey("burned")}
              >
                Burned
              </button>
              <button
                className={`coach-leaderboard__filter${sortKey === "progress" ? " coach-leaderboard__filter--active" : ""}`}
                onClick={() => setSortKey("progress")}
              >
                Progress
              </button>
              <button
                className={`coach-leaderboard__filter${sortKey === "joined" ? " coach-leaderboard__filter--active" : ""}`}
                onClick={() => setSortKey("joined")}
              >
                Joined
              </button>
            </div>
          </div>

          {sortedMembers.map((member, index) => {
            const progress = calcProgress(member);
            return (
              <div key={member.user_id} className="coach-member">
                <span className="coach-member__rank">{index + 1}</span>
                <div className="coach-member__info">
                  <span className="coach-member__name">{member.display_name}</span>
                  <span className="coach-member__burned">{member.total_burned.toFixed(1)} kg</span>
                </div>
                <div className="coach-member__progress">
                  <ProgressBar progress={progress} />
                </div>
              </div>
            );
          })}

          {members.length === 0 && (
            <div className="coach-leaderboard__empty">
              <p>No members yet. Be the first to join and start burning.</p>
            </div>
          )}
        </section>

        {/* Back link at bottom */}
        <div className="coach-back">
          <Link href="/teams" className="back-link">&larr; All Teams</Link>
        </div>
      </main>
    </>
  );
}
