"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

export default function FollowButton({
  type, id, showCount = true, className = "",
}: {
  type: "author" | "topic"; id: string; label?: string; showCount?: boolean; className?: string;
}) {
  const { t, lang } = useI18n();
  const loc = lang === "en" ? "en-US" : lang === "uz" ? "uz-UZ" : "ru-RU";
  const [following, setFollowing] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch(`/api/follow/status?type=${type}&id=${encodeURIComponent(id)}`, { cache: "no-store" });
        const j = await r.json();
        if (alive) { setFollowing(j.following); setCount(j.count); }
      } catch { /* */ }
    })();
    return () => { alive = false; };
  }, [type, id]);

  const toggle = async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/follow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetType: type, targetId: id }) });
      if (!r.ok) {
        // не авторизован → отправляем на вход (частый случай для подписки)
        if (r.status === 401) window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      const j = await r.json();
      setFollowing(j.data.following); setCount(j.data.count);
    } finally { setBusy(false); }
  };

  return (
    <button onClick={toggle} disabled={busy} className={`${following ? "btn-ghost" : "btn-accent"} ${className}`}>
      {following ? t("follow.following") : t("follow.follow")}
      {showCount && count != null ? ` · ${count.toLocaleString(loc)}` : ""}
    </button>
  );
}
