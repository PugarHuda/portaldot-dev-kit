# Multi-stage build for the Node.js side of PDK (`pdk-ts`). The image
# ships the built CLI so `docker run --rm portaldot-pdk-ts:<tag>
# explain --module 6 --error 2` works with no local install.

FROM node:22-alpine AS builder
WORKDIR /build

# Copy manifest first for cacheable install layer
COPY pdk-ts/package.json pdk-ts/package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY pdk-ts/tsconfig.json pdk-ts/tsconfig.build.json ./
COPY pdk-ts/src ./src
COPY pdk-ts/scripts ./scripts
# `npm run build` runs scripts/copy-data.mjs, which resolves the shared KB
# at ../../pdk/data relative to itself (the real repo layout: pdk-ts/ and
# pdk/ are siblings) — inside this build stage that's /pdk/data, so it has
# to exist at exactly that path before the build script runs.
COPY pdk/data /pdk/data
RUN npm run build

# --- runtime stage ---
FROM node:22-alpine AS runtime

LABEL org.opencontainers.image.title="pdk-ts"
LABEL org.opencontainers.image.description="TypeScript companion CLI for PDK (Portaldot Dev Kit) — decode failed Portaldot transactions."
LABEL org.opencontainers.image.url="https://portaldot-pdk.vercel.app"
LABEL org.opencontainers.image.source="https://github.com/PugarHuda/portaldot-dev-kit"
LABEL org.opencontainers.image.licenses="MIT"

WORKDIR /app

# Install production deps only into the runtime image
COPY pdk-ts/package.json pdk-ts/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

# dist/ already contains pdk-data/ (written by scripts/copy-data.mjs during
# the build) — the same dist/pdk-data/ layout the npm package ships, so
# kb.ts's own fallback resolution finds it with no env var needed.
COPY --from=builder /build/dist ./dist

# Least privilege — no reason for pdk-ts to hold root inside the container.
RUN addgroup -S pdk && adduser -S pdk -G pdk && chown -R pdk:pdk /app
USER pdk

ENTRYPOINT ["node", "/app/dist/index.js"]
CMD ["--help"]
