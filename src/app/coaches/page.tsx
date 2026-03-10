"use client";

import Header from "@/components/Header";

interface Coach {
  id: string;
  name: string;
  handle: string;
  approach: string;
  totalBurned: number;
  memberCount: number;
  active: boolean;
}

const MOCK_COACHES: Coach[] = [
  {
    id: "1",
    name: "Coach Alex",
    handle: "coach_alex.base.eth",
    approach: "Keto + Intermittent Fasting",
    totalBurned: 2847,
    memberCount: 34,
    active: true,
  },
  {
    id: "2",
    name: "Maria Santos",
    handle: "maria_fit.base.eth",
    approach: "HIIT & Caloric Deficit",
    totalBurned: 1523,
    memberCount: 22,
    active: true,
  },
  {
    id: "3",
    name: "Coach K",
    handle: "coach_k.base.eth",
    approach: "Strength Training + Zone 2 Cardio",
    totalBurned: 3201,
    memberCount: 48,
    active: true,
  },
  {
    id: "4",
    name: "Jake Ironwill",
    handle: "ironwill.base.eth",
    approach: "Carnivore Diet + Cold Exposure",
    totalBurned: 891,
    memberCount: 12,
    active: true,
  },
  {
    id: "5",
    name: "Priya Wellness",
    handle: "priya.base.eth",
    approach: "Plant-Based + Yoga",
    totalBurned: 1105,
    memberCount: 19,
    active: false,
  },
  {
    id: "6",
    name: "Coach Thunder",
    handle: "thunder.base.eth",
    approach: "CrossFit + Macro Tracking",
    totalBurned: 4120,
    memberCount: 56,
    active: true,
  },
];

function formatKg(kg: number): string {
  return kg.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export default function CoachesPage() {
  const coaches = MOCK_COACHES;

  return (
    <>
      <Header />
      <div className="coaches page-body">
        <div className="coaches__header">
          <h1 className="coaches__title">Coaches</h1>
          <p className="coaches__subtitle">Registered coaches and their collective burn results</p>
          <p className="coaches__preview-note">Preview — data shown is illustrative</p>
        </div>

        <div className="coaches__grid">
          {coaches.map((coach) => (
            <div key={coach.id} className="coaches__card">
              <div className="coaches__card-top">
                <div className="coaches__card-avatar">
                  {coach.name.charAt(0)}
                </div>
                <div className="coaches__card-info">
                  <h3 className="coaches__card-name">{coach.name}</h3>
                  <p className="coaches__card-handle">{coach.handle}</p>
                </div>
                {coach.active && <span className="coaches__card-badge">Active</span>}
              </div>

              <p className="coaches__card-approach">{coach.approach}</p>

              <div className="coaches__card-stats">
                <div className="coaches__card-stat">
                  <span className="coaches__card-stat-value">{formatKg(coach.totalBurned)} kg</span>
                  <span className="coaches__card-stat-label">total burned</span>
                </div>
                <div className="coaches__card-stat">
                  <span className="coaches__card-stat-value">{coach.memberCount}</span>
                  <span className="coaches__card-stat-label">members</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
