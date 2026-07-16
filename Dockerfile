# ── Asosiy Aktiv — production image ──────────────────────────────────────────
# Reliable single-image build (keeps Prisma CLI + engines for `prisma db push`).
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# NEXT_PUBLIC_* are inlined into the client bundle at BUILD time — pass them as
# build args (docker-compose passes these through; see docker-compose.yml).
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_RECAPTCHA_SITE_KEY
ARG NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
ARG NEXT_PUBLIC_YANDEX_VERIFICATION
ARG NEXT_PUBLIC_GA_ID
ARG NEXT_PUBLIC_GTM_ID
ARG NEXT_PUBLIC_YM_ID
ARG NEXT_PUBLIC_ORG_NAME
ARG NEXT_PUBLIC_ORG_FOUNDER
ARG NEXT_PUBLIC_ORG_EDITOR
ARG NEXT_PUBLIC_ORG_EMAIL
ARG NEXT_PUBLIC_ORG_PHONE
ARG NEXT_PUBLIC_ORG_ADDRESS
ARG NEXT_PUBLIC_ORG_SMI_CERT
ARG NEXT_PUBLIC_ORG_PD_REGISTRY
ARG NEXT_PUBLIC_ORG_AGE
# Dummy DB URL just so `next build` (which may touch Prisma) doesn't fail at build.
ENV DATABASE_URL="file:/tmp/build.db"
RUN npx prisma generate && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000
# App + deps (deps kept so `prisma db push` works at container start).
COPY --from=build /app ./
# Persist SQLite DB and uploaded media on named volumes (see docker-compose.yml).
VOLUME ["/data", "/app/public/uploads"]
EXPOSE 3000
# On boot: sync schema to the (persistent) DB, then start Next.
CMD ["sh", "-c", "npx prisma db push --skip-generate && npm run start"]
