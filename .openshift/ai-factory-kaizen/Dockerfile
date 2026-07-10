FROM registry.access.redhat.com/ubi9/nodejs-24

# Provenance: associate the image with its source repo (shown in GHCR).
LABEL org.opencontainers.image.source=https://github.com/GovAlta/ai-factory-kaizen

# Build output path mirrors the workspace layout (from the project's build target).
COPY ./packages/ai-factory-kaizen/dist .
COPY ./node_modules ./node_modules

CMD node main.js
