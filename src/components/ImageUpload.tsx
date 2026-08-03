"use client";
import { useState } from "react";
import { uploadDataUrl } from "@/lib/upload";
import { useI18n } from "@/lib/i18n";

const OK = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

// Downscale + compress an image to a data-URI (keeps the DB payload small).
async function compress(file: File, maxW: number, quality = 0.82): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxW / bitmap.width);
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  const webp = canvas.toDataURL("image/webp", quality);
  return webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/jpeg", quality);
}

export default function ImageUpload({
  value, onChange, label, variant = "avatar", maxW = 800,
}: {
  value: string; onChange: (v: string) => void; label?: string; variant?: "avatar" | "banner"; maxW?: number;
}) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const pick = async (file?: File) => {
    setErr("");
    if (!file) return;
    if (!OK.includes(file.type)) { setErr(t("acc.imgFormats")); return; }
    if (file.size > 20 * 1024 * 1024) { setErr(t("acc.imgTooBig")); return; }
    setBusy(true);
    try { onChange(await uploadDataUrl(await compress(file, maxW))); } catch { setErr(t("acc.imgFailed")); } finally { setBusy(false); }
  };

  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div className="flex items-center gap-3">
        {variant === "avatar" ? (
          <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border border-black/10 bg-black/[0.04] text-black/30 dark:border-white/15 dark:bg-white/[0.06]">
            {value ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={value} alt="" className="h-full w-full object-cover" /> : "—"}
          </span>
        ) : (
          <span className="block h-16 w-32 shrink-0 overflow-hidden rounded-lg border border-black/10 bg-black/[0.04] dark:border-white/15 dark:bg-white/[0.06]">
            {value && /* eslint-disable-next-line @next/next/no-img-element */ <img src={value} alt="" className="h-full w-full object-cover" />}
          </span>
        )}
        <div className="flex flex-col gap-1.5">
          <label className="btn-ghost cursor-pointer text-xs">
            {value ? t("acc.replace") : t("acc.uploadFromDevice")}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
          </label>
          {value && <button type="button" className="text-left text-xs text-down" onClick={() => onChange("")}>{t("a.delete")}</button>}
        </div>
      </div>
      {busy && <p className="mt-1 text-xs text-black/40 dark:text-white/40">{t("acc.compressing")}</p>}
      {err && <p className="mt-1 text-xs text-down">{err}</p>}
    </div>
  );
}
