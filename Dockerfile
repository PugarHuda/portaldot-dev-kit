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
RUN npm run build

# Copy shared KB + index into the image next to dist/ so the parent
# path lookups in kb.ts still find them at runtime.
COPY pdk/data /pdk-data

# --- runtime stage ---
FROM node:22-alpine AS runtime

LABEL org.opencontainers.image.title="pdk-ts"
LABEL org.opencontainers.image.description="TypeScript companion CLI for PDK (Portaldot Dev Kit) — decode failed Portaldot transactions."
LABEL org.opencontainers.image.url="https://portaldot-pdk.vercel.app"
LABEL org.opencontainers.image.source="https://github.com/PugarHuda/portaldot-hackathon-2026-pdk-AmpunBang"
LABEL org.opencontainers.image.licenses="MIT"

WORKDIR /app

# Install production deps only into the runtime image
COPY pdk-ts/package.json pdk-ts/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

# Bring compiled JS + KB data
COPY --from=builder /build/dist ./dist
COPY --from=builder /pdk-data ./pdk-data

ENV PDK_KB_PATH=/app/pdk-data/error_fixes.yaml
ENV PDK_INDEX_PATH=/app/pdk-data/error_index.json

# Least privilege — no reason for pdk-ts to hold root inside the container.
RUN addgroup -S pdk && adduser -S pdk -G pdk && chown -R pdk:pdk /app
USER pdk

ENTRYPOINT ["node", "/app/dist/index.js"]
CMD ["--help"]
