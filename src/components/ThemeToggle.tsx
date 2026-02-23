"use client";

import { useCallback, useSyncExternalStore } from "react";

function subscribe(cb: () => void) {
  const observer = new MutationObserver(cb);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

function getTheme() {
  return document.documentElement.getAttribute("data-theme") ?? "light";
}

function getServerTheme() {
  return "light";
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, getServerTheme);
  const dark = theme === "dark";

  const set = useCallback((next: boolean) => {
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    localStorage.setItem("theme", next ? "dark" : "light");
  }, []);

  return (
    <div className="theme-switcher" role="group" aria-label="Color theme">
      <button
        className={`theme-switcher__option${!dark ? " theme-switcher__option--active" : ""}`}
        onClick={() => set(false)}
        aria-pressed={!dark}
      >
        Light
      </button>
      <button
        className={`theme-switcher__option${dark ? " theme-switcher__option--active" : ""}`}
        onClick={() => set(true)}
        aria-pressed={dark}
      >
        Dark
      </button>
    </div>
  );
}
