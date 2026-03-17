"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

export default function CreateTeamPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleNameChange = (value: string) => {
    setName(value);
    // Auto-generate slug from name
    setSlug(
      value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 40),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), slug: slug.trim(), description: description.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create team");
        setSubmitting(false);
        return;
      }

      const { team } = await res.json();
      router.push(`/teams/${team.slug}`);
    } catch {
      setError("Something went wrong");
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <main className="team-create-page">
        <h1 className="team-create-page__title">Create a Team</h1>

        <form className="team-create-page__form" onSubmit={handleSubmit}>
          <div className="team-create-page__field">
            <label className="team-create-page__label" htmlFor="team-name">Team Name</label>
            <input
              id="team-name"
              type="text"
              className="team-create-page__input"
              placeholder="e.g. Base Burners"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              maxLength={60}
            />
          </div>

          <div className="team-create-page__field">
            <label className="team-create-page__label" htmlFor="team-slug">URL Slug</label>
            <input
              id="team-slug"
              type="text"
              className="team-create-page__input"
              placeholder="e.g. base-burners"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              required
              maxLength={40}
              pattern="^[a-z0-9-]+$"
            />
            <span className="team-create-page__hint">burnfat.fun/teams/{slug || "..."}</span>
          </div>

          <div className="team-create-page__field">
            <label className="team-create-page__label" htmlFor="team-desc">Description</label>
            <textarea
              id="team-desc"
              className="team-create-page__input team-create-page__textarea"
              placeholder="What's this team about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={280}
            />
          </div>

          {error && <p className="team-create-page__error">{error}</p>}

          <button type="submit" className="cta cta--inverted" disabled={submitting}>
            <span>{submitting ? "Creating..." : "Create Team"}</span>
          </button>
        </form>
      </main>
    </>
  );
}
