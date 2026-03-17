import Link from "next/link";

interface TeamCardProps {
  team: {
    slug: string;
    name: string;
    member_count: number;
    total_kg_burned: number;
    owner_name: string;
  };
}

export default function TeamCard({ team }: TeamCardProps) {
  return (
    <Link href={`/teams/${team.slug}`} className="team-card">
      <h3 className="team-card__name">{team.name}</h3>
      <div className="team-card__stats">
        <div className="team-card__stat">
          <span className="team-card__stat-value">{team.member_count}</span>
          <span className="team-card__stat-label">members</span>
        </div>
        <div className="team-card__stat">
          <span className="team-card__stat-value">{Number(team.total_kg_burned).toFixed(1)}</span>
          <span className="team-card__stat-label">kg burned</span>
        </div>
      </div>
      <p className="team-card__owner">by {team.owner_name}</p>
    </Link>
  );
}
