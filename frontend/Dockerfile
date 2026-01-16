FROM node:25-alpine AS dev

ARG UID=1000
ARG GID=1000

ENV HOME /home/bacmet
ENV NEXT_TELEMETRY_DISABLED 1
ENV XDG_CACHE_HOME="$HOME/.cache"

RUN install -d -o "$UID" -g "$GID" \
	"$HOME" \
	"$HOME/frontend" \
	"$XDG_CACHE_HOME"

USER "$UID:$GID"
WORKDIR "$HOME/frontend"

CMD npm ci && npm run dev
