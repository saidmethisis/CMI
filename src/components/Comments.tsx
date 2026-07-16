"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/useAuth";

interface Node {
  id: string; userId: string | null; author: string; authorAvatar: string; body: string; status: string;
  likes: number; dislikes: number; reports: number; pinned: boolean; edited: boolean; createdAt: string;
  myReaction: "like" | "dislike" | null; replies: Node[];
}

export default function Comments({ articleId }: { articleId: string }) {
  const { t } = useI18n();
  const { user, can } = useAuth();
  const [tree, setTree] = useState<Node[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState("");
  const isMod = can("comments.moderate");
  const notify = (m: string) => { setFlash(m); setTimeout(() => setFlash(""), 2500); };

  const load = useCallback(async () => {
    const r = await fetch(`/api/comments?articleId=${articleId}`, { cache: "no-store" });
    const j = await r.json();
    setTree(j.data ?? []);
  }, [articleId]);
  useEffect(() => { load(); }, [load]);

  const count = (nodes: Node[]): number => nodes.reduce((s, n) => s + 1 + count(n.replies), 0);

  const post = async (body: string, parentId?: string) => {
    if (!body.trim()) return;
    setBusy(true);
    const r = await fetch("/api/comments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ articleId, body, parentId }) });
    setBusy(false);
    if (r.status === 401) { notify(t("comments.onlyRegistered")); return; }
    setText(""); load();
  };

  return (
    <section className="mt-10" id="comments">
      <h2 className="mb-4 font-serif text-xl font-bold">{t("comments.title")} ({count(tree)})</h2>
      {flash && <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/85 px-4 py-2 text-sm text-white shadow-lg md:bottom-6">{flash}</div>}

      {user ? (
        <div className="card mb-5 p-3">
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder={t("comments.placeholder")} className="input resize-y" />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-black/40 dark:text-white/40">{t("comments.moderationNote")}</span>
            <button onClick={() => post(text)} disabled={busy} className="btn-primary">{t("comments.send")}</button>
          </div>
        </div>
      ) : (
        <p className="mb-5 text-sm text-black/60 dark:text-white/60">{t("comments.onlyRegistered")} <Link href="/login" className="text-brand dark:text-white underline">{t("auth.signin")}</Link></p>
      )}

      {tree.length === 0 ? (
        <p className="rounded-xl border border-black/5 bg-black/[0.02] px-4 py-6 text-center text-sm text-black/45 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/45">{t("comments.beFirst")}</p>
      ) : (
        <ul className="space-y-3">
          {tree.map((c) => <CommentItem key={c.id} node={c} depth={0} me={user?.id ?? null} isMod={isMod} loggedIn={!!user} onChange={load} onReply={post} onFlash={notify} />)}
        </ul>
      )}
    </section>
  );
}

function CommentItem({ node, depth, me, isMod, loggedIn, onChange, onReply, onFlash }: {
  node: Node; depth: number; me: string | null; isMod: boolean; loggedIn: boolean;
  onChange: () => void; onReply: (body: string, parentId?: string) => void; onFlash: (m: string) => void;
}) {
  const { t, lang } = useI18n();
  const loc = lang === "en" ? "en-US" : lang === "uz" ? "uz-UZ" : "ru-RU";
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(node.body);
  const [reply, setReply] = useState("");
  const mine = me && node.userId === me;

  const react = async (type: "like" | "dislike") => {
    const r = await fetch(`/api/comments/${node.id}/react`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type }) });
    if (r.status === 401) return onFlash(t("comments.loginToVote"));
    onChange();
  };
  const report = async () => { await fetch(`/api/comments/${node.id}/report`, { method: "POST" }); onFlash(t("comments.reported")); onChange(); };
  const del = async () => { if (!confirm(t("comments.confirmDelete"))) return; await fetch(`/api/comments/${node.id}`, { method: "DELETE" }); onChange(); };
  const saveEdit = async () => { await fetch(`/api/comments/${node.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "edit", body: draft }) }); setEditing(false); onChange(); };
  const pin = async () => { await fetch(`/api/comments/${node.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "pin", pinned: !node.pinned }) }); onChange(); };

  return (
    <li id={`c-${node.id}`} className={depth > 0 ? "ml-4 border-l border-black/10 pl-4 dark:border-white/10 sm:ml-6" : "scroll-mt-24"}>
      <div className={`card p-4 ${node.pinned ? "ring-1 ring-brand/40" : ""}`}>
        <div className="mb-1 flex items-center gap-2 text-sm">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-brand text-xs font-bold text-white">
            {node.authorAvatar ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={node.authorAvatar} alt="" className="h-full w-full rounded-full object-cover" /> : node.author.charAt(0)}
          </span>
          <span className="font-semibold">{node.author}</span>
          {node.pinned && <span className="chip !py-0 text-[10px] !border-brand/40 text-brand dark:text-white">{t("comments.pinnedBadge")}</span>}
          {node.status === "pending" && <span className="chip !py-0 text-[10px]">{t("comments.pendingBadge")}</span>}
          {node.edited && <span className="text-xs text-black/30">{t("comments.editedMark")}</span>}
          <span className="ml-auto text-xs text-black/40 dark:text-white/40">{new Date(node.createdAt).toLocaleDateString(loc)}</span>
        </div>

        {editing ? (
          <div className="mt-1">
            <textarea className="input resize-y" rows={2} value={draft} onChange={(e) => setDraft(e.target.value)} />
            <div className="mt-1 flex gap-2"><button className="btn-primary text-xs" onClick={saveEdit}>{t("comments.save")}</button><button className="btn-ghost text-xs" onClick={() => setEditing(false)}>{t("comments.cancel")}</button></div>
          </div>
        ) : (
          <p className="text-sm text-black/80 dark:text-white/80">{node.body}</p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-black/50 dark:text-white/50">
          <button onClick={() => react("like")} className={node.myReaction === "like" ? "font-semibold text-up" : "hover:text-up"}>▲ {node.likes}</button>
          <button onClick={() => react("dislike")} className={node.myReaction === "dislike" ? "font-semibold text-down" : "hover:text-down"}>▼ {node.dislikes}</button>
          {loggedIn && <button onClick={() => setReplying((v) => !v)} className="hover:text-brand dark:hover:text-white">{t("comments.reply")}</button>}
          {mine && !editing && <button onClick={() => setEditing(true)} className="hover:text-brand dark:hover:text-white">{t("comments.edit")}</button>}
          {(mine || isMod) && <button onClick={del} className="hover:text-down">{t("comments.delete")}</button>}
          {!mine && <button onClick={report} className="hover:text-down">{t("comments.report")}{node.reports > 0 ? ` (${node.reports})` : ""}</button>}
          {isMod && <button onClick={pin} className="hover:text-brand dark:hover:text-white">{node.pinned ? t("comments.unpin") : t("comments.pin")}</button>}
        </div>

        {replying && (
          <div className="mt-2">
            <textarea className="input resize-y" rows={2} value={reply} onChange={(e) => setReply(e.target.value)} placeholder={t("comments.replyPlaceholder")} />
            <div className="mt-1 flex gap-2"><button className="btn-primary text-xs" onClick={() => { onReply(reply, node.id); setReply(""); setReplying(false); }}>{t("comments.reply")}</button></div>
          </div>
        )}
      </div>

      {node.replies.length > 0 && (
        <ul className="mt-3 space-y-3">
          {node.replies.map((r) => <CommentItem key={r.id} node={r} depth={depth + 1} me={me} isMod={isMod} loggedIn={loggedIn} onChange={onChange} onReply={onReply} onFlash={onFlash} />)}
        </ul>
      )}
    </li>
  );
}
