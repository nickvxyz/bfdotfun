"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Header from "@/components/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();

  const isAuthed = !!user;

  useEffect(() => {
    if (!loading && !isAuthed) {
      router.push("/");
    }
  }, [loading, isAuthed, router]);

  if (loading) {
    return (
      <div className="dash-loading">
        <p className="dash-loading__text">Loading...</p>
      </div>
    );
  }

  if (!isAuthed) {
    return null;
  }

  return (
    <div className="dash page-body">
      <Header />
      <main className="dash__main">{children}</main>
    </div>
  );
}
