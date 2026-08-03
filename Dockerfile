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
# Заглушка: `next build` может дёрнуть Prisma, но к базе не подключается.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
RUN npx prisma generate && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000
# Приложение + зависимости (нужны, чтобы на старте отработали миграции Prisma).
COPY --from=build /app ./
# Загруженные медиа переживают пересоздание контейнера (см. docker-compose.yml).
VOLUME ["/app/public/uploads"]
EXPOSE 3000
# На старте: применяем миграции, затем поднимаем Next.
# Именно `migrate deploy`, а не `db push`: он применяет только зафиксированные
# в репозитории миграции, никогда не удаляет данные и падает при расхождении —
# то есть контейнер не поднимется вместо того, чтобы молча испортить боевую базу.
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
