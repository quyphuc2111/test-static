# Dockerfile cho Next.js 15 (App Router) standalone build
# Tối ưu cho Linux (alpine) + Cloudflare front
FROM node:20-alpine AS base

# Cài đặt dependencies cần thiết (libc6-compat cho Prisma + curl cho healthcheck + openssl cho Prisma engine)
RUN apk add --no-cache libc6-compat curl git unzip openssl
WORKDIR /app

# Cài đặt pnpm
RUN npm install -g pnpm

# Copy package files (kèm .npmrc để pnpm hoist Prisma packages — xem .npmrc)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

# Install dependencies
FROM base AS deps
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client (cần engine cho Linux/musl)
RUN pnpm prisma:generate

# Build-time args cho các biến NEXT_PUBLIC_* (Next.js inline trực tiếp vào client bundle khi
# `next build` chạy, không thể đổi ở runtime). Compose có thể truyền các giá trị này qua
# `build.args` để mỗi môi trường có domain riêng mà không cần sửa .env.
# Mặc định để rỗng — đẩy về relative URL "/api" trong src/constants/apiUrl.ts (phù hợp khi
# đứng sau reverse proxy như Traefik/Cloudflare). Nếu không truyền, giữ nguyên giá trị từ .env.
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}

# Build ứng dụng Next.js (output: standalone)
# Lưu ý: gọi thẳng `next build` thay vì `pnpm build` để bỏ qua scripts/copyFiles.js
# (script đó dùng cho packaging release ra thư mục host, không cần khi build trong Docker).
ENV NEXT_TELEMETRY_DISABLED 1
RUN pnpm exec next build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Tạo user non-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application (standalone đã bao gồm tất cả production deps cần thiết)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy Prisma schema, migrations, seed scripts cho runtime migrate deploy
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# Copy TOÀN BỘ node_modules từ builder, đè lên node_modules rút gọn của Next.js standalone.
# Lý do: Prisma CLI (>= 6.16) nạp `@prisma/config`, gói này lại require `effect` cùng nhiều
# transitive deps khác. Nếu chỉ copy chọn lọc `prisma/`, `@prisma/`, `.prisma/` thì sẽ thiếu
# `effect` và bất cứ dep mới nào Prisma thêm trong các bản nâng cấp về sau, gây lỗi runtime
# `Cannot find module 'effect'` khi chạy `prisma migrate deploy`. Standalone node_modules là
# subset của full node_modules nên overlay an toàn cho Next.js server.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Đảm bảo entrypoint executable
RUN chmod +x /app/scripts/docker-entrypoint.sh

# Đảm bảo thư mục uploads tồn tại và writable bởi user nextjs (volume mount sẽ override khi mount)
RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public/uploads

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Health check trỏ tới /api/health (route đã được tạo trong src/app/api/health/route.ts)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["/app/scripts/docker-entrypoint.sh"]
