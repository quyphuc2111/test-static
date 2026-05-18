#!/bin/sh
# Entrypoint cho Docker container — chạy migration + (tuỳ chọn) seed trước khi start app
set -e

echo "[entrypoint] Running prisma migrate deploy..."
node ./node_modules/prisma/build/index.js migrate deploy --schema=./prisma/schema.prisma || {
  echo "[entrypoint] Migration failed — startup aborted"
  exit 1
}

# Seed dữ liệu khởi tạo (RBAC + test users). Mặc định BẬT để lần deploy đầu có sẵn admin
# đăng nhập được. Mọi script seed đều dùng `upsert` nên chạy lại không tạo trùng/ghi đè dữ liệu.
# Nếu muốn tắt (vd: production sau khi đã seed lần đầu), set RUN_SEED=false trong compose/env.
if [ "${RUN_SEED:-true}" = "true" ]; then
  echo "[entrypoint] Seeding RBAC (permissions + roles)..."
  node ./scripts/seed-rbac.js || {
    echo "[entrypoint] Seed RBAC failed — startup aborted"
    exit 1
  }

  echo "[entrypoint] Seeding test users (admin/dev/tester)..."
  node ./scripts/seed-test-users.js || {
    echo "[entrypoint] Seed test users failed — startup aborted"
    exit 1
  }
else
  echo "[entrypoint] RUN_SEED=${RUN_SEED} — bỏ qua bước seed."
fi

echo "[entrypoint] Starting Next.js standalone server on ${HOSTNAME:-0.0.0.0}:${PORT:-3000}..."
exec node server.js
