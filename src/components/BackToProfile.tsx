"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function BackToProfile() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <Link href="/profile" className="back-link" aria-label="Back to Profile">
      &larr; Back to Profile
    </Link>
  );
}
