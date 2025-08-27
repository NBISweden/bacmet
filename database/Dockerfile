FROM alpine:latest

RUN apk add --no-cache \
	sqlite~3 \
	miller~6

ARG UID=1000
RUN adduser -D -u "$UID" database

RUN mkdir -m 755 /data && chown -R database /data

WORKDIR /home/database

COPY sql/ ./sql/
COPY scripts/ ./scripts/
RUN chmod 755 scripts/*.sh
RUN mv scripts/start-script.sh .

ENV DATABASE=/data/database.db

USER database
CMD ./start-script.sh
