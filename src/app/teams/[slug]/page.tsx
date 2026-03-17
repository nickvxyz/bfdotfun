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

  // Leave flow
  const [leaveConfirm, setLeaveConfirm] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Sort
  const [sortKey, setSortKey] = useState<SortKey>("joined");

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

  const unsubmittedKg = Number(team.total_kg_burned) - Number(team.total_kg_submitted);

  return (
    <>
      <Header />
      <main className="team-detail">
        <Link href="/teams" className="back-link">&larr; Back to Teams</Link>

        <div className="team-detail__header">
          <h1 className="team-detail__name">{team.name}</h1>
          {team.description && <p className="team-detail__desc">{team.description}</p>}
          <p className="team-detail__meta">{team.member_count} members &middot; by {team.owner_name}</p>
        </div>

        <TeamCounter totalKg={Number(team.total_kg_burned)} />

        <div className="team-detail__stats">
          <div className="stats-grid__card">
            <span className="stats-grid__value">{Number(team.total_kg_burned).toFixed(1)}</span>
            <span className="stats-grid__label">kg burned</span>
          </div>
          <div className="stats-grid__card">
            <span className="stats-grid__value">{Number(team.total_kg_submitted).toFixed(1)}</span>
            <span className="stats-grid__label">kg on global ledger</span>
          </div>
          <div className="stats-grid__card">
            <span className="stats-grid__value">{unsubmittedKg.toFixed(1)}</span>
            <span className="stats-grid__label">kg ready to submit</span>
          </div>
        </div>

        {/* Join / Leave / Admin actions */}
        <div className="team-join">
          {joinStatus === "pending" && (
            <div className="team-join__pending">
              <span className="team-join__pending-badge">Request Pending — Awaiting Approval</span>
            </div>
          )}

          {canJoin && (joinStatus === "idle" || joinStatus === "submitting") && (
            <div className="team-join__form">
              <label htmlFor="invite-code" className="sr-only">Invite code (optional)</label>
              <input
                id="invite-code"
                type="text"
                className="team-join__code-input"
                placeholder="Invite code (optional)"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                disabled={joinStatus === "submitting"}
              />
              <button
                className="cta"
                onClick={handleJoin}
                disabled={joinStatus === "submitting"}
              >
                {joinStatus === "submitting" ? "Submitting..." : "Request to Join"}
              </button>
            </div>
          )}

          {isMember && !isOwner && (
            <div className="team-join__leave">
              {leaveConfirm ? (
                <>
                  <p className="team-join__leave-confirm">Leave {team.name}? Your existing burns will remain.</p>
                  <button className="cta cta--inverted" onClick={handleLeave} disabled={leaving}>
                    {leaving ? "Leaving..." : "Confirm Leave"}
                  </button>
                  <button className="team-join__cancel" onClick={() => setLeaveConfirm(false)}>Cancel</button>
                </>
              ) : (
                <button className="team-join__leave-btn" onClick={() => setLeaveConfirm(true)}>Leave Team</button>
              )}
            </div>
          )}

          {isOwner && (
            <Link href={`/teams/${slug}/admin`} className="cta">
              Team Admin
            </Link>
          )}

          {joinError && <p className="team-join__error">{joinError}</p>}
        </div>

        {/* Member list */}
        <div className="team-members">
          <div className="team-members__header">
            <h2 className="team-members__title">Members ({members.length})</h2>
            <div className="team-members__filters">
              <button
                className={`team-members__filter${sortKey === "joined" ? " team-members__filter--active" : ""}`}
                onClick={() => setSortKey("joined")}
              >
                Joined
              </button>
              <button
                className={`team-members__filter${sortKey === "burned" ? " team-members__filter--active" : ""}`}
                onClick={() => setSortKey("burned")}
              >
                Burned
              </button>
              <button
                className={`team-members__filter${sortKey === "progress" ? " team-members__filter--active" : ""}`}
                onClick={() => setSortKey("progress")}
              >
                Progress
              </button>
            </div>
          </div>

          {sortedMembers.map((member) => {
            const progress = calcProgress(member);
            return (
              <div key={member.user_id} className="team-member">
                <div className="team-member__info">
                  <span className="team-member__name">{member.display_name}</span>
                  <span className="team-member__burned">{member.total_burned.toFixed(1)} kg burned</span>
                  {member.joined_at && (
                    <span className="team-member__joined">
                      Joined {new Date(member.joined_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="team-member__progress">
                  <ProgressBar progress={progress} />
                </div>
              </div>
            );
          })}

          {members.length === 0 && (
            <p className="team-members__empty">No members yet.</p>
          )}
        </div>
      </main>
    </>
  );
}
