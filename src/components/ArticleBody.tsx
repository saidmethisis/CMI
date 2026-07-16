"use client";
import Icon from "./Icon";

const IMG_RE = /^!\[(.*?)\]\((.+)\)$/;

export function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text.split("\n\n").map((block, i) => {
        const img = block.trim().match(IMG_RE);
        if (img) {
          return (
            <figure key={i} className="my-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img[2]} alt={img[1] || ""} className="w-full rounded-xl object-cover" />
              {img[1] && <figcaption className="mt-1.5 text-center text-xs text-black/50 dark:text-white/50">{img[1]}</figcaption>}
            </figure>
          );
        }
        return block.startsWith("•") || block.includes("\n•") ? (
          <ul key={i} className="my-4 space-y-1.5 pl-1">
            {block.split("\n").map((li, j) => (
              <li key={j} className="flex gap-2"><span className="text-accent">—</span><span>{li.replace(/^•\s*/, "")}</span></li>
            ))}
          </ul>
        ) : block.startsWith("Ключевые факты:") ? (
          <p key={i} className="mt-4 font-semibold">{block}</p>
        ) : (
          <p key={i} className="my-4 leading-relaxed">{block}</p>
        );
      })}
    </>
  );
}

export function AiSummary({ text, label }: { text: string; label: string }) {
  return (
    <div className="card mb-6 overflow-hidden border-brand/20 bg-brand/[0.04] dark:bg-brand/[0.08]">
      <div className="flex items-center gap-2 px-4 py-3 font-semibold">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-brand text-[10px] text-white">AI</span>
        {label}
      </div>
      <div className="border-t border-brand/15 px-4 py-3 text-sm"><Paragraphs text={text} /></div>
    </div>
  );
}

export function AuthorSocials({ socials, label }: { socials?: { label: string; url: string }[]; label: string }) {
  if (!socials || socials.length === 0) return null;
  return (
    <div className="mt-8 card p-4">
      <div className="mb-2 text-sm font-semibold">{label}</div>
      <div className="flex flex-wrap gap-2">
        {socials.map((s, i) => (
          <a key={i} href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="chip hover:bg-black/5 dark:hover:bg-white/10">
            <Icon name="link" size={14} /> {s.label}
          </a>
        ))}
      </div>
    </div>
  );
}
