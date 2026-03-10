"use client";

import Link from "next/link";
import Header from "@/components/Header";

export default function ChallengeError({ reset }: { error: Error; reset: () => void }) {
  return (
    <>
      <Header />
      <div className="challenge-detail page-body">
        <p className="challenge-detail__error">Something went wrong loading this challenge.</p>
        <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
          <button className="challenge-detail__join-retry" onClick={reset}>
            Try again
          </button>
          <Link href="/challenges" className="challenge-detail__back">← Back to Challenges</Link>
        </div>
      </div>
    </>
  );
}
