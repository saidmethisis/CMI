"use client";
// Mock client-side "auth"/role switcher for the demo (no real JWT).
// Real build: NextAuth/JWT + RBAC per TZ §13/§15.
import { useEffect, useState } from "react";
import type { Role } from "./types";

const KEY = "aktiv.role";

export function useRole(): [Role, (r: Role) => void] {
  const [role, setRole] = useState<Role>("reader");
  useEffect(() => {
    const r = (localStorage.getItem(KEY) as Role) || "reader";
    setRole(r);
  }, []);
  const update = (r: Role) => {
    localStorage.setItem(KEY, r);
    setRole(r);
    window.dispatchEvent(new Event("aktiv-role"));
  };
  return [role, update];
}

export function useSaved(): [string[], (slug: string) => void] {
  const [saved, setSaved] = useState<string[]>([]);
  useEffect(() => {
    setSaved(JSON.parse(localStorage.getItem("aktiv.saved") || "[]"));
  }, []);
  const toggle = (slug: string) => {
    setSaved((prev) => {
      const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug];
      localStorage.setItem("aktiv.saved", JSON.stringify(next));
      return next;
    });
  };
  return [saved, toggle];
}
