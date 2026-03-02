"use client";

import { useState } from "react";
import Header from "@/components/Header";

interface Campaign {
  id: string;
  company: string;
  handle: string;
  campaignName: string;
  totalBurned: number;
  participants: number;
  prizePool: string;
  active: boolean;
  endsIn: string;
}

const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: "1",
    company: "Coinbase",
    handle: "coinbase.base.eth",
    campaignName: "Q1 Wellness Challenge",
    totalBurned: 8420,
    participants: 156,
    prizePool: "5,000 USDC",
    active: true,
    endsIn: "18 days",
  },
  {
    id: "2",
    company: "Farcaster",
    handle: "farcaster.base.eth",
    campaignName: "Ship & Shred",
    totalBurned: 3210,
    participants: 89,
    prizePool: "2,500 USDC",
    active: true,
    endsIn: "7 days",
  },
  {
    id: "3",
    company: "Base",
    handle: "base.base.eth",
    campaignName: "Build Onchain, Burn Offchain",
    totalBurned: 12750,
    participants: 234,
    prizePool: "10,000 USDC",
    active: true,
    endsIn: "32 days",
  },
  {
    id: "4",
    company: "Zora",
    handle: "zora.base.eth",
    campaignName: "New Year Burn",
    totalBurned: 5100,
    participants: 67,
    prizePool: "3,000 USDC",
    active: false,
    endsIn: "Ended",
  },
  {
    id: "5",
    company: "Aerodrome",
    handle: "aero.base.eth",
    campaignName: "DeFi Fitness Sprint",
    totalBurned: 1890,
    participants: 43,
    prizePool: "1,500 USDC",
    active: true,
    endsIn: "11 days",
  },
  {
    id: "6",
    company: "Uniswap",
    handle: "uni.base.eth",
    campaignName: "Swap Fat for Gains",
    totalBurned: 6340,
    participants: 112,
    prizePool: "7,500 USDC",
    active: false,
    endsIn: "Ended",
  },
];

function formatKg(kg: number): string {
  return kg.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export default function CompaniesPage() {
  const [campaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS);

  return (
    <>
      <Header />
      <div className="companies page-body">
        <div className="companies__header">
          <h1 className="companies__title">Companies</h1>
          <p className="companies__subtitle">Live wellness campaigns with prize pools</p>
          <p className="companies__preview-note">Preview — data shown is illustrative</p>
        </div>

        <div className="companies__grid">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className={`companies__card${!campaign.active ? " companies__card--ended" : ""}`}>
              <div className="companies__card-top">
                <div className="companies__card-avatar">
                  {campaign.company.charAt(0)}
                </div>
                <div className="companies__card-info">
                  <h3 className="companies__card-company">{campaign.company}</h3>
                  <p className="companies__card-handle">{campaign.handle}</p>
                </div>
                <span className={`companies__card-badge${campaign.active ? " companies__card-badge--active" : " companies__card-badge--ended"}`}>
                  {campaign.active ? "Live" : "Ended"}
                </span>
              </div>

              <h4 className="companies__card-campaign">{campaign.campaignName}</h4>

              <div className="companies__card-stats">
                <div className="companies__card-stat">
                  <span className="companies__card-stat-value">{formatKg(campaign.totalBurned)} kg</span>
                  <span className="companies__card-stat-label">burned</span>
                </div>
                <div className="companies__card-stat">
                  <span className="companies__card-stat-value">{campaign.participants}</span>
                  <span className="companies__card-stat-label">participants</span>
                </div>
                <div className="companies__card-stat">
                  <span className="companies__card-stat-value">{campaign.prizePool}</span>
                  <span className="companies__card-stat-label">prize pool</span>
                </div>
              </div>

              <div className="companies__card-footer">
                <span className="companies__card-timer">
                  {campaign.active ? `Ends in ${campaign.endsIn}` : campaign.endsIn}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
