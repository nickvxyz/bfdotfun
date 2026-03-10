"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import Header from "@/components/Header";

interface NavItem {
  label: string;
  href: string;
  requiresRetroCheck?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/profile" },
  { label: "Weight Log", href: "/profile/entries" },
  { label: "Submit", href: "/profile/submit" },
  { label: "Claim Past Loss", href: "/profile/retrospective", requiresRetroCheck: true },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
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

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (item.requiresRetroCheck && user.has_used_retrospective) {
      return false;
    }
    return true;
  });

  const isActive = (href: string): boolean => {
    if (href === "/profile") return pathname === "/profile";
    return pathname.startsWith(href);
  };

  return (
    <div className="dash page-body">
      <Header />
      <nav className="profile-subnav" aria-label="Profile navigation">
        <div className="profile-subnav__tabs" role="tablist">
          {visibleNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="tab"
              aria-selected={isActive(item.href)}
              className={`profile-subnav__tab${isActive(item.href) ? " profile-subnav__tab--active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
      <main className="dash__main">{children}</main>
    </div>
  );
}
