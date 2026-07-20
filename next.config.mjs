/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // NOTE: deliberately NOT using output:"standalone" — it is incompatible with
  // `next start` (the documented run command in DEPLOY.md and the Dockerfile).
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
  async headers() {
    // Safe hardening headers applied to every response. These do not break
    // analytics/reCAPTCHA (unlike a strict CSP, which is documented in DEPLOY.md
    // for teams that want to enable it after testing their integrations).
    const security = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-DNS-Prefetch-Control", value: "on" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()" },
      // HSTS only meaningful over HTTPS; harmless otherwise. 2 years + preload-ready.
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
    ];
    return [{ source: "/:path*", headers: security }];
  },
};

export default nextConfig;
