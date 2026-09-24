# syntax=docker/dockerfile:1.7

ARG NODE_IMAGE=node:24-bookworm-slim

FROM ${NODE_IMAGE} AS build

WORKDIR /app

COPY --link package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci --no-audit --no-fund

COPY --link . .
RUN npm run build

FROM ${NODE_IMAGE} AS runtime

ENV NODE_ENV=production \
    PORT=4000

WORKDIR /app

COPY --link --from=build --chown=node:node \
    /app/dist/doctor-appointment-app ./dist/doctor-appointment-app

USER node

EXPOSE 4000

CMD ["node", "dist/doctor-appointment-app/server/server.mjs"]