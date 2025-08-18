########################################
FROM node:22-alpine3.22 AS dev
ARG FRONTEND_SRC_DIR=/opt/bacmet/frontend

RUN mkdir -p "$FRONTEND_SRC_DIR"
WORKDIR "$FRONTEND_SRC_DIR"

USER 1000:1000
CMD npm ci && npm run dev
