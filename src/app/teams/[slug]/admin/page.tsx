"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { useAuth } from "@/lib/auth";

interface Membership {
  id: string;
  user_id: string;
  status: string;
  display_name: string;
  total_burned: number;
  requested_at: string;
  resolved_at: string | null;
}

interface InviteCode {
  id: string;
  code: string;
  max_uses: number;
  use_count: number;
  created_at: string;
}

interface TeamInfo {
  id: string;
  slug: string;
  name: string;
  owner_id: string;
  total_kg_burned: number;
  total_kg_submitted: number;
}

export default function TeamAdminPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { user } = useAuth();

  const [team, setTeam] = useState<TeamInfo | null>(null);
  const [members, setMembers] = useState<Membership[]>([]);
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState("");
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  // Invite code generation
  const [generatingCode, setGeneratingCode] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [teamRes, membersRes, codesRes] = await Promise.all([
          fetch(`/api/teams/${slug}`),
          fetch(`/api/teams/${slug}/members`),
          fetch(`/api/teams/${slug}/invites`),
        ]);

        if (teamRes.ok) {
          const data = await teamRes.json();
          setTeam(data.team);
        } else {
          setError("Team not found or access denied");
        }

        if (membersRes.ok) {
          const data = await membersRes.json();
          setMembers(data.members || []);
        }

        if (codesRes.ok) {
          const data = await codesRes.json();
          setCodes(data.codes || []);
        }
      } catch {
        setError("Failed to load team data");
      }
      setLoading(false);
    }
    fetchData();
  }, [slug]);

  const handleMemberAction = async (membershipId: string, action: "approve" | "reject") => {
    try {
      const res = await fetch(`/api/teams/${slug}/members/${membershipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const data = await res.json();
        setMembers((prev) =>
          prev.map((m) => (m.id === membershipId ? { ...m, status: data.membership.status } : m)),
        );
        // Refresh team data to get updated member count
        const teamRes = await fetch(`/api/teams/${slug}`);
        if (teamRes.ok) {
          const teamData = await teamRes.json();
          setTeam(teamData.team);
        }
      }
    } catch {
      // handle silently
    }
  };

  const handleGenerateCode = async () => {
    setGeneratingCode(true);
    try {
      const res = await fetch(`/api/teams/${slug}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ max_uses: 50 }),
      });
      if (res.ok) {
        const data = await res.json();
        setCodes((prev) => [...(data.codes || []), ...prev]);
      }
    } catch {
      // handle silently
    }
    setGeneratingCode(false);
  };

  const handleSubmitToGlobal = async () => {
    setSubmitting(true);
    setSubmitResult("");
    try {
      const res = await fetch(`/api/teams/${slug}/submit`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setSubmitResult(`Submitted ${data.submission.kg_total.toFixed(1)} kg to the Global Ledger`);
        setConfirmSubmit(false);
        // Refresh team data
        const teamRes = await fetch(`/api/teams/${slug}`);
        if (teamRes.ok) {
          const teamData = await teamRes.json();
          setTeam(teamData.team);
        }
      } else {
        const data = await res.json();
        setSubmitResult(data.error || "Submission failed");
      }
    } catch {
      setSubmitResult("Network error");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="team-admin"><p className="team-admin__loading">Loading...</p></main>
      </>
    );
  }

  if (error || !team) {
    return (
      <>
        <Header />
        <main className="team-admin">
          <p className="team-admin__error">{error}</p>
          <Link href="/teams" className="back-link">&larr; Back to Teams</Link>
        </main>
      </>
    );
  }

  // Verify ownership
  if (user?.id !== team.owner_id) {
    return (
      <>
        <Header />
        <main className="team-admin">
          <p className="team-admin__error">Access denied — owner only</p>
          <Link href={`/teams/${slug}`} className="back-link">&larr; Back to Team</Link>
        </main>
      </>
    );
  }

  const pendingMembers = members.filter((m) => m.status === "pending");
  const activeMembers = members.filter((m) => m.status === "active");
  const unsubmittedKg = Number(team.total_kg_burned) - Number(team.total_kg_submitted);

  return (
    <>
      <Header />
      <main className="team-admin">
        <Link href={`/teams/${slug}`} className="back-link">&larr; Back to {team.name}</Link>
        <h1 className="team-admin__title">{team.name} — Admin</h1>

        {/* Pending Requests */}
        <section className="team-admin__section">
          <h2 className="team-admin__section-title">
            Pending Requests ({pendingMembers.length})
          </h2>
          {pendingMembers.length === 0 ? (
            <p className="team-admin__empty">No pending requests</p>
          ) : (
            <div className="team-admin__pending">
              {pendingMembers.map((m) => (
                <div key={m.id} className="team-admin__pending-row">
                  <div className="team-admin__pending-info">
                    <span className="team-admin__pending-name">{m.display_name}</span>
                    <span className="team-admin__pending-date">
                      Requested {new Date(m.requested_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="team-admin__pending-actions">
                    <button
                      className="team-admin__approve-btn"
                      onClick={() => handleMemberAction(m.id, "approve")}
                    >
                      Approve
                    </button>
                    <button
                      className="team-admin__reject-btn"
                      onClick={() => handleMemberAction(m.id, "reject")}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Active Members */}
        <section className="team-admin__section">
          <h2 className="team-admin__section-title">
            Active Members ({activeMembers.length})
          </h2>
          {activeMembers.map((m) => (
            <div key={m.id} className="team-admin__member-row">
              <span className="team-admin__member-name">{m.display_name}</span>
              <span className="team-admin__member-burned">{m.total_burned.toFixed(1)} kg</span>
            </div>
          ))}
        </section>

        {/* Invite Codes */}
        <section className="team-admin__section">
          <h2 className="team-admin__section-title">Invite Codes</h2>
          <button
            className="cta"
            onClick={handleGenerateCode}
            disabled={generatingCode}
          >
            {generatingCode ? "Generating..." : "Generate Invite Code"}
          </button>
          {codes.length > 0 && (
            <div className="team-admin__codes">
              {codes.map((c) => (
                <div key={c.id} className="team-admin__code-row">
                  <code className="team-admin__code">{c.code}</code>
                  <span className="team-admin__code-uses">{c.use_count}/{c.max_uses} used</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Submit to Global */}
        <section className="team-admin__section team-admin__submit">
          <h2 className="team-admin__section-title">Submit to Global Ledger</h2>
          <p className="team-admin__submit-info">
            {unsubmittedKg.toFixed(1)} kg available to submit (free for teams)
          </p>

          {!confirmSubmit ? (
            <button
              className="cta"
              onClick={() => setConfirmSubmit(true)}
              disabled={unsubmittedKg <= 0}
            >
              Submit {unsubmittedKg.toFixed(1)} kg to Global Ledger
            </button>
          ) : (
            <div className="team-admin__submit-confirm">
              <p className="team-admin__submit-warning">
                This will submit {unsubmittedKg.toFixed(1)} kg from your team to the global counter.
              </p>
              <button
                className="cta"
                onClick={handleSubmitToGlobal}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Confirm Submit"}
              </button>
              <button className="team-admin__cancel" onClick={() => setConfirmSubmit(false)}>Cancel</button>
            </div>
          )}

          {submitResult && (
            <p className={`team-admin__submit-result${submitResult.startsWith("Submitted") ? " team-admin__submit-result--success" : " team-admin__submit-result--error"}`}>
              {submitResult}
            </p>
          )}
        </section>
      </main>
    </>
  );
}
