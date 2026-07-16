"use client";
import { useEffect, useRef } from "react";
import { RECAPTCHA_SITE_KEY } from "@/lib/recaptcha";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window { grecaptcha?: any }
}

// Real Google reCAPTCHA v2 ("I'm not a robot") checkbox widget.
// Loads the official api.js and renders explicitly; emits the response token via onToken.
export default function GoogleRecaptcha({ onToken }: { onToken: (t: string) => void }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const render = () => {
      if (cancelled || !boxRef.current || widgetId.current !== null || !window.grecaptcha?.render) return;
      widgetId.current = window.grecaptcha.render(boxRef.current, {
        sitekey: RECAPTCHA_SITE_KEY,
        callback: (t: string) => onToken(t),
        "expired-callback": () => onToken(""),
        "error-callback": () => onToken(""),
      });
    };

    if (window.grecaptcha?.render) { render(); return; }

    const id = "recaptcha-api-js";
    if (!document.getElementById(id)) {
      const s = document.createElement("script");
      s.id = id;
      s.src = "https://www.google.com/recaptcha/api.js?render=explicit&hl=ru";
      s.async = true; s.defer = true;
      document.head.appendChild(s);
    }
    const iv = setInterval(() => {
      if (window.grecaptcha?.render) { clearInterval(iv); render(); }
    }, 200);
    return () => { cancelled = true; clearInterval(iv); };
  }, [onToken]);

  return <div ref={boxRef} className="min-h-[78px]" />;
}
