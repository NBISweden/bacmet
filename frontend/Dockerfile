FROM node:24-alpine AS dev

ARG UID=1000
ENV NEXT_TELEMETRY_DISABLED 1

WORKDIR /home/bacmet/frontend

USER $UID
CMD npm ci && npm run dev
