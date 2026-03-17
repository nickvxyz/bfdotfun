"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import TeamCard from "@/components/TeamCard";
import { useAuth } from "@/lib/auth";

interface Team {
  id: string;
  slug: string;
  name: string;
  member_count: number;
  total_kg_burned: number;
  owner_name: string;
}

export default function TeamsPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [canCreate, setCanCreate] = useState(false);

  useEffect(() => {
    async function fetchTeams() {
      try {
        const res = await fetch("/api/teams");
        if (res.ok) {
          const data = await res.json();
          setTeams(data.teams || []);
          if (data.can_create) setCanCreate(true);
        }
      } catch {
        // API not connected
      }
      setLoading(false);
    }
    fetchTeams();
  }, [user]);

  return (
    <>
      <Header />
      <main className="team-list-page">
        <div className="team-list-page__header">
          <div>
            <h1 className="team-list-page__title">Teams</h1>
            <p className="team-list-page__subtitle">
              Join a team, burn fat together, submit to the global ledger for free.
            </p>
          </div>
          {canCreate && (
            <Link href="/teams/create" className="cta cta--inverted team-list-page__create">
              <span>Create Team</span>
            </Link>
          )}
        </div>

        {loading && <p className="team-list-page__loading">Loading teams...</p>}

        {!loading && teams.length === 0 && (
          <div className="team-list-page__empty">
            <p>No teams yet. Check back soon.</p>
          </div>
        )}

        {!loading && teams.length > 0 && (
          <div className="team-list">
            {teams.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
