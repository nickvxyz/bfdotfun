"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function ReferralLandingPage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;

  useEffect(() => {
    if (code) {
      try {
        localStorage.setItem("bf_ref_code", code.toLowerCase());
      } catch {
        // localStorage may be unavailable in some contexts
      }
    }
    router.replace("/");
  }, [code, router]);

  return null;
}
